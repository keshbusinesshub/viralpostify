import { Injectable, NotFoundException, Inject, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { PrismaService } from '../../prisma/prisma.service';
import { TicketStatus, PostStatus, SubscriptionStatus, Plan, PaymentStatus, PaymentType } from '@prisma/client';
import Stripe from 'stripe';

@Injectable()
export class AdminService {
  private stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {
    this.stripe = new Stripe(this.config.get<string>('stripe.secretKey')!, {
      apiVersion: '2023-10-16',
    });
  }

  async getUsers(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          plan: true,
          stripeCustomerId: true,
          createdAt: true,
          subscription: true,
          _count: {
            select: { posts: true, accounts: true, tickets: true },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { users, total, page, limit };
  }

  async getUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true,
        discounts: { orderBy: { createdAt: 'desc' } },
        accounts: {
          select: { id: true, platform: true, accountName: true, createdAt: true },
        },
        _count: {
          select: { posts: true, tickets: true, media: true, apiKeys: true },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async changePlan(userId: string, plan: Plan) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.user.update({
      where: { id: userId },
      data: { plan },
    });

    if (user.subscription) {
      await this.prisma.subscription.update({
        where: { id: user.subscription.id },
        data: {
          plan,
          status: plan === Plan.FREE ? SubscriptionStatus.CANCELED : user.subscription.status,
        },
      });
    }

    this.logger.log(`Admin changed plan for user ${userId} to ${plan}`, 'AdminService');
    return { success: true, plan };
  }

  async refundAndCancel(userId: string, reason?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });
    if (!user) throw new NotFoundException('User not found');

    let refundResult: any = null;

    // If user has a Stripe subscription, cancel it and attempt refund
    if (user.subscription?.stripeSubId) {
      try {
        // Get the subscription from Stripe to find latest invoice
        const stripeSub = await this.stripe.subscriptions.retrieve(user.subscription.stripeSubId);

        // Try to refund the latest invoice
        if (stripeSub.latest_invoice) {
          const invoiceId = typeof stripeSub.latest_invoice === 'string'
            ? stripeSub.latest_invoice
            : stripeSub.latest_invoice.id;

          const invoice = await this.stripe.invoices.retrieve(invoiceId);
          if (invoice.payment_intent) {
            const paymentIntentId = typeof invoice.payment_intent === 'string'
              ? invoice.payment_intent
              : invoice.payment_intent.id;

            const refund = await this.stripe.refunds.create({
              payment_intent: paymentIntentId,
              reason: 'requested_by_customer',
            });
            refundResult = {
              refundId: refund.id,
              amount: refund.amount / 100,
              currency: refund.currency,
              status: refund.status,
            };
          }
        }

        // Cancel the Stripe subscription immediately
        await this.stripe.subscriptions.cancel(user.subscription.stripeSubId);
      } catch (stripeError: any) {
        this.logger.warn(`Stripe refund/cancel failed for user ${userId}: ${stripeError.message}`, 'AdminService');
        // Still proceed with local cancellation even if Stripe fails
        refundResult = { error: stripeError.message };
      }
    }

    // Update local database
    if (user.subscription) {
      await this.prisma.subscription.update({
        where: { id: user.subscription.id },
        data: { status: SubscriptionStatus.CANCELED },
      });
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { plan: Plan.FREE },
    });

    this.logger.log(`Admin refunded and canceled subscription for user ${userId}. Reason: ${reason || 'none'}`, 'AdminService');

    return {
      success: true,
      message: 'Subscription canceled and user moved to Free plan',
      refund: refundResult,
    };
  }

  async getTickets(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [tickets, total] = await Promise.all([
      this.prisma.ticket.findMany({
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          _count: { select: { messages: true } },
        },
      }),
      this.prisma.ticket.count(),
    ]);
    return { tickets, total, page, limit };
  }

  async updateTicketStatus(ticketId: string, status: TicketStatus) {
    return this.prisma.ticket.update({
      where: { id: ticketId },
      data: { status },
    });
  }

  async applyManualDiscount(userId: string, percentage: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user) throw new NotFoundException('User not found');

    const discount = await this.prisma.discount.create({
      data: {
        userId,
        percentage,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        used: false,
      },
    });

    return discount;
  }

  async getSalesReport(period: string = '30d', page = 1, limit = 20) {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case '7d': startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      case '30d': startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
      case '90d': startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); break;
      case '1y': startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); break;
      case 'all': startDate = new Date(0); break;
      default: startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const skip = (page - 1) * limit;

    const [
      transactions,
      transactionCount,
      totalRevenue,
      totalRefunds,
      revenueByPlan,
      revenueByType,
      revenueByMonth,
      newSubscriptions,
      canceledSubscriptions,
    ] = await Promise.all([
      // Recent transactions
      this.prisma.payment.findMany({
        where: { createdAt: { gte: startDate } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, plan: true } },
        },
      }),
      this.prisma.payment.count({
        where: { createdAt: { gte: startDate } },
      }),
      // Total revenue
      this.prisma.payment.aggregate({
        where: {
          createdAt: { gte: startDate },
          status: PaymentStatus.SUCCEEDED,
          type: { not: PaymentType.REFUND },
        },
        _sum: { amount: true },
        _count: true,
      }),
      // Total refunds
      this.prisma.payment.aggregate({
        where: {
          createdAt: { gte: startDate },
          status: PaymentStatus.REFUNDED,
        },
        _sum: { refundedAmount: true },
        _count: true,
      }),
      // Revenue by plan
      this.prisma.payment.groupBy({
        by: ['plan'],
        where: {
          createdAt: { gte: startDate },
          status: PaymentStatus.SUCCEEDED,
          plan: { not: null },
          type: { not: PaymentType.REFUND },
        },
        _sum: { amount: true },
        _count: true,
      }),
      // Revenue by payment type
      this.prisma.payment.groupBy({
        by: ['type'],
        where: {
          createdAt: { gte: startDate },
          status: PaymentStatus.SUCCEEDED,
        },
        _sum: { amount: true },
        _count: true,
      }),
      // Monthly revenue trend (last 12 months)
      this.prisma.$queryRaw`
        SELECT
          DATE_TRUNC('month', created_at) as month,
          SUM(amount) as revenue,
          COUNT(*) as count
        FROM payments
        WHERE status = 'SUCCEEDED'
          AND type != 'REFUND'
          AND created_at >= ${new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)}
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month DESC
        LIMIT 12
      `,
      // New subscriptions in period
      this.prisma.subscription.count({
        where: {
          createdAt: { gte: startDate },
          status: SubscriptionStatus.ACTIVE,
        },
      }),
      // Canceled subscriptions in period
      this.prisma.subscription.count({
        where: {
          updatedAt: { gte: startDate },
          status: SubscriptionStatus.CANCELED,
        },
      }),
    ]);

    // Calculate MRR
    const planPrices: Record<string, number> = { FREE: 0, PRO: 29, AGENCY: 99 };
    const usersByPlan = await this.prisma.user.groupBy({
      by: ['plan'],
      _count: { plan: true },
    });
    const planCounts = usersByPlan.reduce(
      (acc, item) => ({ ...acc, [item.plan]: item._count.plan }),
      {} as Record<string, number>,
    );
    const mrr = Object.entries(planCounts).reduce(
      (sum, [plan, count]) => sum + (planPrices[plan] || 0) * count,
      0,
    );

    // Lifetime total
    const lifetimeRevenue = await this.prisma.payment.aggregate({
      where: { status: PaymentStatus.SUCCEEDED, type: { not: PaymentType.REFUND } },
      _sum: { amount: true },
    });

    return {
      summary: {
        totalRevenue: totalRevenue._sum.amount || 0,
        totalTransactions: totalRevenue._count || 0,
        totalRefunds: totalRefunds._sum.refundedAmount || 0,
        refundCount: totalRefunds._count || 0,
        netRevenue: (totalRevenue._sum.amount || 0) - (totalRefunds._sum.refundedAmount || 0),
        mrr,
        arr: mrr * 12,
        lifetimeRevenue: lifetimeRevenue._sum.amount || 0,
        newSubscriptions,
        canceledSubscriptions,
        churnRate: newSubscriptions > 0
          ? Math.round((canceledSubscriptions / (newSubscriptions + canceledSubscriptions)) * 100)
          : 0,
      },
      revenueByPlan: revenueByPlan.map((r) => ({
        plan: r.plan,
        revenue: r._sum.amount || 0,
        count: r._count,
      })),
      revenueByType: revenueByType.map((r) => ({
        type: r.type,
        revenue: r._sum.amount || 0,
        count: r._count,
      })),
      revenueByMonth: (revenueByMonth as any[]).map((r) => ({
        month: r.month,
        revenue: parseFloat(r.revenue) || 0,
        count: parseInt(r.count) || 0,
      })),
      transactions,
      transactionCount,
      page,
      limit,
      period,
    };
  }

  async getUserPayments(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.payment.count({ where: { userId } }),
    ]);

    const stats = await this.prisma.payment.aggregate({
      where: { userId, status: PaymentStatus.SUCCEEDED, type: { not: PaymentType.REFUND } },
      _sum: { amount: true },
      _count: true,
    });

    return { payments, total, page, limit, totalPaid: stats._sum.amount || 0, paymentCount: stats._count || 0 };
  }

  async getAnalytics() {
    const [
      totalUsers,
      totalPosts,
      postsByStatus,
      usersByPlan,
      openTickets,
      activeSubscriptions,
      subscriptionsByStatus,
      totalAccounts,
      recentUsers,
      totalDiscounts,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.post.count(),
      this.prisma.post.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      this.prisma.user.groupBy({
        by: ['plan'],
        _count: { plan: true },
      }),
      this.prisma.ticket.count({
        where: { status: { in: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS] } },
      }),
      this.prisma.subscription.count({
        where: { status: SubscriptionStatus.ACTIVE },
      }),
      this.prisma.subscription.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      this.prisma.account.count(),
      // Users created in last 30 days
      this.prisma.user.count({
        where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      }),
      this.prisma.discount.count({ where: { used: true } }),
    ]);

    // Calculate estimated MRR based on plan counts
    const planPrices: Record<string, number> = { FREE: 0, PRO: 29, AGENCY: 99 };
    const planCounts = usersByPlan.reduce(
      (acc, item) => ({ ...acc, [item.plan]: item._count.plan }),
      {} as Record<string, number>,
    );
    const estimatedMRR = Object.entries(planCounts).reduce(
      (sum, [plan, count]) => sum + (planPrices[plan] || 0) * count,
      0,
    );

    return {
      totalUsers,
      totalPosts,
      postsByStatus: postsByStatus.reduce(
        (acc, item) => ({ ...acc, [item.status]: item._count.status }),
        {} as Record<string, number>,
      ),
      usersByPlan: planCounts,
      openTickets,
      activeSubscriptions,
      subscriptionsByStatus: subscriptionsByStatus.reduce(
        (acc, item) => ({ ...acc, [item.status]: item._count.status }),
        {} as Record<string, number>,
      ),
      totalAccounts,
      recentUsers,
      totalDiscounts,
      estimatedMRR,
    };
  }
}

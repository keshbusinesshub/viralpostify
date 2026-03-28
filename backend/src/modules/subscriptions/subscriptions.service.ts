import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { Plan, SubscriptionStatus, PaymentStatus, PaymentType } from '@prisma/client';

const PLAN_PRICES: Record<string, number> = { FREE: 0, PRO: 29, AGENCY: 99 };
const PLAN_ORDER: Record<string, number> = { FREE: 0, PRO: 1, AGENCY: 2 };

@Injectable()
export class SubscriptionsService {
  private stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    const stripeKey = this.config.get<string>('stripe.secretKey') || 'sk_test_placeholder';
    this.stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });
  }

  async create(userId: string, dto: CreateSubscriptionDto) {
    if (dto.plan === Plan.FREE) {
      throw new BadRequestException('Cannot create subscription for free plan');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user) throw new NotFoundException('User not found');

    // Determine if this is an upgrade or downgrade
    const currentOrder = PLAN_ORDER[user.plan] || 0;
    const newOrder = PLAN_ORDER[dto.plan] || 0;
    const isUpgrade = newOrder > currentOrder;
    const isDowngrade = newOrder < currentOrder;

    // Create or retrieve Stripe customer
    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await this.stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user.id },
      });
      stripeCustomerId = customer.id;
      await this.prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId },
      });
    }

    // If user has an active Stripe subscription and wants to change plan
    if (user.subscription?.stripeSubId && user.subscription.status === SubscriptionStatus.ACTIVE) {
      try {
        const stripeSub = await this.stripe.subscriptions.retrieve(user.subscription.stripeSubId);
        const newPriceId = this.getPriceId(dto.plan);

        // Update the existing subscription (Stripe handles proration)
        const updatedSub = await this.stripe.subscriptions.update(user.subscription.stripeSubId, {
          items: [{
            id: stripeSub.items.data[0].id,
            price: newPriceId,
          }],
          proration_behavior: isUpgrade ? 'create_prorations' : 'none',
        });

        // Calculate proration amount
        const proratedAmount = isUpgrade
          ? PLAN_PRICES[dto.plan] - PLAN_PRICES[user.plan]
          : 0;

        // Update local DB
        await this.prisma.subscription.update({
          where: { id: user.subscription.id },
          data: {
            plan: dto.plan,
            nextBillingDate: new Date((updatedSub as any).current_period_end * 1000),
          },
        });

        await this.prisma.user.update({
          where: { id: userId },
          data: { plan: dto.plan },
        });

        // Record the plan change payment
        await this.prisma.payment.create({
          data: {
            userId,
            amount: isUpgrade ? proratedAmount : 0,
            status: PaymentStatus.SUCCEEDED,
            type: isUpgrade ? PaymentType.UPGRADE : PaymentType.DOWNGRADE,
            plan: dto.plan,
            description: `${isUpgrade ? 'Upgrade' : 'Downgrade'} from ${user.plan} to ${dto.plan}`,
            billingPeriodStart: new Date((updatedSub as any).current_period_start * 1000),
            billingPeriodEnd: new Date((updatedSub as any).current_period_end * 1000),
          },
        });

        return {
          action: isUpgrade ? 'UPGRADED' : 'DOWNGRADED',
          message: `Plan ${isUpgrade ? 'upgraded' : 'downgraded'} to ${dto.plan}`,
          plan: dto.plan,
        };
      } catch (err: any) {
        // If Stripe update fails, fall through to checkout
      }
    }

    // Get price ID for selected plan
    const priceId = this.getPriceId(dto.plan);

    // Create Stripe checkout session
    const session = await this.stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${this.config.get('frontendUrl')}/dashboard/billing?success=true`,
      cancel_url: `${this.config.get('frontendUrl')}/dashboard/billing?canceled=true`,
      metadata: { userId, plan: dto.plan },
    });

    return { checkoutUrl: session.url };
  }

  async cancel(userId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription || !subscription.stripeSubId) {
      throw new NotFoundException('No active subscription found');
    }

    // Check if discount was already applied — retention logic
    if (!subscription.discountApplied) {
      const discountPercentage = 20;
      return {
        action: 'DISCOUNT_OFFER',
        discountPercentage,
        message: `We'd hate to see you go! How about ${discountPercentage}% off your next billing cycle?`,
      };
    }

    // Discount already used — proceed with cancellation
    await this.stripe.subscriptions.update(subscription.stripeSubId, {
      cancel_at_period_end: true,
    });

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: SubscriptionStatus.CANCELED },
    });

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { plan: Plan.FREE },
    });

    // Record cancellation
    await this.prisma.payment.create({
      data: {
        userId,
        amount: 0,
        status: PaymentStatus.SUCCEEDED,
        type: PaymentType.REFUND,
        plan: Plan.FREE,
        description: `Subscription canceled. Downgraded to Free plan.`,
      },
    });

    return { action: 'CANCELED', message: 'Subscription canceled successfully' };
  }

  async applyDiscount(userId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription || !subscription.stripeSubId) {
      throw new NotFoundException('No active subscription found');
    }

    if (subscription.discountApplied) {
      throw new BadRequestException('Discount already applied');
    }

    const discountPercentage = 20;

    // Create Stripe coupon
    const coupon = await this.stripe.coupons.create({
      percent_off: discountPercentage,
      duration: 'once',
      metadata: { userId },
    });

    // Apply coupon to subscription
    await this.stripe.subscriptions.update(subscription.stripeSubId, {
      coupon: coupon.id,
    });

    // Mark discount as applied
    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: { discountApplied: true },
    });

    // Store discount record
    await this.prisma.discount.create({
      data: {
        userId,
        percentage: discountPercentage,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        used: true,
        couponId: coupon.id,
      },
    });

    return {
      action: 'DISCOUNT_APPLIED',
      discountPercentage,
      message: `${discountPercentage}% discount applied to your next billing cycle!`,
    };
  }

  async getPaymentHistory(userId: string, page = 1, limit = 10) {
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
    return { payments, total, page, limit };
  }

  async getBillingDetails(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const currentPlan = user.plan;
    const subscription = user.subscription;

    // Calculate billing cycle info
    let billingCycle: any = null;
    if (subscription?.stripeSubId && subscription.status === SubscriptionStatus.ACTIVE) {
      try {
        const stripeSub = await this.stripe.subscriptions.retrieve(subscription.stripeSubId);
        billingCycle = {
          currentPeriodStart: new Date((stripeSub as any).current_period_start * 1000),
          currentPeriodEnd: new Date((stripeSub as any).current_period_end * 1000),
          cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
          daysRemaining: Math.ceil(
            ((stripeSub as any).current_period_end * 1000 - Date.now()) / (1000 * 60 * 60 * 24),
          ),
        };
      } catch {
        // Stripe error, use local data
      }
    }

    // Get lifetime payment totals
    const paymentStats = await this.prisma.payment.aggregate({
      where: { userId, status: PaymentStatus.SUCCEEDED, type: { not: PaymentType.REFUND } },
      _sum: { amount: true },
      _count: true,
    });

    const refundStats = await this.prisma.payment.aggregate({
      where: { userId, status: PaymentStatus.REFUNDED },
      _sum: { refundedAmount: true },
    });

    return {
      plan: currentPlan,
      price: PLAN_PRICES[currentPlan],
      subscription: subscription ? {
        status: subscription.status,
        plan: subscription.plan,
        nextBillingDate: subscription.nextBillingDate,
        discountApplied: subscription.discountApplied,
      } : null,
      billingCycle,
      stats: {
        totalPaid: paymentStats._sum.amount || 0,
        totalPayments: paymentStats._count || 0,
        totalRefunded: refundStats._sum.refundedAmount || 0,
      },
    };
  }

  async downgrade(userId: string, newPlan: Plan) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });
    if (!user) throw new NotFoundException('User not found');

    if (PLAN_ORDER[newPlan] >= PLAN_ORDER[user.plan]) {
      throw new BadRequestException('New plan must be lower than current plan');
    }

    if (newPlan === Plan.FREE) {
      // Cancel subscription entirely
      if (user.subscription?.stripeSubId) {
        try {
          await this.stripe.subscriptions.update(user.subscription.stripeSubId, {
            cancel_at_period_end: true,
          });
        } catch {}
      }

      if (user.subscription) {
        await this.prisma.subscription.update({
          where: { id: user.subscription.id },
          data: { status: SubscriptionStatus.CANCELED, plan: Plan.FREE },
        });
      }

      await this.prisma.user.update({
        where: { id: userId },
        data: { plan: Plan.FREE },
      });

      await this.prisma.payment.create({
        data: {
          userId,
          amount: 0,
          status: PaymentStatus.SUCCEEDED,
          type: PaymentType.DOWNGRADE,
          plan: Plan.FREE,
          description: `Downgraded from ${user.plan} to Free`,
        },
      });

      return { action: 'DOWNGRADED', message: 'Downgraded to Free plan. Active until end of billing period.' };
    }

    // Downgrade to a lower paid plan (e.g. AGENCY → PRO)
    return this.create(userId, { plan: newPlan });
  }

  async handleWebhook(event: Stripe.Event) {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan as Plan;
        const stripeSubId =
          typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription?.id;

        if (userId && plan && stripeSubId) {
          await this.prisma.subscription.upsert({
            where: { userId },
            create: {
              userId,
              plan,
              status: SubscriptionStatus.ACTIVE,
              stripeSubId,
            },
            update: {
              plan,
              status: SubscriptionStatus.ACTIVE,
              stripeSubId,
            },
          });

          await this.prisma.user.update({
            where: { id: userId },
            data: { plan },
          });

          // Record payment
          await this.prisma.payment.create({
            data: {
              userId,
              amount: PLAN_PRICES[plan] || 0,
              status: PaymentStatus.SUCCEEDED,
              type: PaymentType.SUBSCRIPTION,
              plan,
              stripePaymentId: session.payment_intent as string || undefined,
              description: `Subscribed to ${plan} plan`,
            },
          });
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const subId =
          typeof invoice.subscription === 'string'
            ? invoice.subscription
            : invoice.subscription?.id;

        if (subId && invoice.billing_reason === 'subscription_cycle') {
          const subscription = await this.prisma.subscription.findFirst({
            where: { stripeSubId: subId },
          });

          if (subscription) {
            await this.prisma.payment.create({
              data: {
                userId: subscription.userId,
                amount: (invoice.amount_paid || 0) / 100,
                currency: invoice.currency || 'usd',
                status: PaymentStatus.SUCCEEDED,
                type: PaymentType.RENEWAL,
                plan: subscription.plan,
                stripeInvoiceId: invoice.id,
                stripePaymentId: typeof invoice.payment_intent === 'string'
                  ? invoice.payment_intent
                  : invoice.payment_intent?.id || undefined,
                description: `Monthly renewal - ${subscription.plan} plan`,
                billingPeriodStart: invoice.period_start ? new Date(invoice.period_start * 1000) : undefined,
                billingPeriodEnd: invoice.period_end ? new Date(invoice.period_end * 1000) : undefined,
              },
            });

            // Update next billing date
            await this.prisma.subscription.update({
              where: { id: subscription.id },
              data: {
                nextBillingDate: invoice.period_end ? new Date(invoice.period_end * 1000) : undefined,
              },
            });
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subId =
          typeof invoice.subscription === 'string'
            ? invoice.subscription
            : invoice.subscription?.id;

        if (subId) {
          await this.prisma.subscription.updateMany({
            where: { stripeSubId: subId },
            data: { status: SubscriptionStatus.PAST_DUE },
          });

          const subscription = await this.prisma.subscription.findFirst({
            where: { stripeSubId: subId },
          });

          if (subscription) {
            await this.prisma.payment.create({
              data: {
                userId: subscription.userId,
                amount: (invoice.amount_due || 0) / 100,
                status: PaymentStatus.FAILED,
                type: PaymentType.RENEWAL,
                plan: subscription.plan,
                stripeInvoiceId: invoice.id,
                description: `Failed payment - ${subscription.plan} plan`,
              },
            });
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const subscription = await this.prisma.subscription.findFirst({
          where: { stripeSubId: sub.id },
        });

        if (subscription) {
          await this.prisma.subscription.update({
            where: { id: subscription.id },
            data: { status: SubscriptionStatus.CANCELED },
          });
          await this.prisma.user.update({
            where: { id: subscription.userId },
            data: { plan: Plan.FREE },
          });
        }
        break;
      }
    }
  }

  async getProrationPreview(userId: string, targetPlan: Plan) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const currentPlan = user.plan;
    const currentPrice = PLAN_PRICES[currentPlan] || 0;
    const targetPrice = PLAN_PRICES[targetPlan] || 0;

    if (currentPlan === targetPlan) {
      throw new BadRequestException('Already on this plan');
    }

    const isUpgrade = PLAN_ORDER[targetPlan] > PLAN_ORDER[currentPlan];
    const isDowngrade = !isUpgrade;

    let daysRemaining = 0;
    let daysInPeriod = 30;
    let periodStart: Date | null = null;
    let periodEnd: Date | null = null;
    let proratedAmount = 0;
    let credit = 0;
    let effectiveDate = new Date();

    // Try to get billing cycle from Stripe
    if (user.subscription?.stripeSubId && user.subscription.status === SubscriptionStatus.ACTIVE) {
      try {
        const stripeSub = await this.stripe.subscriptions.retrieve(user.subscription.stripeSubId);
        const start = (stripeSub as any).current_period_start * 1000;
        const end = (stripeSub as any).current_period_end * 1000;
        periodStart = new Date(start);
        periodEnd = new Date(end);
        daysInPeriod = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        daysRemaining = Math.ceil((end - Date.now()) / (1000 * 60 * 60 * 24));
      } catch {
        // Use defaults
      }
    }

    // If no Stripe data, estimate from subscription record
    if (!periodEnd && user.subscription?.nextBillingDate) {
      periodEnd = user.subscription.nextBillingDate;
      daysRemaining = Math.ceil((periodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      periodStart = new Date(periodEnd.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    if (daysRemaining < 0) daysRemaining = 0;

    if (isUpgrade) {
      // Proration: charge the difference for remaining days
      const dailyDiff = (targetPrice - currentPrice) / daysInPeriod;
      proratedAmount = Math.round(dailyDiff * daysRemaining * 100) / 100;
      credit = 0;
      effectiveDate = new Date(); // Immediate
    } else {
      // Downgrade: credit unused days, effective at period end
      if (currentPrice > targetPrice && daysRemaining > 0) {
        const dailyCredit = (currentPrice - targetPrice) / daysInPeriod;
        credit = Math.round(dailyCredit * daysRemaining * 100) / 100;
      }
      proratedAmount = 0;
      effectiveDate = periodEnd || new Date();
    }

    // Next billing amount after change
    const nextBillingAmount = targetPrice;

    return {
      currentPlan,
      targetPlan,
      currentPrice,
      targetPrice,
      isUpgrade,
      isDowngrade,
      proration: {
        proratedCharge: proratedAmount,
        credit,
        daysRemaining,
        daysInPeriod,
        dailyRate: Math.round((targetPrice / daysInPeriod) * 100) / 100,
        currentDailyRate: Math.round((currentPrice / daysInPeriod) * 100) / 100,
      },
      billing: {
        periodStart: periodStart?.toISOString() || null,
        periodEnd: periodEnd?.toISOString() || null,
        effectiveDate: effectiveDate.toISOString(),
        nextBillingAmount,
        nextBillingDate: periodEnd?.toISOString() || null,
      },
      summary: isUpgrade
        ? `You'll be charged $${proratedAmount.toFixed(2)} today for the remaining ${daysRemaining} days. Starting next cycle, you'll pay $${targetPrice}/mo.`
        : targetPlan === 'FREE'
          ? `Your ${currentPlan} plan will remain active until ${periodEnd ? periodEnd.toLocaleDateString() : 'end of billing period'}. After that, you'll be on the Free plan.`
          : `Your plan will change to ${targetPlan} ($${targetPrice}/mo) at the end of your current billing period${credit > 0 ? `. You'll receive a $${credit.toFixed(2)} credit.` : '.'}`,
    };
  }

  private getPriceId(plan: Plan): string {
    const prices = this.config.get<Record<string, string>>('stripe.prices')!;
    switch (plan) {
      case Plan.PRO:
        return prices.pro;
      case Plan.AGENCY:
        return prices.agency;
      default:
        throw new BadRequestException('Invalid plan');
    }
  }
}

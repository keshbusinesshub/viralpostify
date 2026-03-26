import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTicketDto, ReplyTicketDto } from './dto/create-ticket.dto';
import { TicketStatus } from '@prisma/client';
import { N8nService } from '../n8n/n8n.service';

@Injectable()
export class TicketsService {
  constructor(
    private prisma: PrismaService,
    private n8n: N8nService,
  ) {}

  async create(userId: string, dto: CreateTicketDto) {
    const ticket = await this.prisma.ticket.create({
      data: {
        userId,
        subject: dto.subject,
        category: dto.category,
        priority: dto.priority,
      },
      include: {
        user: { select: { id: true, name: true, email: true, plan: true } },
      },
    });

    // Create the initial message
    await this.prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        sender: userId,
        message: dto.message,
      },
    });

    // Trigger n8n webhook — new ticket created
    this.n8n.triggerTicketWebhook({
      event: 'ticket.created',
      ticket: {
        id: ticket.id,
        subject: ticket.subject,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        createdAt: ticket.createdAt.toISOString(),
        updatedAt: ticket.updatedAt.toISOString(),
      },
      user: {
        id: ticket.user.id,
        name: ticket.user.name,
        email: ticket.user.email,
        plan: ticket.user.plan,
      },
      message: dto.message,
    });

    return ticket;
  }

  async findAllByUser(userId: string) {
    return this.prisma.ticket.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { messages: true } },
      },
    });
  }

  async findAll(page = 1, limit = 20) {
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

  async findOne(ticketId: string, userId: string, isAdmin: boolean) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        user: { select: { id: true, name: true, email: true, plan: true } },
      },
    });

    if (!ticket) throw new NotFoundException('Ticket not found');
    if (!isAdmin && ticket.userId !== userId) throw new ForbiddenException();

    return ticket;
  }

  async reply(ticketId: string, senderId: string, dto: ReplyTicketDto, isAdmin: boolean) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        user: { select: { id: true, name: true, email: true, plan: true } },
      },
    });

    if (!ticket) throw new NotFoundException('Ticket not found');
    if (!isAdmin && ticket.userId !== senderId) throw new ForbiddenException();

    const message = await this.prisma.ticketMessage.create({
      data: {
        ticketId,
        sender: senderId,
        message: dto.message,
        attachmentUrl: dto.attachmentUrl,
      },
    });

    // Update ticket status
    const previousStatus = ticket.status;
    if (isAdmin && ticket.status === TicketStatus.OPEN) {
      await this.prisma.ticket.update({
        where: { id: ticketId },
        data: { status: TicketStatus.IN_PROGRESS },
      });
    }

    // Trigger n8n webhook — reply added
    this.n8n.triggerTicketWebhook({
      event: 'ticket.reply_added',
      ticket: {
        id: ticket.id,
        subject: ticket.subject,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        createdAt: ticket.createdAt.toISOString(),
        updatedAt: ticket.updatedAt.toISOString(),
      },
      user: {
        id: ticket.user.id,
        name: ticket.user.name,
        email: ticket.user.email,
        plan: ticket.user.plan,
      },
      message: dto.message,
      previousStatus,
      respondedBy: isAdmin ? 'staff' : 'user',
    });

    return message;
  }

  async updateStatus(ticketId: string, status: TicketStatus) {
    const ticket = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { status },
      include: {
        user: { select: { id: true, name: true, email: true, plan: true } },
      },
    });

    // Determine the event type
    const event = status === TicketStatus.RESOLVED || status === TicketStatus.CLOSED
      ? 'ticket.resolved'
      : 'ticket.status_changed';

    // Trigger n8n webhook — status changed
    this.n8n.triggerTicketWebhook({
      event,
      ticket: {
        id: ticket.id,
        subject: ticket.subject,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        createdAt: ticket.createdAt.toISOString(),
        updatedAt: ticket.updatedAt.toISOString(),
      },
      user: {
        id: ticket.user.id,
        name: ticket.user.name,
        email: ticket.user.email,
        plan: ticket.user.plan,
      },
    });

    return ticket;
  }
}

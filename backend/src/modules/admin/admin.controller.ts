import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { N8nService } from '../n8n/n8n.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TicketStatus, Plan } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(
    private adminService: AdminService,
    private n8nService: N8nService,
  ) {}

  @Get('users')
  getUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getUsers(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      search,
    );
  }

  @Get('users/:id')
  getUser(@Param('id') id: string) {
    return this.adminService.getUser(id);
  }

  @Put('users/:id/plan')
  changePlan(
    @Param('id') userId: string,
    @Body('plan') plan: Plan,
  ) {
    return this.adminService.changePlan(userId, plan);
  }

  @Post('users/:id/refund')
  refundUser(
    @Param('id') userId: string,
    @Body('reason') reason?: string,
  ) {
    return this.adminService.refundAndCancel(userId, reason);
  }

  @Post('users/:id/apply-discount')
  applyDiscount(
    @Param('id') userId: string,
    @Body('percentage') percentage: number,
  ) {
    return this.adminService.applyManualDiscount(userId, percentage);
  }

  @Get('tickets')
  getTickets(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getTickets(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Put('tickets/:id/status')
  updateTicketStatus(
    @Param('id') id: string,
    @Body('status') status: TicketStatus,
  ) {
    return this.adminService.updateTicketStatus(id, status);
  }

  @Get('analytics')
  getAnalytics() {
    return this.adminService.getAnalytics();
  }

  @Get('sales')
  getSalesReport(
    @Query('period') period?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getSalesReport(
      period || '30d',
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('users/:id/payments')
  getUserPayments(
    @Param('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getUserPayments(
      userId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  // n8n Integration
  @Get('n8n/status')
  getN8nStatus() {
    return this.n8nService.getStatus();
  }

  @Get('n8n/workflows')
  getN8nWorkflows() {
    return this.n8nService.listWorkflows();
  }

  @Post('n8n/setup-ticket-workflow')
  setupTicketWorkflow() {
    return this.n8nService.createTicketWorkflow();
  }
}

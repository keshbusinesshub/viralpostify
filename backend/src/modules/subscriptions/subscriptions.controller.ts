import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
  RawBodyRequest,
  Headers,
} from '@nestjs/common';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../../common/decorators/current-user.decorator';
import { Plan } from '@prisma/client';

@Controller('subscriptions')
export class SubscriptionsController {
  private stripe: Stripe;

  constructor(
    private subscriptionsService: SubscriptionsService,
    private config: ConfigService,
  ) {
    this.stripe = new Stripe(this.config.get<string>('stripe.secretKey')!, {
      apiVersion: '2023-10-16',
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('create')
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateSubscriptionDto,
  ) {
    return this.subscriptionsService.create(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('cancel')
  cancel(@CurrentUser() user: CurrentUserPayload) {
    return this.subscriptionsService.cancel(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('downgrade')
  downgrade(
    @CurrentUser() user: CurrentUserPayload,
    @Body('plan') plan: Plan,
  ) {
    return this.subscriptionsService.downgrade(user.id, plan);
  }

  @UseGuards(JwtAuthGuard)
  @Post('apply-discount')
  applyDiscount(@CurrentUser() user: CurrentUserPayload) {
    return this.subscriptionsService.applyDiscount(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('preview')
  getProrationPreview(
    @CurrentUser() user: CurrentUserPayload,
    @Query('plan') plan: Plan,
  ) {
    return this.subscriptionsService.getProrationPreview(user.id, plan);
  }

  @UseGuards(JwtAuthGuard)
  @Get('billing')
  getBillingDetails(@CurrentUser() user: CurrentUserPayload) {
    return this.subscriptionsService.getBillingDetails(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('payments')
  getPaymentHistory(
    @CurrentUser() user: CurrentUserPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.subscriptionsService.getPaymentHistory(
      user.id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
  }

  @Post('webhook')
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const webhookSecret = this.config.get<string>('stripe.webhookSecret');
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        req.rawBody!,
        signature,
        webhookSecret!,
      );
    } catch (err) {
      throw new Error(`Webhook signature verification failed: ${err}`);
    }

    await this.subscriptionsService.handleWebhook(event);
    return { received: true };
  }
}

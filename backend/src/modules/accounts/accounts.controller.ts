import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { AccountsService } from './accounts.service';
import { OAuthService } from './oauth.service';
import { ConnectAccountDto } from './dto/connect-account.dto';
import { CombinedAuthGuard } from '../../common/guards/combined-auth.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../../common/decorators/current-user.decorator';

@Controller('accounts')
export class AccountsController {
  constructor(
    private accountsService: AccountsService,
    private oauthService: OAuthService,
  ) {}

  // OAuth: Check which platforms are configured
  @UseGuards(JwtAuthGuard)
  @Get('oauth/status')
  getOAuthStatus() {
    return this.oauthService.getConfiguredPlatforms();
  }

  // OAuth: Get auth URL for a platform
  @UseGuards(JwtAuthGuard)
  @Get('oauth/:platform/authorize')
  getAuthUrl(
    @CurrentUser() user: CurrentUserPayload,
    @Param('platform') platform: string,
  ) {
    const url = this.oauthService.getAuthUrl(platform, user.id);
    return { url };
  }

  // OAuth: Callback from platform (no auth guard — redirected from external)
  @Get('oauth/:platform/callback')
  async handleCallback(
    @Param('platform') platform: string,
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    try {
      const redirectUrl = await this.oauthService.handleCallback(platform, code, state);
      return res.redirect(redirectUrl);
    } catch (error: any) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/dashboard/accounts?error=${encodeURIComponent(error.message)}`);
    }
  }

  // Manual connect (for API key users or direct token entry)
  @UseGuards(CombinedAuthGuard)
  @Post('connect')
  connect(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: ConnectAccountDto,
  ) {
    return this.accountsService.connect(user.id, dto);
  }

  @UseGuards(CombinedAuthGuard)
  @Get()
  findAll(@CurrentUser() user: CurrentUserPayload) {
    return this.accountsService.findAllByUser(user.id);
  }

  @UseGuards(CombinedAuthGuard)
  @Delete(':id')
  disconnect(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.accountsService.disconnect(id, user.id);
  }
}

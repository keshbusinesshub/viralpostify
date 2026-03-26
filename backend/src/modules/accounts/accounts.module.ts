import { Module } from '@nestjs/common';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { OAuthService } from './oauth.service';

@Module({
  controllers: [AccountsController],
  providers: [AccountsService, OAuthService],
  exports: [AccountsService],
})
export class AccountsModule {}

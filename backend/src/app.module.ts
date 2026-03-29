import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { envConfig } from './config/env.config';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PostsModule } from './modules/posts/posts.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { AiModule } from './modules/ai/ai.module';
import { MediaModule } from './modules/media/media.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { AdminModule } from './modules/admin/admin.module';
import { ApiKeysModule } from './modules/api-keys/api-keys.module';
import { N8nModule } from './modules/n8n/n8n.module';
import { LoggerModule } from './logger/logger.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig],
    }),

    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),

    BullModule.forRootAsync({
      useFactory: () => {
        const redisUrl = process.env.REDIS_URL;
        if (redisUrl) {
          console.log('[Bull] Using REDIS_URL');
          return {
            redis: redisUrl,
          };
        }
        const host = process.env.REDISHOST || process.env.REDIS_HOST || 'localhost';
        const port = Number(process.env.REDISPORT || process.env.REDIS_PORT) || 6379;
        const password = process.env.REDISPASSWORD || undefined;
        console.log(`[Bull] Connecting to Redis at ${host}:${port}`);
        return {
          redis: {
            host,
            port,
            password,
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
            retryStrategy: () => 3000, // always retry, never crash
          },
        };
      },
    }),

    LoggerModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    PostsModule,
    AccountsModule,
    SubscriptionsModule,
    TicketsModule,
    AiModule,
    MediaModule,
    SchedulerModule,
    AdminModule,
    ApiKeysModule,
    N8nModule,
  ],

  controllers: [HealthController],
})
export class AppModule {}

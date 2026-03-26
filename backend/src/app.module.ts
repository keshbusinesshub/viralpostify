import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 60,
      },
    ]),
    BullModule.forRootAsync({
  useFactory: () => ({
    redis: {
      url: process.env.REDIS_URL,
    },
  }),
}),
        console.log(`[Bull] Connecting to Redis at ${host}:${port}`);
        return {
          redis: {
            host,
            port,
            maxRetriesPerRequest: 3,
            enableReadyCheck: false,
            retryStrategy: (times: number) => {
              console.log(`[Bull] Redis retry attempt ${times}`);
              if (times > 5) return null;
              return Math.min(times * 1000, 3000);
            },
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

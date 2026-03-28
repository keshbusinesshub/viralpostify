import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { Redis as IORedis } from 'ioredis';
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

function createRedisClient(): IORedis {
  const redisUrl = process.env.REDIS_URL;

  let client: IORedis;
  if (redisUrl) {
    console.log('[Bull] Connecting to Redis via REDIS_URL');
    client = new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy: (times: number) => Math.min(times * 500, 5000),
    });
  } else {
    const host = process.env.REDISHOST || process.env.REDIS_HOST || 'localhost';
    const port = Number(process.env.REDISPORT || process.env.REDIS_PORT) || 6379;
    const password = process.env.REDISPASSWORD || undefined;
    console.log(`[Bull] Connecting to Redis at ${host}:${port}`);
    client = new IORedis({
      host,
      port,
      password,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy: (times: number) => {
        console.log(`[Bull] Redis retry ${times}`);
        return Math.min(times * 500, 5000); // keep retrying, max 5s between attempts
      },
    });
  }

  // Prevent unhandled error events from crashing the process
  client.on('error', (err: Error) => {
    console.error('[Bull] Redis client error:', err.message);
  });

  return client;
}

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

    BullModule.forRoot({
      createClient: () => createRedisClient(),
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

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  console.log('[Bootstrap] Starting NestJS application...');
  console.log(`[Bootstrap] PORT=${process.env.PORT} BACKEND_PORT=${process.env.BACKEND_PORT}`);
  console.log(`[Bootstrap] REDIS_URL=${process.env.REDIS_URL ? 'set' : 'not set'} REDIS_HOST=${process.env.REDIS_HOST}`);
  console.log(`[Bootstrap] DATABASE_URL=${process.env.DATABASE_URL ? 'set' : 'not set'}`);

  const app = await NestFactory.create(AppModule, {
    bufferLogs: false,
    logger: ['error', 'warn', 'log', 'debug'],
  });

  // Use Winston as the NestJS logger
  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  app.useLogger(logger);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global request/response logging
  app.useGlobalInterceptors(new LoggingInterceptor(logger));

  app.enableCors({
    origin: process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(',').map((u) => u.trim())
      : 'http://localhost:3000',
    credentials: true,
  });

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port, '0.0.0.0');
  
  logger.log(`Backend running on http://0.0.0.0:${port}`, 'Bootstrap');
}

bootstrap().catch((err) => {
  console.error('[Bootstrap] FATAL: Application failed to start');
  console.error(err);
  process.exit(1);
});

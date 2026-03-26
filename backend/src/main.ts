import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
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

  const port = process.env.PORT || process.env.BACKEND_PORT || 4000;
  await app.listen(port, '0.0.0.0');
  logger.log(`Backend running on http://0.0.0.0:${port}`, 'Bootstrap');
}

bootstrap();

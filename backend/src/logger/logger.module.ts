import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, context, trace, ...meta }) => {
  let log = `${timestamp} [${level}]`;
  if (context) log += ` [${context}]`;
  log += ` ${message}`;
  if (Object.keys(meta).length > 0) log += ` ${JSON.stringify(meta)}`;
  if (trace) log += `\n${trace}`;
  return log;
});

@Module({
  imports: [
    WinstonModule.forRoot({
      level: process.env.LOG_LEVEL || 'info',
      format: combine(
        errors({ stack: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      ),
      transports: [
        // Console transport with colors
        new winston.transports.Console({
          format: combine(colorize(), logFormat),
        }),
        // File transport for all logs
        new winston.transports.File({
          filename: 'logs/app.log',
          maxsize: 5 * 1024 * 1024, // 5MB
          maxFiles: 5,
          format: combine(logFormat),
        }),
        // Error-only file transport
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          maxsize: 5 * 1024 * 1024,
          maxFiles: 5,
          format: combine(logFormat),
        }),
      ],
    }),
  ],
  exports: [WinstonModule],
})
export class LoggerModule {}

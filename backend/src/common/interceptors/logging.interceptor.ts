import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
  LoggerService,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url, ip } = req;
    const userAgent = req.get('user-agent') || '';
    const userId = req.user?.id || 'anonymous';
    const authType = req.headers['x-api-key'] ? 'api-key' : 'jwt';
    const now = Date.now();

    this.logger.log(
      `→ ${method} ${url} [${authType}] user=${userId} ip=${ip} ua=${userAgent.slice(0, 50)}`,
      'HTTP',
    );

    return next.handle().pipe(
      tap({
        next: () => {
          const res = context.switchToHttp().getResponse();
          const ms = Date.now() - now;
          this.logger.log(
            `← ${method} ${url} ${res.statusCode} ${ms}ms`,
            'HTTP',
          );
        },
        error: (err) => {
          const ms = Date.now() - now;
          this.logger.error(
            `← ${method} ${url} ${err.status || 500} ${ms}ms - ${err.message}`,
            err.stack,
            'HTTP',
          );
        },
      }),
    );
  }
}

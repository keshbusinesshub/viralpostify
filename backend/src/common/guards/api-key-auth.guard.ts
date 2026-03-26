import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { createHash } from 'crypto';

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const rawKey = request.headers['x-api-key'];

    if (!rawKey) {
      throw new UnauthorizedException('API key is required. Pass it via x-api-key header.');
    }

    const hashedKey = createHash('sha256').update(rawKey).digest('hex');

    const keyRecord = await this.prisma.apiKey.findUnique({
      where: { key: hashedKey },
      include: { user: true },
    });

    if (!keyRecord || keyRecord.revoked) {
      throw new UnauthorizedException('Invalid or revoked API key.');
    }

    if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('API key has expired.');
    }

    await this.prisma.apiKey.update({
      where: { id: keyRecord.id },
      data: { lastUsedAt: new Date() },
    });

    request.user = {
      id: keyRecord.user.id,
      email: keyRecord.user.email,
      role: keyRecord.user.role,
      plan: keyRecord.user.plan,
    };

    return true;
  }
}

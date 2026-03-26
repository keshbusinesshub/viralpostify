import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../../prisma/prisma.service';
import { createHash } from 'crypto';

@Injectable()
export class CombinedAuthGuard implements CanActivate {
  private jwtGuard: CanActivate;

  constructor(private prisma: PrismaService) {
    this.jwtGuard = new (AuthGuard('jwt'))();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const rawKey = request.headers['x-api-key'];

    // If API key is present, use API key auth
    if (rawKey) {
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

    // Otherwise fall back to JWT
    try {
      return await (this.jwtGuard.canActivate(context) as Promise<boolean>);
    } catch {
      throw new UnauthorizedException(
        'Authentication required. Provide a Bearer token or x-api-key header.',
      );
    }
  }
}

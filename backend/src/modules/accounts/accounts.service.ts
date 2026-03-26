import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConnectAccountDto } from './dto/connect-account.dto';

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) {}

  async connect(userId: string, dto: ConnectAccountDto) {
    const account = await this.prisma.account.create({
      data: {
        userId,
        platform: dto.platform,
        accessToken: dto.accessToken,
        refreshToken: dto.refreshToken,
        accountName: dto.accountName,
        platformUserId: dto.platformUserId,
      },
    });

    return {
      id: account.id,
      platform: account.platform,
      accountName: account.accountName,
      createdAt: account.createdAt,
    };
  }

  async findAllByUser(userId: string) {
    const accounts = await this.prisma.account.findMany({
      where: { userId },
      select: {
        id: true,
        platform: true,
        accountName: true,
        platformUserId: true,
        createdAt: true,
      },
    });
    return accounts;
  }

  async disconnect(accountId: string, userId: string) {
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) throw new NotFoundException('Account not found');

    await this.prisma.account.delete({ where: { id: accountId } });
    return { deleted: true };
  }
}

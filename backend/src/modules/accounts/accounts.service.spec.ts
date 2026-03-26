import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AccountsService', () => {
  let service: AccountsService;
  let prisma: any;

  const mockAccount = {
    id: 'acc-1',
    userId: 'user-1',
    platform: 'twitter',
    platformUserId: '12345',
    accessToken: 'token-123',
    refreshToken: null,
    tokenExpiry: null,
    accountName: '@testuser',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      account: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AccountsService>(AccountsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('connect', () => {
    it('should connect a new account', async () => {
      prisma.account.create.mockResolvedValue(mockAccount);

      const result = await service.connect('user-1', {
        platform: 'twitter',
        accessToken: 'token-123',
        accountName: '@testuser',
        platformUserId: '12345',
      });

      expect(result.platform).toBe('twitter');
      expect(result.accountName).toBe('@testuser');
      expect(result).not.toHaveProperty('accessToken');
    });
  });

  describe('findAllByUser', () => {
    it('should return accounts without tokens', async () => {
      prisma.account.findMany.mockResolvedValue([
        { id: 'acc-1', platform: 'twitter', accountName: '@testuser', platformUserId: '12345', createdAt: new Date() },
      ]);

      const result = await service.findAllByUser('user-1');

      expect(result).toHaveLength(1);
      expect(result[0]).not.toHaveProperty('accessToken');
      expect(prisma.account.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
        }),
      );
    });
  });

  describe('disconnect', () => {
    it('should disconnect an account', async () => {
      prisma.account.findFirst.mockResolvedValue(mockAccount);
      prisma.account.delete.mockResolvedValue(mockAccount);

      const result = await service.disconnect('acc-1', 'user-1');

      expect(result).toEqual({ deleted: true });
    });

    it('should throw NotFoundException if account not found', async () => {
      prisma.account.findFirst.mockResolvedValue(null);

      await expect(service.disconnect('bad-id', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for another users account', async () => {
      prisma.account.findFirst.mockResolvedValue(null);

      await expect(service.disconnect('acc-1', 'other-user')).rejects.toThrow(NotFoundException);
    });
  });
});

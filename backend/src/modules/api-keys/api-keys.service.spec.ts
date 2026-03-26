import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { ApiKeysService } from './api-keys.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ApiKeysService', () => {
  let service: ApiKeysService;
  let prisma: any;

  const mockLogger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };

  const mockApiKey = {
    id: 'key-1',
    userId: 'user-1',
    name: 'Test Key',
    key: 'hashed-key',
    keyPrefix: 'kp_live_abc1',
    lastUsedAt: null,
    expiresAt: null,
    revoked: false,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      apiKey: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeysService,
        { provide: PrismaService, useValue: prisma },
        { provide: WINSTON_MODULE_NEST_PROVIDER, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<ApiKeysService>(ApiKeysService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('should create an API key and return the raw key', async () => {
      prisma.apiKey.create.mockResolvedValue(mockApiKey);

      const result = await service.create('user-1', { name: 'Test Key' });

      expect(result.name).toBe('Test Key');
      expect(result.key).toMatch(/^kp_live_/);
      expect(result.keyPrefix).toBeDefined();
      expect(prisma.apiKey.create).toHaveBeenCalledTimes(1);
    });

    it('should create key with expiration', async () => {
      prisma.apiKey.create.mockResolvedValue({ ...mockApiKey, expiresAt: new Date('2025-12-31') });

      const result = await service.create('user-1', { name: 'Expiring Key', expiresAt: '2025-12-31' });

      expect(result.key).toMatch(/^kp_live_/);
      expect(prisma.apiKey.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            expiresAt: expect.any(Date),
          }),
        }),
      );
    });
  });

  describe('findAllByUser', () => {
    it('should return all keys for a user', async () => {
      prisma.apiKey.findMany.mockResolvedValue([mockApiKey]);

      const result = await service.findAllByUser('user-1');

      expect(result).toHaveLength(1);
      expect(prisma.apiKey.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
        }),
      );
    });
  });

  describe('revoke', () => {
    it('should revoke an API key', async () => {
      prisma.apiKey.findFirst.mockResolvedValue(mockApiKey);
      prisma.apiKey.update.mockResolvedValue({ ...mockApiKey, revoked: true });

      const result = await service.revoke('key-1', 'user-1');

      expect(result).toEqual({ revoked: true });
      expect(prisma.apiKey.update).toHaveBeenCalledWith({
        where: { id: 'key-1' },
        data: { revoked: true },
      });
    });

    it('should throw NotFoundException if key not found', async () => {
      prisma.apiKey.findFirst.mockResolvedValue(null);

      await expect(service.revoke('bad-id', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if key belongs to another user', async () => {
      prisma.apiKey.findFirst.mockResolvedValue(null);

      await expect(service.revoke('key-1', 'other-user')).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete an API key', async () => {
      prisma.apiKey.findFirst.mockResolvedValue(mockApiKey);
      prisma.apiKey.delete.mockResolvedValue(mockApiKey);

      const result = await service.delete('key-1', 'user-1');

      expect(result).toEqual({ deleted: true });
    });

    it('should throw NotFoundException if key not found', async () => {
      prisma.apiKey.findFirst.mockResolvedValue(null);

      await expect(service.delete('bad-id', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('validateKey', () => {
    it('should validate a valid key and return the record', async () => {
      prisma.apiKey.findUnique.mockResolvedValue({
        ...mockApiKey,
        user: { id: 'user-1', email: 'test@test.com', role: 'USER', plan: 'FREE' },
      });
      prisma.apiKey.update.mockResolvedValue(mockApiKey);

      const result = await service.validateKey('kp_live_some_raw_key');

      expect(result).toBeTruthy();
      expect(result!.user.email).toBe('test@test.com');
    });

    it('should return null for revoked key', async () => {
      prisma.apiKey.findUnique.mockResolvedValue({ ...mockApiKey, revoked: true });

      const result = await service.validateKey('kp_live_revoked_key');

      expect(result).toBeNull();
    });

    it('should return null for expired key', async () => {
      prisma.apiKey.findUnique.mockResolvedValue({
        ...mockApiKey,
        expiresAt: new Date('2020-01-01'),
      });

      const result = await service.validateKey('kp_live_expired_key');

      expect(result).toBeNull();
    });

    it('should return null for non-existent key', async () => {
      prisma.apiKey.findUnique.mockResolvedValue(null);

      const result = await service.validateKey('kp_live_fake');

      expect(result).toBeNull();
    });
  });
});

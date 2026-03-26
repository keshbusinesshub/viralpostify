import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { PostsService } from './posts.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('PostsService', () => {
  let service: PostsService;
  let prisma: any;

  const mockLogger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };

  const mockPost = {
    id: 'post-1',
    userId: 'user-1',
    content: 'Hello world',
    mediaUrl: null,
    status: 'DRAFT',
    scheduledTime: null,
    platform: 'twitter',
    platformPostId: null,
    platformResponse: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      post: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        delete: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: PrismaService, useValue: prisma },
        { provide: WINSTON_MODULE_NEST_PROVIDER, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('should create a draft post', async () => {
      prisma.post.create.mockResolvedValue(mockPost);

      const result = await service.create('user-1', {
        content: 'Hello world',
        platform: 'twitter',
      });

      expect(result.content).toBe('Hello world');
      expect(prisma.post.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          status: 'DRAFT',
          platform: 'twitter',
        }),
      });
    });

    it('should create a scheduled post', async () => {
      const scheduledPost = { ...mockPost, status: 'SCHEDULED', scheduledTime: new Date('2025-12-25') };
      prisma.post.create.mockResolvedValue(scheduledPost);

      const result = await service.create('user-1', {
        content: 'Scheduled post',
        platform: 'twitter',
        scheduledTime: '2025-12-25T10:00:00Z',
      });

      expect(prisma.post.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: 'SCHEDULED',
          scheduledTime: expect.any(Date),
        }),
      });
    });
  });

  describe('findAllByUser', () => {
    it('should return paginated posts', async () => {
      prisma.post.findMany.mockResolvedValue([mockPost]);
      prisma.post.count.mockResolvedValue(1);

      const result = await service.findAllByUser('user-1');

      expect(result.posts).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should filter by status', async () => {
      prisma.post.findMany.mockResolvedValue([]);
      prisma.post.count.mockResolvedValue(0);

      await service.findAllByUser('user-1', 'POSTED' as any);

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1', status: 'POSTED' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a post', async () => {
      prisma.post.findUnique.mockResolvedValue(mockPost);

      const result = await service.findOne('post-1', 'user-1');

      expect(result.id).toBe('post-1');
    });

    it('should throw NotFoundException if not found', async () => {
      prisma.post.findUnique.mockResolvedValue(null);

      await expect(service.findOne('bad-id', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if wrong user', async () => {
      prisma.post.findUnique.mockResolvedValue(mockPost);

      await expect(service.findOne('post-1', 'other-user')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('delete', () => {
    it('should delete own post', async () => {
      prisma.post.findUnique.mockResolvedValue(mockPost);
      prisma.post.delete.mockResolvedValue(mockPost);

      const result = await service.delete('post-1', 'user-1');

      expect(result).toEqual({ deleted: true });
    });

    it('should throw ForbiddenException for other user post', async () => {
      prisma.post.findUnique.mockResolvedValue(mockPost);

      await expect(service.delete('post-1', 'other-user')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateStatus', () => {
    it('should update post status', async () => {
      prisma.post.update.mockResolvedValue({ ...mockPost, status: 'POSTED' });

      const result = await service.updateStatus('post-1', 'POSTED' as any);

      expect(prisma.post.update).toHaveBeenCalledWith({
        where: { id: 'post-1' },
        data: { status: 'POSTED' },
      });
    });
  });
});

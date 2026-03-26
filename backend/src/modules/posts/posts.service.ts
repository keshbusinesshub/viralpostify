import { Injectable, Inject, LoggerService, NotFoundException, ForbiddenException } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { PostStatus } from '@prisma/client';

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {}

  async create(userId: string, dto: CreatePostDto) {
    const status = dto.scheduledTime ? PostStatus.SCHEDULED : (dto.status || PostStatus.DRAFT);

    const post = await this.prisma.post.create({
      data: {
        userId,
        content: dto.content,
        mediaUrl: dto.mediaUrl,
        platform: dto.platform,
        status,
        scheduledTime: dto.scheduledTime ? new Date(dto.scheduledTime) : null,
      },
    });

    this.logger.log(`Post created: ${post.id} [${post.platform}] status=${status} by user ${userId}`, 'PostsService');
    return post;
  }

  async findAllByUser(userId: string, status?: PostStatus, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: any = { userId };
    if (status) where.status = status;

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.post.count({ where }),
    ]);

    return { posts, total, page, limit };
  }

  async findOne(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) throw new NotFoundException('Post not found');
    if (post.userId !== userId) throw new ForbiddenException();

    return post;
  }

  async delete(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) throw new NotFoundException('Post not found');
    if (post.userId !== userId) throw new ForbiddenException();

    await this.prisma.post.delete({ where: { id: postId } });
    this.logger.log(`Post deleted: ${postId} by user ${userId}`, 'PostsService');
    return { deleted: true };
  }

  async updateStatus(postId: string, status: PostStatus, platformResponse?: any) {
    this.logger.log(`Post status updated: ${postId} → ${status}`, 'PostsService');
    return this.prisma.post.update({
      where: { id: postId },
      data: {
        status,
        ...(platformResponse && { platformResponse }),
      },
    });
  }
}

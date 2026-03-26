import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { SchedulePostDto } from './dto/schedule-post.dto';
import { PostStatus } from '@prisma/client';

@Injectable()
export class SchedulerService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('post-queue') private postQueue: Queue,
  ) {}

  async schedulePost(userId: string, dto: SchedulePostDto) {
    const scheduledTime = new Date(dto.scheduledTime);
    const delay = scheduledTime.getTime() - Date.now();

    if (delay < 0) {
      throw new Error('Scheduled time must be in the future');
    }

    // Create post record
    const post = await this.prisma.post.create({
      data: {
        userId,
        content: dto.content,
        mediaUrl: dto.mediaUrl,
        platform: dto.platform,
        status: PostStatus.SCHEDULED,
        scheduledTime,
      },
    });

    // Add to queue with delay
    await this.postQueue.add(
      'publish-post',
      {
        postId: post.id,
        userId,
        content: dto.content,
        mediaUrl: dto.mediaUrl,
        platform: dto.platform,
      },
      {
        delay,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: true,
      },
    );

    return post;
  }

  async getScheduledPosts(userId: string) {
    return this.prisma.post.findMany({
      where: {
        userId,
        status: PostStatus.SCHEDULED,
      },
      orderBy: { scheduledTime: 'asc' },
    });
  }
}

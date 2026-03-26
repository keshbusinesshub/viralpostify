import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { PostStatus } from '@prisma/client';

interface PostJobData {
  postId: string;
  userId: string;
  content: string;
  mediaUrl?: string;
  platform: string;
}

@Processor('post-queue')
export class SchedulerProcessor {
  private readonly logger = new Logger(SchedulerProcessor.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  @Process('publish-post')
  async handlePublishPost(job: Job<PostJobData>) {
    const { postId, content, mediaUrl, platform } = job.data;

    this.logger.log(`Processing post ${postId} for platform ${platform}`);

    try {
      // Trigger n8n webhook
      const webhookUrl = this.config.get<string>('n8n.webhookUrl');

      const response = await fetch(webhookUrl!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          content,
          mediaUrl,
          platform,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`n8n webhook returned ${response.status}`);
      }

      const result = await response.json();

      // Update post status to posted
      await this.prisma.post.update({
        where: { id: postId },
        data: {
          status: PostStatus.POSTED,
          platformResponse: result,
        },
      });

      this.logger.log(`Post ${postId} published successfully`);
    } catch (error) {
      this.logger.error(`Failed to publish post ${postId}:`, error);

      await this.prisma.post.update({
        where: { id: postId },
        data: {
          status: PostStatus.FAILED,
          platformResponse: { error: String(error) },
        },
      });

      throw error;
    }
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { v4 as uuid } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';
import { MediaType } from '@prisma/client';

@Injectable()
export class MediaService {
  private s3: S3Client;
  private bucket: string;
  private region: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.region = this.config.get<string>('aws.s3Region') || 'us-east-1';
    this.bucket = this.config.get<string>('aws.s3Bucket') || 'viralpostify-media';
    this.s3 = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.config.get<string>('aws.accessKeyId') || '',
        secretAccessKey: this.config.get<string>('aws.secretAccessKey') || '',
      },
    });
  }

  async upload(userId: string, file: Express.Multer.File) {
    const ext = file.originalname.split('.').pop();
    const key = `uploads/${userId}/${uuid()}.${ext}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    const fileUrl = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;

    const media = await this.prisma.media.create({
      data: {
        userId,
        fileUrl,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        type: this.getMediaType(file.mimetype),
      },
    });

    return media;
  }

  async findAllByUser(userId: string) {
    return this.prisma.media.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async delete(mediaId: string, userId: string) {
    const media = await this.prisma.media.findFirst({
      where: { id: mediaId, userId },
    });

    if (!media) throw new NotFoundException('Media not found');

    // Extract S3 key from URL
    const url = new URL(media.fileUrl);
    const key = url.pathname.substring(1);

    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );

    await this.prisma.media.delete({ where: { id: mediaId } });
    return { deleted: true };
  }

  private getMediaType(mimeType: string): MediaType {
    if (mimeType.startsWith('image/')) return MediaType.IMAGE;
    if (mimeType.startsWith('video/')) return MediaType.VIDEO;
    return MediaType.DOCUMENT;
  }
}

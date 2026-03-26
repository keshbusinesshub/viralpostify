import { IsString, IsDateString, IsOptional, MaxLength } from 'class-validator';

export class SchedulePostDto {
  @IsString()
  @MaxLength(5000)
  content: string;

  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @IsString()
  platform: string;

  @IsDateString()
  scheduledTime: string;
}

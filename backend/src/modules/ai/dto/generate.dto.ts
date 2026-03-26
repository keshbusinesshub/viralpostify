import { IsString, IsEnum, IsOptional, MaxLength } from 'class-validator';

export enum GenerationType {
  CAPTION = 'caption',
  HASHTAGS = 'hashtags',
  FULL_POST = 'full_post',
}

export class GenerateContentDto {
  @IsString()
  @MaxLength(1000)
  prompt: string;

  @IsEnum(GenerationType)
  type: GenerationType;

  @IsOptional()
  @IsString()
  platform?: string;

  @IsOptional()
  @IsString()
  tone?: string;
}

import { IsString, IsOptional } from 'class-validator';

export class ConnectAccountDto {
  @IsString()
  platform: string;

  @IsString()
  accessToken: string;

  @IsOptional()
  @IsString()
  refreshToken?: string;

  @IsOptional()
  @IsString()
  accountName?: string;

  @IsOptional()
  @IsString()
  platformUserId?: string;
}

import { IsArray, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class MarkCleanupDto {
  @IsArray()
  fileIds: string[];

  @IsNumber()
  @Min(1)
  retentionDays: number; // Masalan: 7 kun, 14 kun, 30 kun

  @IsOptional()
  @IsString()
  reason?: string;
}

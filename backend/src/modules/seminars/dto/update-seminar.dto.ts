import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsArray,
  IsUUID,
  IsBoolean,
} from 'class-validator';
import { SeminarStatus, FileAccess } from '../../../common/enums';

export class UpdateSeminarDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  targetUserId?: string;

  @IsUUID()
  @IsOptional()
  departmentId?: string;

  @IsEnum(SeminarStatus)
  @IsOptional()
  status?: SeminarStatus;

  @IsEnum(FileAccess)
  @IsOptional()
  fileAccess?: FileAccess;

  @IsDateString()
  @IsOptional()
  scheduledAt?: string;

  @IsBoolean()
  @IsOptional()
  isLive?: boolean;

  @IsBoolean()
  @IsOptional()
  isRecorded?: boolean;

  @IsString()
  @IsOptional()
  coverImageUrl?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

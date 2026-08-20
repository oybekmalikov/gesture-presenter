import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
  IsArray,
  IsUUID,
} from 'class-validator';
import { SeminarStatus, FileAccess } from '../../../common/enums';

export class CreateSeminarDto {
  @IsString()
  @IsNotEmpty()
  title: string;

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

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

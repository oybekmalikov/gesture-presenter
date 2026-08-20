import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { SeminarStatus, FileAccess } from '../../../common/enums';

export enum SeminarTabType {
  ALL = 'all',
  SCHEDULED = 'scheduled',
  LIVE = 'live',
  COMPLETED = 'completed',
  MY = 'my',
  DEPARTMENT = 'department',
}

export enum SeminarSortBy {
  LATEST = 'latest',
  POPULAR = 'popular',
  VIEWS = 'views',
}

export class QuerySeminarDto {
  @IsEnum(SeminarTabType)
  @IsOptional()
  tab?: SeminarTabType = SeminarTabType.ALL;

  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  tag?: string;

  @IsString()
  @IsOptional()
  departmentId?: string;

  @IsEnum(SeminarStatus)
  @IsOptional()
  status?: SeminarStatus;

  @IsEnum(FileAccess)
  @IsOptional()
  fileAccess?: FileAccess;

  @IsEnum(SeminarSortBy)
  @IsOptional()
  sortBy?: SeminarSortBy = SeminarSortBy.LATEST;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 12;
}

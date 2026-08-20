import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Role } from '../../../common/enums/role.enum';
import { Gender } from '../../../common/enums';

export class BulkImportUserItemDto {
  @IsString()
  @IsNotEmpty()
  fio: string;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @IsString()
  @IsOptional()
  lavozim?: string;

  /** Bo'lim kodi (masalan: IT_DEPT) yoki UUID */
  @IsString()
  @IsOptional()
  departmentCodeOrId?: string;

  /** Sub-bo'lim kodi yoki UUID */
  @IsString()
  @IsOptional()
  subDepartmentCodeOrId?: string;

  /** Lavozim kodi yoki UUID */
  @IsString()
  @IsOptional()
  positionCodeOrId?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;
}

export class BulkImportUsersDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkImportUserItemDto)
  users: BulkImportUserItemDto[];
}

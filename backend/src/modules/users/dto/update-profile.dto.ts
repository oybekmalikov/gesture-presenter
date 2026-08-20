import { IsOptional, IsString, IsEnum } from 'class-validator';
import { Gender } from '../../../common/enums';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  fio?: string;

  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;
}

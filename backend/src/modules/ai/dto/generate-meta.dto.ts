import { IsString, IsOptional, IsIn } from 'class-validator';

export class GenerateMetaDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsIn(['uz', 'ru', 'en'])
  language?: 'uz' | 'ru' | 'en';
}

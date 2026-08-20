import { IsString, IsOptional, IsNumber, Min, Max, IsIn } from 'class-validator';

export class GenerateOutlineDto {
  @IsString()
  topic: string;

  @IsOptional()
  @IsString()
  targetAudience?: string;

  @IsOptional()
  @IsNumber()
  @Min(3)
  @Max(30)
  slideCount?: number;

  @IsOptional()
  @IsIn(['uz', 'ru', 'en'])
  language?: 'uz' | 'ru' | 'en';

  @IsOptional()
  @IsString()
  additionalNotes?: string;
}

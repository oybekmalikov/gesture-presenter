import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsIn,
  IsArray,
} from 'class-validator';

export class GenerateSlidesDto {
  @IsString()
  topic: string;

  @IsOptional()
  @IsArray()
  outline?: string[];

  @IsOptional()
  @IsNumber()
  @Min(3)
  @Max(30)
  slideCount?: number;

  @IsOptional()
  @IsIn(['uz', 'ru', 'en'])
  language?: 'uz' | 'ru' | 'en';

  @IsOptional()
  @IsIn(['corporate', 'technical', 'scientific', 'motivational', 'training'])
  style?: 'corporate' | 'technical' | 'scientific' | 'motivational' | 'training';
}

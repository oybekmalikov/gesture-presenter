import { IsOptional, IsString, IsInt, Min } from 'class-validator';

export class UpdateLiveStateDto {
  @IsString()
  @IsOptional()
  currentFileId?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  currentSlideIndex?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  participantCount?: number;
}

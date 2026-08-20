import { IsString, IsNotEmpty, IsInt, Min } from 'class-validator';

export class CreateRecordingDto {
  @IsString()
  @IsNotEmpty()
  filePath: string;

  @IsInt()
  @Min(0)
  durationSeconds: number;

  @IsInt()
  @Min(0)
  size: number;
}

import { IsArray, IsUUID } from 'class-validator';

export class ReorderFilesDto {
  @IsArray()
  @IsUUID('4', { each: true })
  fileIds: string[];
}

import { IsString, IsOptional, IsArray } from 'class-validator';

export class AiChatDto {
  @IsString()
  prompt: string;

  @IsOptional()
  @IsString()
  seminarId?: string;

  @IsOptional()
  @IsString()
  context?: string;

  @IsOptional()
  @IsArray()
  history?: { role: 'user' | 'assistant'; content: string }[];
}

import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AiService } from './ai.service';
import { GenerateOutlineDto } from './dto/generate-outline.dto';
import { GenerateSlidesDto } from './dto/generate-slides.dto';
import { GenerateMetaDto } from './dto/generate-meta.dto';
import { AiChatDto } from './dto/ai-chat.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('templates')
  getTemplates() {
    return this.aiService.getTemplates();
  }

  @Post('outline')
  @UseGuards(OptionalJwtAuthGuard)
  generateOutline(@Body() dto: GenerateOutlineDto) {
    return this.aiService.generateOutline(dto);
  }

  @Post('slides')
  @UseGuards(OptionalJwtAuthGuard)
  generateSlides(@Body() dto: GenerateSlidesDto) {
    return this.aiService.generateSlides(dto);
  }

  @Post('meta')
  @UseGuards(OptionalJwtAuthGuard)
  generateMeta(@Body() dto: GenerateMetaDto) {
    return this.aiService.generateMeta(dto);
  }

  @Post('chat')
  @UseGuards(OptionalJwtAuthGuard)
  askAssistant(@Body() dto: AiChatDto) {
    return this.aiService.askAssistant(dto);
  }
}

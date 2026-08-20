import { ConfigService } from '@nestjs/config';
import { GenerateOutlineDto } from './dto/generate-outline.dto';
import { GenerateSlidesDto } from './dto/generate-slides.dto';
import { GenerateMetaDto } from './dto/generate-meta.dto';
import { AiChatDto } from './dto/ai-chat.dto';
import { ApiResponse } from '../../common/response';
export interface SlideItem {
    slideNumber: number;
    title: string;
    keyPoints: string[];
    speakerNotes: string;
    visualSuggestion: string;
}
export interface PresentationOutline {
    title: string;
    targetAudience: string;
    estimatedMinutes: number;
    sections: {
        sectionTitle: string;
        description: string;
        subtopics: string[];
    }[];
    suggestedTags: string[];
}
export declare class AiService {
    private readonly config;
    private readonly logger;
    constructor(config: ConfigService);
    generateOutline(dto: GenerateOutlineDto): Promise<ApiResponse<PresentationOutline>>;
    generateSlides(dto: GenerateSlidesDto): Promise<ApiResponse<{
        topic: string;
        slides: SlideItem[];
    }>>;
    generateMeta(dto: GenerateMetaDto): Promise<ApiResponse<{
        description: string;
        tags: string[];
        keyTakeaways: string[];
    }>>;
    askAssistant(dto: AiChatDto): Promise<ApiResponse<{
        answer: string;
        relatedSuggestions: string[];
    }>>;
    getTemplates(): ApiResponse;
    private buildSemanticOutline;
    private buildSemanticSlides;
    private buildSemanticMeta;
    private buildSemanticChatAnswer;
    private extractTagsFromTopic;
    private callExternalLlmForJson;
    private callExternalLlmForText;
}

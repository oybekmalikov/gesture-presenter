import { AiService } from './ai.service';
import { GenerateOutlineDto } from './dto/generate-outline.dto';
import { GenerateSlidesDto } from './dto/generate-slides.dto';
import { GenerateMetaDto } from './dto/generate-meta.dto';
import { AiChatDto } from './dto/ai-chat.dto';
export declare class AiController {
    private readonly aiService;
    constructor(aiService: AiService);
    getTemplates(): import("../../common/response").ApiResponse<any>;
    generateOutline(dto: GenerateOutlineDto): Promise<import("../../common/response").ApiResponse<import("./ai.service").PresentationOutline>>;
    generateSlides(dto: GenerateSlidesDto): Promise<import("../../common/response").ApiResponse<{
        topic: string;
        slides: import("./ai.service").SlideItem[];
    }>>;
    generateMeta(dto: GenerateMetaDto): Promise<import("../../common/response").ApiResponse<{
        description: string;
        tags: string[];
        keyTakeaways: string[];
    }>>;
    askAssistant(dto: AiChatDto): Promise<import("../../common/response").ApiResponse<{
        answer: string;
        relatedSuggestions: string[];
    }>>;
}

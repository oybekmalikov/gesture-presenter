export declare class AiChatDto {
    prompt: string;
    seminarId?: string;
    context?: string;
    history?: {
        role: 'user' | 'assistant';
        content: string;
    }[];
}

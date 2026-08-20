import { InteractionsService } from './interactions.service';
import { AddCommentDto } from './dto/add-comment.dto';
export declare class InteractionsController {
    private readonly interactionsService;
    constructor(interactionsService: InteractionsService);
    toggleLike(seminarId: string, userId: string): Promise<import("../../common/response").ApiResponse<any>>;
    getComments(seminarId: string): Promise<import("../../common/response").ApiResponse<any>>;
    addComment(seminarId: string, userId: string, dto: AddCommentDto): Promise<import("../../common/response").ApiResponse<any>>;
    removeComment(id: string, currentUser: any): Promise<import("../../common/response").ApiResponse<any>>;
    toggleSave(seminarId: string, userId: string): Promise<import("../../common/response").ApiResponse<any>>;
    getSavedSeminars(userId: string, page?: number, limit?: number): Promise<import("../../common/response").ApiResponse<any>>;
}

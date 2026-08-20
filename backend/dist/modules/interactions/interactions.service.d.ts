import { Repository } from 'typeorm';
import { Like } from '../../database/entities/like.entity';
import { Comment } from '../../database/entities/comment.entity';
import { SavedSeminar } from '../../database/entities/saved-seminar.entity';
import { Seminar } from '../../database/entities/seminar.entity';
import { User } from '../../database/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { AddCommentDto } from './dto/add-comment.dto';
import { ApiResponse } from '../../common/response';
import { Role } from '../../common/enums/role.enum';
export declare class InteractionsService {
    private readonly likeRepo;
    private readonly commentRepo;
    private readonly savedRepo;
    private readonly seminarRepo;
    private readonly userRepo;
    private readonly notificationsService;
    constructor(likeRepo: Repository<Like>, commentRepo: Repository<Comment>, savedRepo: Repository<SavedSeminar>, seminarRepo: Repository<Seminar>, userRepo: Repository<User>, notificationsService: NotificationsService);
    toggleLike(seminarId: string, userId: string): Promise<ApiResponse>;
    addComment(seminarId: string, userId: string, dto: AddCommentDto): Promise<ApiResponse>;
    getSeminarComments(seminarId: string): Promise<ApiResponse>;
    removeComment(commentId: string, userId: string, userRole: Role): Promise<ApiResponse>;
    toggleSave(seminarId: string, userId: string): Promise<ApiResponse>;
    getSavedSeminars(userId: string, page?: number, limit?: number): Promise<ApiResponse>;
}

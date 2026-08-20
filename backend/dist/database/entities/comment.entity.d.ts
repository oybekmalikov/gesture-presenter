import { User } from './user.entity';
import { Seminar } from './seminar.entity';
export declare class Comment {
    id: string;
    userId: string;
    user: User;
    seminarId: string;
    seminar: Seminar;
    content: string;
    parentId?: string;
    parent?: Comment;
    replies: Comment[];
    createdAt: Date;
    updatedAt: Date;
}

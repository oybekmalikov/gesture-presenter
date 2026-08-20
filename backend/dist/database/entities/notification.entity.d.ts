import { NotificationType } from '../../common/enums';
import { User } from './user.entity';
export declare class Notification {
    id: string;
    userId: string;
    user: User;
    type: NotificationType;
    title: string;
    message: string;
    meta: Record<string, any>;
    isRead: boolean;
    readAt: Date;
    createdAt: Date;
}

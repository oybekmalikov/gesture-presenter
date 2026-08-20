import { Repository } from 'typeorm';
import { Notification } from '../../database/entities/notification.entity';
import { Seminar } from '../../database/entities/seminar.entity';
import { NotificationType } from '../../common/enums';
import { NotificationsGateway } from './notifications.gateway';
import { ApiResponse } from '../../common/response';
export declare class NotificationsService {
    private readonly notifRepo;
    private readonly notifGateway?;
    constructor(notifRepo: Repository<Notification>, notifGateway?: NotificationsGateway | undefined);
    getUserNotifications(userId: string, page?: number, limit?: number, unreadOnly?: boolean): Promise<ApiResponse>;
    getUnreadCount(userId: string): Promise<ApiResponse>;
    markAsRead(id: string, userId: string): Promise<ApiResponse>;
    markAllAsRead(userId: string): Promise<ApiResponse>;
    clearRead(userId: string): Promise<ApiResponse>;
    remove(id: string, userId: string): Promise<ApiResponse>;
    createNotification(userId: string, type: NotificationType, title: string, message?: string, meta?: Record<string, any>): Promise<Notification>;
    notifySeminarAssigned(seminar: Seminar, targetUserId: string): Promise<Notification>;
    notifyCommentReply(parentUserId: string, seminarId: string, seminarTitle: string, replyAuthorFio: string): Promise<Notification>;
    notifyFileDeleteWarning(userId: string, fileName: string, seminarTitle: string, deleteAfterDays: number): Promise<Notification>;
}

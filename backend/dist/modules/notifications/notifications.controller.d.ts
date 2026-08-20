import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    getUserNotifications(userId: string, page?: number, limit?: number, unreadOnly?: string): Promise<import("../../common/response").ApiResponse<any>>;
    getUnreadCount(userId: string): Promise<import("../../common/response").ApiResponse<any>>;
    markAllAsRead(userId: string): Promise<import("../../common/response").ApiResponse<any>>;
    markAsRead(id: string, userId: string): Promise<import("../../common/response").ApiResponse<any>>;
    clearRead(userId: string): Promise<import("../../common/response").ApiResponse<any>>;
    remove(id: string, userId: string): Promise<import("../../common/response").ApiResponse<any>>;
}

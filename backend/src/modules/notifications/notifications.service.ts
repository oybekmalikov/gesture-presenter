import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../../database/entities/notification.entity';
import { Seminar } from '../../database/entities/seminar.entity';
import { NotificationType } from '../../common/enums';
import { NotificationsGateway } from './notifications.gateway';
import {
  ApiResponse,
  successResponse,
  errorResponse,
  MESSAGES,
} from '../../common/response';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notifRepo: Repository<Notification>,
    @Optional()
    private readonly notifGateway?: NotificationsGateway,
  ) {}

  async getUserNotifications(
    userId: string,
    page = 1,
    limit = 20,
    unreadOnly = false,
  ): Promise<ApiResponse> {
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const [items, total] = await this.notifRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return successResponse(
      {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      MESSAGES.FETCHED,
    );
  }

  async getUnreadCount(userId: string): Promise<ApiResponse> {
    const count = await this.notifRepo.count({
      where: { userId, isRead: false },
    });
    return successResponse({ unreadCount: count }, MESSAGES.FETCHED);
  }

  async markAsRead(id: string, userId: string): Promise<ApiResponse> {
    const notif = await this.notifRepo.findOne({ where: { id, userId } });
    if (!notif) {
      return errorResponse(MESSAGES.NOT_FOUND);
    }

    notif.isRead = true;
    notif.readAt = new Date();
    const saved = await this.notifRepo.save(notif);
    return successResponse(saved, MESSAGES.UPDATED);
  }

  async markAllAsRead(userId: string): Promise<ApiResponse> {
    await this.notifRepo.update(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );
    return successResponse(null, MESSAGES.UPDATED);
  }

  async clearRead(userId: string): Promise<ApiResponse> {
    await this.notifRepo.delete({ userId, isRead: true });
    return successResponse(null, MESSAGES.DELETED);
  }

  async remove(id: string, userId: string): Promise<ApiResponse> {
    const notif = await this.notifRepo.findOne({ where: { id, userId } });
    if (!notif) {
      return errorResponse(MESSAGES.NOT_FOUND);
    }
    await this.notifRepo.remove(notif);
    return successResponse(null, MESSAGES.DELETED);
  }

  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message?: string,
    meta?: Record<string, any>,
  ): Promise<Notification> {
    const notif = this.notifRepo.create({
      userId,
      type,
      title,
      message,
      meta,
    });
    const saved = await this.notifRepo.save(notif);

    // Real-time Push via WebSocket Gateway
    if (this.notifGateway) {
      this.notifGateway.sendNotificationToUser(userId, saved);
    }

    return saved;
  }

  // ==================== SPECIALIZED NOTIFIERS ====================
  async notifySeminarAssigned(
    seminar: Seminar,
    targetUserId: string,
  ): Promise<Notification> {
    return this.createNotification(
      targetUserId,
      NotificationType.SEMINAR_REMINDER,
      `Yangi seminar sizga yo'naltirildi: ${seminar.title}`,
      `Seminar muallifi: ${seminar.author?.fio || 'Xodim'}. Rejalashtirilgan sana: ${seminar.scheduledAt ? new Date(seminar.scheduledAt).toLocaleString() : 'Belgilanmagan'}`,
      { seminarId: seminar.id },
    );
  }

  async notifyCommentReply(
    parentUserId: string,
    seminarId: string,
    seminarTitle: string,
    replyAuthorFio: string,
  ): Promise<Notification> {
    return this.createNotification(
      parentUserId,
      NotificationType.COMMENT_REPLY,
      `Sizning izohingizga javob berildi`,
      `${replyAuthorFio} "${seminarTitle}" seminaridagi izohingizga javob qoldirdi.`,
      { seminarId },
    );
  }

  async notifyFileDeleteWarning(
    userId: string,
    fileName: string,
    seminarTitle: string,
    deleteAfterDays: number,
  ): Promise<Notification> {
    return this.createNotification(
      userId,
      NotificationType.FILE_DELETE_WARNING,
      `Fayl o'chirilishi haqida ogohlantirish`,
      `"${seminarTitle}" seminaridagi "${fileName}" fayli ${deleteAfterDays} kundan keyin o'chirilishi rejalashtirilgan. Zarur bo'lsa uni yuklab oling yoki adminga murojaat qiling.`,
      { fileName },
    );
  }
}

"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const notification_entity_1 = require("../../database/entities/notification.entity");
const enums_1 = require("../../common/enums");
const notifications_gateway_1 = require("./notifications.gateway");
const response_1 = require("../../common/response");
let NotificationsService = class NotificationsService {
    notifRepo;
    notifGateway;
    constructor(notifRepo, notifGateway) {
        this.notifRepo = notifRepo;
        this.notifGateway = notifGateway;
    }
    async getUserNotifications(userId, page = 1, limit = 20, unreadOnly = false) {
        const skip = (page - 1) * limit;
        const where = { userId };
        if (unreadOnly) {
            where.isRead = false;
        }
        const [items, total] = await this.notifRepo.findAndCount({
            where,
            order: { createdAt: 'DESC' },
            skip,
            take: limit,
        });
        return (0, response_1.successResponse)({
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        }, response_1.MESSAGES.FETCHED);
    }
    async getUnreadCount(userId) {
        const count = await this.notifRepo.count({
            where: { userId, isRead: false },
        });
        return (0, response_1.successResponse)({ unreadCount: count }, response_1.MESSAGES.FETCHED);
    }
    async markAsRead(id, userId) {
        const notif = await this.notifRepo.findOne({ where: { id, userId } });
        if (!notif) {
            return (0, response_1.errorResponse)(response_1.MESSAGES.NOT_FOUND);
        }
        notif.isRead = true;
        notif.readAt = new Date();
        const saved = await this.notifRepo.save(notif);
        return (0, response_1.successResponse)(saved, response_1.MESSAGES.UPDATED);
    }
    async markAllAsRead(userId) {
        await this.notifRepo.update({ userId, isRead: false }, { isRead: true, readAt: new Date() });
        return (0, response_1.successResponse)(null, response_1.MESSAGES.UPDATED);
    }
    async clearRead(userId) {
        await this.notifRepo.delete({ userId, isRead: true });
        return (0, response_1.successResponse)(null, response_1.MESSAGES.DELETED);
    }
    async remove(id, userId) {
        const notif = await this.notifRepo.findOne({ where: { id, userId } });
        if (!notif) {
            return (0, response_1.errorResponse)(response_1.MESSAGES.NOT_FOUND);
        }
        await this.notifRepo.remove(notif);
        return (0, response_1.successResponse)(null, response_1.MESSAGES.DELETED);
    }
    async createNotification(userId, type, title, message, meta) {
        const notif = this.notifRepo.create({
            userId,
            type,
            title,
            message,
            meta,
        });
        const saved = await this.notifRepo.save(notif);
        if (this.notifGateway) {
            this.notifGateway.sendNotificationToUser(userId, saved);
        }
        return saved;
    }
    async notifySeminarAssigned(seminar, targetUserId) {
        return this.createNotification(targetUserId, enums_1.NotificationType.SEMINAR_REMINDER, `Yangi seminar sizga yo'naltirildi: ${seminar.title}`, `Seminar muallifi: ${seminar.author?.fio || 'Xodim'}. Rejalashtirilgan sana: ${seminar.scheduledAt ? new Date(seminar.scheduledAt).toLocaleString() : 'Belgilanmagan'}`, { seminarId: seminar.id });
    }
    async notifyCommentReply(parentUserId, seminarId, seminarTitle, replyAuthorFio) {
        return this.createNotification(parentUserId, enums_1.NotificationType.COMMENT_REPLY, `Sizning izohingizga javob berildi`, `${replyAuthorFio} "${seminarTitle}" seminaridagi izohingizga javob qoldirdi.`, { seminarId });
    }
    async notifyFileDeleteWarning(userId, fileName, seminarTitle, deleteAfterDays) {
        return this.createNotification(userId, enums_1.NotificationType.FILE_DELETE_WARNING, `Fayl o'chirilishi haqida ogohlantirish`, `"${seminarTitle}" seminaridagi "${fileName}" fayli ${deleteAfterDays} kundan keyin o'chirilishi rejalashtirilgan. Zarur bo'lsa uni yuklab oling yoki adminga murojaat qiling.`, { fileName });
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(notification_entity_1.Notification)),
    __param(1, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        notifications_gateway_1.NotificationsGateway])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map
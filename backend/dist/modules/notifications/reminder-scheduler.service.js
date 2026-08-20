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
var ReminderSchedulerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReminderSchedulerService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const seminar_entity_1 = require("../../database/entities/seminar.entity");
const notification_entity_1 = require("../../database/entities/notification.entity");
const user_entity_1 = require("../../database/entities/user.entity");
const saved_seminar_entity_1 = require("../../database/entities/saved-seminar.entity");
const enums_1 = require("../../common/enums");
const INTERVALS = [
    {
        key: '3d',
        minMs: 71 * 3600 * 1000,
        maxMs: 73 * 3600 * 1000,
        labelUz: '3 kun qoldi',
        labelRu: 'осталось 3 дня',
    },
    {
        key: '2d',
        minMs: 47 * 3600 * 1000,
        maxMs: 49 * 3600 * 1000,
        labelUz: '2 kun qoldi',
        labelRu: 'осталось 2 дня',
    },
    {
        key: '1d',
        minMs: 23 * 3600 * 1000,
        maxMs: 25 * 3600 * 1000,
        labelUz: '1 kun qoldi',
        labelRu: 'остался 1 день',
    },
    {
        key: '5h',
        minMs: 4.8 * 3600 * 1000,
        maxMs: 5.2 * 3600 * 1000,
        labelUz: '5 soat qoldi',
        labelRu: 'осталось 5 часов',
    },
    {
        key: '3h',
        minMs: 2.8 * 3600 * 1000,
        maxMs: 3.2 * 3600 * 1000,
        labelUz: '3 soat qoldi',
        labelRu: 'осталось 3 часа',
    },
    {
        key: '1h',
        minMs: 50 * 60 * 1000,
        maxMs: 65 * 60 * 1000,
        labelUz: '1 soat qoldi',
        labelRu: 'остался 1 час',
    },
    {
        key: '1m',
        minMs: 0,
        maxMs: 2 * 60 * 1000,
        labelUz: 'boshlanish arafasida (1 daqiqa)',
        labelRu: 'начинается прямо сейчас',
    },
];
let ReminderSchedulerService = ReminderSchedulerService_1 = class ReminderSchedulerService {
    seminarRepo;
    notifRepo;
    userRepo;
    savedRepo;
    logger = new common_1.Logger(ReminderSchedulerService_1.name);
    constructor(seminarRepo, notifRepo, userRepo, savedRepo) {
        this.seminarRepo = seminarRepo;
        this.notifRepo = notifRepo;
        this.userRepo = userRepo;
        this.savedRepo = savedRepo;
    }
    async checkUpcomingSeminars() {
        try {
            const now = new Date();
            const maxFuture = new Date(now.getTime() + 74 * 3600 * 1000);
            const upcomingSeminars = await this.seminarRepo
                .createQueryBuilder('seminar')
                .leftJoinAndSelect('seminar.author', 'author')
                .leftJoinAndSelect('seminar.department', 'department')
                .where('seminar.status = :status', { status: enums_1.SeminarStatus.SCHEDULED })
                .andWhere('seminar.scheduledAt IS NOT NULL')
                .andWhere('seminar.scheduledAt >= :now', { now })
                .andWhere('seminar.scheduledAt <= :maxFuture', { maxFuture })
                .getMany();
            if (!upcomingSeminars || upcomingSeminars.length === 0) {
                return;
            }
            for (const seminar of upcomingSeminars) {
                const diffMs = new Date(seminar.scheduledAt).getTime() - now.getTime();
                for (const interval of INTERVALS) {
                    if (diffMs >= interval.minMs && diffMs <= interval.maxMs) {
                        await this.processIntervalNotification(seminar, interval);
                        break;
                    }
                }
            }
        }
        catch (err) {
            this.logger.error(`Scheduler xatolik: ${err.message}`, err.stack);
        }
    }
    async processIntervalNotification(seminar, interval) {
        const recipientIds = new Set();
        if (seminar.authorId) {
            recipientIds.add(seminar.authorId);
        }
        if (seminar.targetUserId) {
            recipientIds.add(seminar.targetUserId);
        }
        if (seminar.fileAccess === enums_1.FileAccess.PRIVATE && seminar.departmentId) {
            const deptUsers = await this.userRepo.find({
                where: { departmentId: seminar.departmentId, isActive: true },
                select: { id: true },
            });
            deptUsers.forEach((u) => recipientIds.add(u.id));
        }
        else {
            const savedUsers = await this.savedRepo.find({
                where: { seminarId: seminar.id },
                select: { userId: true },
            });
            savedUsers.forEach((s) => recipientIds.add(s.userId));
        }
        if (recipientIds.size === 0)
            return;
        for (const userId of recipientIds) {
            const existing = await this.notifRepo
                .createQueryBuilder('notif')
                .where('notif.userId = :userId', { userId })
                .andWhere("notif.meta ->> 'seminarId' = :seminarId", {
                seminarId: seminar.id,
            })
                .andWhere("notif.meta ->> 'intervalKey' = :intervalKey", {
                intervalKey: interval.key,
            })
                .getOne();
            if (!existing) {
                const notif = this.notifRepo.create({
                    userId,
                    type: enums_1.NotificationType.SEMINAR_REMINDER,
                    title: `Seminar eslatmasi: ${interval.labelUz}`,
                    message: `"${seminar.title}" seminari boshlanishiga ${interval.labelUz}. Boshlanish vaqti: ${new Date(seminar.scheduledAt).toLocaleString()}`,
                    meta: {
                        seminarId: seminar.id,
                        intervalKey: interval.key,
                        scheduledAt: seminar.scheduledAt,
                    },
                });
                await this.notifRepo.save(notif);
            }
        }
    }
};
exports.ReminderSchedulerService = ReminderSchedulerService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReminderSchedulerService.prototype, "checkUpcomingSeminars", null);
exports.ReminderSchedulerService = ReminderSchedulerService = ReminderSchedulerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(seminar_entity_1.Seminar)),
    __param(1, (0, typeorm_1.InjectRepository)(notification_entity_1.Notification)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(3, (0, typeorm_1.InjectRepository)(saved_seminar_entity_1.SavedSeminar)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ReminderSchedulerService);
//# sourceMappingURL=reminder-scheduler.service.js.map
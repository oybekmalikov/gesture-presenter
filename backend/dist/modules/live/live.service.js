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
exports.LiveService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const config_1 = require("@nestjs/config");
const livekit_server_sdk_1 = require("livekit-server-sdk");
const live_session_entity_1 = require("../../database/entities/live-session.entity");
const seminar_entity_1 = require("../../database/entities/seminar.entity");
const recording_entity_1 = require("../../database/entities/recording.entity");
const comment_entity_1 = require("../../database/entities/comment.entity");
const user_entity_1 = require("../../database/entities/user.entity");
const saved_seminar_entity_1 = require("../../database/entities/saved-seminar.entity");
const notifications_service_1 = require("../notifications/notifications.service");
const live_gateway_1 = require("./live.gateway");
const response_1 = require("../../common/response");
const enums_1 = require("../../common/enums");
const role_enum_1 = require("../../common/enums/role.enum");
let LiveService = class LiveService {
    sessionRepo;
    seminarRepo;
    recordingRepo;
    commentRepo;
    userRepo;
    savedRepo;
    notificationsService;
    config;
    liveGateway;
    constructor(sessionRepo, seminarRepo, recordingRepo, commentRepo, userRepo, savedRepo, notificationsService, config, liveGateway) {
        this.sessionRepo = sessionRepo;
        this.seminarRepo = seminarRepo;
        this.recordingRepo = recordingRepo;
        this.commentRepo = commentRepo;
        this.userRepo = userRepo;
        this.savedRepo = savedRepo;
        this.notificationsService = notificationsService;
        this.config = config;
        this.liveGateway = liveGateway;
    }
    async startLiveSession(seminarId, userId, userRole) {
        const seminar = await this.seminarRepo.findOne({
            where: { id: seminarId },
            relations: { author: true, department: true },
        });
        if (!seminar) {
            return (0, response_1.errorResponse)(response_1.MESSAGES.SEMINAR_NOT_FOUND);
        }
        if (seminar.authorId !== userId &&
            userRole !== role_enum_1.Role.ADMIN &&
            userRole !== role_enum_1.Role.SUPERADMIN) {
            return (0, response_1.errorResponse)(response_1.MESSAGES.FORBIDDEN);
        }
        let session = await this.sessionRepo.findOne({
            where: { seminarId, status: enums_1.LiveSessionStatus.ACTIVE },
        });
        const now = new Date();
        if (!session) {
            session = this.sessionRepo.create({
                seminarId,
                roomId: `live_${seminarId.slice(0, 8)}_${Date.now()}`,
                status: enums_1.LiveSessionStatus.ACTIVE,
                startedAt: now,
                participantCount: 1,
                peakViewerCount: 1,
            });
            session = await this.sessionRepo.save(session);
        }
        seminar.isLive = true;
        seminar.status = enums_1.SeminarStatus.LIVE;
        if (!seminar.startedAt) {
            seminar.startedAt = session.startedAt;
        }
        await this.seminarRepo.save(seminar);
        if (this.liveGateway) {
            this.liveGateway.broadcastLiveStateChange(seminarId, true, {
                roomId: session.roomId,
                startedAt: session.startedAt,
            });
        }
        this.sendLiveStartedNotifications(seminar).catch(() => { });
        return (0, response_1.successResponse)({ session, roomId: session.roomId }, {
            uz: 'Jonli seminar muvaffaqiyatli boshlandi',
            ru: 'Прямой эфир успешно начался',
        });
    }
    async updateLiveState(seminarId, dto, userId, userRole) {
        const seminar = await this.seminarRepo.findOne({
            where: { id: seminarId },
        });
        if (!seminar) {
            return (0, response_1.errorResponse)(response_1.MESSAGES.SEMINAR_NOT_FOUND);
        }
        if (seminar.authorId !== userId &&
            userRole !== role_enum_1.Role.ADMIN &&
            userRole !== role_enum_1.Role.SUPERADMIN) {
            return (0, response_1.errorResponse)(response_1.MESSAGES.FORBIDDEN);
        }
        const session = await this.sessionRepo.findOne({
            where: { seminarId, status: enums_1.LiveSessionStatus.ACTIVE },
        });
        if (!session) {
            return (0, response_1.errorResponse)({
                uz: 'Faol jonli sessiya topilmadi',
                ru: 'Активная сессия не найдена',
            });
        }
        if (dto.currentFileId !== undefined) {
            session.currentFileId = dto.currentFileId;
        }
        if (dto.currentSlideIndex !== undefined) {
            session.currentSlideIndex = dto.currentSlideIndex;
        }
        if (dto.participantCount !== undefined) {
            session.participantCount = dto.participantCount;
            session.peakViewerCount = Math.max(session.peakViewerCount, dto.participantCount);
        }
        const saved = await this.sessionRepo.save(session);
        return (0, response_1.successResponse)(saved, response_1.MESSAGES.UPDATED);
    }
    async endLiveSession(seminarId, userId, userRole) {
        const seminar = await this.seminarRepo.findOne({
            where: { id: seminarId },
        });
        if (!seminar) {
            return (0, response_1.errorResponse)(response_1.MESSAGES.SEMINAR_NOT_FOUND);
        }
        if (seminar.authorId !== userId &&
            userRole !== role_enum_1.Role.ADMIN &&
            userRole !== role_enum_1.Role.SUPERADMIN) {
            return (0, response_1.errorResponse)(response_1.MESSAGES.FORBIDDEN);
        }
        const session = await this.sessionRepo.findOne({
            where: { seminarId, status: enums_1.LiveSessionStatus.ACTIVE },
        });
        const now = new Date();
        if (session) {
            session.status = enums_1.LiveSessionStatus.ENDED;
            session.endedAt = now;
            await this.sessionRepo.save(session);
            if (session.startedAt) {
                await this.commentRepo.delete({
                    seminarId,
                    createdAt: (0, typeorm_2.Between)(session.startedAt, now),
                });
            }
        }
        seminar.isLive = false;
        seminar.status = enums_1.SeminarStatus.COMPLETED;
        seminar.endedAt = now;
        await this.seminarRepo.save(seminar);
        if (this.liveGateway) {
            this.liveGateway.broadcastLiveStateChange(seminarId, false, {
                endedAt: now,
            });
        }
        return (0, response_1.successResponse)({
            seminarId,
            status: enums_1.SeminarStatus.COMPLETED,
            liveChatCleaned: true,
        }, {
            uz: 'Jonli seminar yakunlandi. Jonli chat tozalandi.',
            ru: 'Прямой эфир завершён. Чат прямого эфира очищен.',
        });
    }
    async generateLiveKitToken(seminarId, currentUser) {
        const seminar = await this.seminarRepo.findOne({
            where: { id: seminarId },
            relations: { author: true },
        });
        if (!seminar) {
            return (0, response_1.errorResponse)(response_1.MESSAGES.SEMINAR_NOT_FOUND);
        }
        const apiKey = this.config.get('LIVEKIT_API_KEY', 'okmk_livekit_key');
        const apiSecret = this.config.get('LIVEKIT_API_SECRET', 'okmk_livekit_secret_dev_2026');
        const serverUrl = this.config.get('LIVEKIT_URL', 'ws://localhost:7880');
        const isPresenter = currentUser &&
            (currentUser.id === seminar.authorId ||
                currentUser.role === role_enum_1.Role.ADMIN ||
                currentUser.role === role_enum_1.Role.SUPERADMIN);
        const identity = currentUser?.id || `guest_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const name = currentUser?.fio || currentUser?.username || 'Mehmon';
        const at = new livekit_server_sdk_1.AccessToken(apiKey, apiSecret, {
            identity,
            name,
            metadata: JSON.stringify({
                userId: currentUser?.id || null,
                role: currentUser?.role || 'guest',
                avatarUrl: currentUser?.avatarUrl || null,
                isPresenter,
            }),
            ttl: '6h',
        });
        at.addGrant({
            room: seminarId,
            roomJoin: true,
            canPublish: Boolean(isPresenter),
            canSubscribe: true,
            canPublishData: true,
        });
        const token = await at.toJwt();
        return (0, response_1.successResponse)({
            token,
            serverUrl,
            roomName: seminarId,
            identity,
            name,
            isPresenter: Boolean(isPresenter),
            seminarTitle: seminar.title,
        }, {
            uz: 'LiveKit streaming tokeni muvaffaqiyatli yaratildi',
            ru: 'Токен для трансляции LiveKit успешно создан',
        });
    }
    async addRecording(seminarId, dto, userId, userRole) {
        const seminar = await this.seminarRepo.findOne({
            where: { id: seminarId },
        });
        if (!seminar) {
            return (0, response_1.errorResponse)(response_1.MESSAGES.SEMINAR_NOT_FOUND);
        }
        if (seminar.authorId !== userId &&
            userRole !== role_enum_1.Role.ADMIN &&
            userRole !== role_enum_1.Role.SUPERADMIN) {
            return (0, response_1.errorResponse)(response_1.MESSAGES.FORBIDDEN);
        }
        const session = await this.sessionRepo.findOne({
            where: { seminarId },
            order: { createdAt: 'DESC' },
        });
        if (!session) {
            return (0, response_1.errorResponse)({
                uz: 'Ushbu seminar uchun sessiya topilmadi',
                ru: 'Сессия для данного семинара не найдена',
            });
        }
        const recording = this.recordingRepo.create({
            liveSessionId: session.id,
            filePath: dto.filePath,
            durationSeconds: dto.durationSeconds,
            size: dto.size,
        });
        const saved = await this.recordingRepo.save(recording);
        seminar.isRecorded = true;
        await this.seminarRepo.save(seminar);
        return (0, response_1.successResponse)(saved, response_1.MESSAGES.CREATED);
    }
    async getSession(seminarId) {
        const session = await this.sessionRepo.findOne({
            where: { seminarId },
            order: { createdAt: 'DESC' },
            relations: {
                seminar: { author: true, department: true },
                recordings: true,
            },
        });
        if (!session) {
            return (0, response_1.errorResponse)(response_1.MESSAGES.NOT_FOUND);
        }
        return (0, response_1.successResponse)(session, response_1.MESSAGES.FETCHED);
    }
    async getActiveSessions() {
        const sessions = await this.sessionRepo.find({
            where: { status: enums_1.LiveSessionStatus.ACTIVE },
            relations: { seminar: { author: true, department: true } },
            order: { startedAt: 'DESC' },
        });
        return (0, response_1.successResponse)(sessions, response_1.MESSAGES.FETCHED);
    }
    async sendLiveStartedNotifications(seminar) {
        const recipientIds = new Set();
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
        for (const uId of recipientIds) {
            if (uId === seminar.authorId)
                continue;
            await this.notificationsService.createNotification(uId, enums_1.NotificationType.SEMINAR_REMINDER, 'Jonli seminar boshlandi!', `"${seminar.title}" mavzusidagi jonli seminar efiri hozir boshlandi. Qatnashish uchun bosing.`, { seminarId: seminar.id, isLive: true });
        }
    }
};
exports.LiveService = LiveService;
exports.LiveService = LiveService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(live_session_entity_1.LiveSession)),
    __param(1, (0, typeorm_1.InjectRepository)(seminar_entity_1.Seminar)),
    __param(2, (0, typeorm_1.InjectRepository)(recording_entity_1.Recording)),
    __param(3, (0, typeorm_1.InjectRepository)(comment_entity_1.Comment)),
    __param(4, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(5, (0, typeorm_1.InjectRepository)(saved_seminar_entity_1.SavedSeminar)),
    __param(8, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        notifications_service_1.NotificationsService,
        config_1.ConfigService,
        live_gateway_1.LiveGateway])
], LiveService);
//# sourceMappingURL=live.service.js.map
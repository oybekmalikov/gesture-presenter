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
exports.InteractionsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const like_entity_1 = require("../../database/entities/like.entity");
const comment_entity_1 = require("../../database/entities/comment.entity");
const saved_seminar_entity_1 = require("../../database/entities/saved-seminar.entity");
const seminar_entity_1 = require("../../database/entities/seminar.entity");
const user_entity_1 = require("../../database/entities/user.entity");
const notifications_service_1 = require("../notifications/notifications.service");
const response_1 = require("../../common/response");
const role_enum_1 = require("../../common/enums/role.enum");
const enums_1 = require("../../common/enums");
let InteractionsService = class InteractionsService {
    likeRepo;
    commentRepo;
    savedRepo;
    seminarRepo;
    userRepo;
    notificationsService;
    constructor(likeRepo, commentRepo, savedRepo, seminarRepo, userRepo, notificationsService) {
        this.likeRepo = likeRepo;
        this.commentRepo = commentRepo;
        this.savedRepo = savedRepo;
        this.seminarRepo = seminarRepo;
        this.userRepo = userRepo;
        this.notificationsService = notificationsService;
    }
    async toggleLike(seminarId, userId) {
        const seminar = await this.seminarRepo.findOne({
            where: { id: seminarId },
        });
        if (!seminar) {
            return (0, response_1.errorResponse)(response_1.MESSAGES.SEMINAR_NOT_FOUND);
        }
        const existing = await this.likeRepo.findOne({
            where: { seminarId, userId },
        });
        let liked = false;
        if (existing) {
            await this.likeRepo.remove(existing);
            liked = false;
        }
        else {
            const like = this.likeRepo.create({ seminarId, userId });
            await this.likeRepo.save(like);
            liked = true;
            if (seminar.authorId && seminar.authorId !== userId) {
                const liker = await this.userRepo.findOne({ where: { id: userId } });
                await this.notificationsService.createNotification(seminar.authorId, enums_1.NotificationType.SEMINAR_REMINDER, 'Seminaringizga yangi like bildirildi', `${liker?.fio || 'Foydalanuvchi'} sizning "${seminar.title}" seminaringizga like bosdi.`, { seminarId, likerId: userId });
            }
        }
        const likesCount = await this.likeRepo.count({ where: { seminarId } });
        return (0, response_1.successResponse)({ liked, likesCount }, liked ? response_1.MESSAGES.LIKED : response_1.MESSAGES.UNLIKED);
    }
    async addComment(seminarId, userId, dto) {
        const seminar = await this.seminarRepo.findOne({
            where: { id: seminarId },
        });
        if (!seminar) {
            return (0, response_1.errorResponse)(response_1.MESSAGES.SEMINAR_NOT_FOUND);
        }
        let parentComment = null;
        if (dto.parentId) {
            parentComment = await this.commentRepo.findOne({
                where: { id: dto.parentId, seminarId },
            });
            if (!parentComment) {
                return (0, response_1.errorResponse)({
                    uz: 'Javob berilayotgan izoh topilmadi',
                    ru: 'Родительский комментарий не найден',
                });
            }
        }
        const comment = this.commentRepo.create({
            seminarId,
            userId,
            content: dto.content,
            parentId: dto.parentId || undefined,
        });
        const saved = await this.commentRepo.save(comment);
        const authorUser = await this.userRepo.findOne({ where: { id: userId } });
        if (parentComment &&
            parentComment.userId &&
            parentComment.userId !== userId) {
            await this.notificationsService.notifyCommentReply(parentComment.userId, seminar.id, seminar.title, authorUser?.fio || 'Foydalanuvchi');
        }
        const result = {
            ...saved,
            user: authorUser
                ? {
                    id: authorUser.id,
                    fio: authorUser.fio,
                    lavozim: authorUser.lavozim,
                    avatarUrl: authorUser.avatarUrl,
                }
                : null,
        };
        return (0, response_1.successResponse)(result, response_1.MESSAGES.COMMENT_ADDED);
    }
    async getSeminarComments(seminarId) {
        const comments = await this.commentRepo.find({
            where: { seminarId },
            relations: { user: true },
            order: { createdAt: 'ASC' },
        });
        const map = new Map();
        const roots = [];
        comments.forEach((c) => {
            const node = {
                id: c.id,
                content: c.content,
                parentId: c.parentId || null,
                createdAt: c.createdAt,
                user: c.user
                    ? {
                        id: c.user.id,
                        fio: c.user.fio,
                        username: c.user.username,
                        lavozim: c.user.lavozim,
                        avatarUrl: c.user.avatarUrl,
                    }
                    : null,
                replies: [],
            };
            map.set(c.id, node);
        });
        comments.forEach((c) => {
            const node = map.get(c.id);
            if (!node)
                return;
            if (c.parentId && map.has(c.parentId)) {
                const parent = map.get(c.parentId);
                if (parent) {
                    parent.replies.push(node);
                }
            }
            else {
                roots.push(node);
            }
        });
        return (0, response_1.successResponse)(roots, response_1.MESSAGES.FETCHED);
    }
    async removeComment(commentId, userId, userRole) {
        const comment = await this.commentRepo.findOne({
            where: { id: commentId },
        });
        if (!comment) {
            return (0, response_1.errorResponse)(response_1.MESSAGES.NOT_FOUND);
        }
        if (comment.userId !== userId &&
            userRole !== role_enum_1.Role.ADMIN &&
            userRole !== role_enum_1.Role.SUPERADMIN) {
            return (0, response_1.errorResponse)(response_1.MESSAGES.FORBIDDEN);
        }
        await this.commentRepo.delete({ parentId: commentId });
        await this.commentRepo.remove(comment);
        return (0, response_1.successResponse)(null, response_1.MESSAGES.DELETED);
    }
    async toggleSave(seminarId, userId) {
        const seminar = await this.seminarRepo.findOne({
            where: { id: seminarId },
        });
        if (!seminar) {
            return (0, response_1.errorResponse)(response_1.MESSAGES.SEMINAR_NOT_FOUND);
        }
        const existing = await this.savedRepo.findOne({
            where: { seminarId, userId },
        });
        let saved = false;
        if (existing) {
            await this.savedRepo.remove(existing);
            saved = false;
        }
        else {
            const newSave = this.savedRepo.create({ seminarId, userId });
            await this.savedRepo.save(newSave);
            saved = true;
        }
        return (0, response_1.successResponse)({ saved }, saved ? response_1.MESSAGES.SAVED : response_1.MESSAGES.UNSAVED);
    }
    async getSavedSeminars(userId, page = 1, limit = 12) {
        const skip = (page - 1) * limit;
        const [savedItems, total] = await this.savedRepo.findAndCount({
            where: { userId },
            relations: {
                seminar: {
                    author: true,
                    department: true,
                    tags: true,
                    files: true,
                },
            },
            order: { createdAt: 'DESC' },
            skip,
            take: limit,
        });
        const seminars = savedItems
            .filter((s) => !!s.seminar)
            .map((s) => ({
            ...s.seminar,
            savedAt: s.createdAt,
            isSaved: true,
        }));
        return (0, response_1.successResponse)({
            items: seminars,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        }, response_1.MESSAGES.FETCHED);
    }
};
exports.InteractionsService = InteractionsService;
exports.InteractionsService = InteractionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(like_entity_1.Like)),
    __param(1, (0, typeorm_1.InjectRepository)(comment_entity_1.Comment)),
    __param(2, (0, typeorm_1.InjectRepository)(saved_seminar_entity_1.SavedSeminar)),
    __param(3, (0, typeorm_1.InjectRepository)(seminar_entity_1.Seminar)),
    __param(4, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        notifications_service_1.NotificationsService])
], InteractionsService);
//# sourceMappingURL=interactions.service.js.map
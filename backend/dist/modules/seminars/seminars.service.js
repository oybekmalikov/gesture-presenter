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
exports.SeminarsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const seminar_entity_1 = require("../../database/entities/seminar.entity");
const seminar_file_entity_1 = require("../../database/entities/seminar-file.entity");
const tag_entity_1 = require("../../database/entities/tag.entity");
const like_entity_1 = require("../../database/entities/like.entity");
const comment_entity_1 = require("../../database/entities/comment.entity");
const saved_seminar_entity_1 = require("../../database/entities/saved-seminar.entity");
const query_seminar_dto_1 = require("./dto/query-seminar.dto");
const response_1 = require("../../common/response");
const role_enum_1 = require("../../common/enums/role.enum");
const enums_1 = require("../../common/enums");
let SeminarsService = class SeminarsService {
    seminarRepo;
    fileRepo;
    tagRepo;
    likeRepo;
    commentRepo;
    savedRepo;
    constructor(seminarRepo, fileRepo, tagRepo, likeRepo, commentRepo, savedRepo) {
        this.seminarRepo = seminarRepo;
        this.fileRepo = fileRepo;
        this.tagRepo = tagRepo;
        this.likeRepo = likeRepo;
        this.commentRepo = commentRepo;
        this.savedRepo = savedRepo;
    }
    async create(userId, dto, userRole) {
        if (userRole === role_enum_1.Role.SUPERADMIN) {
            return (0, response_1.errorResponse)({
                uz: 'Superadmin seminar yaratmaydi. Superadmin faqat umumiy nazorat va statistikani ko`radi.',
                ru: 'Суперадминистратор не создает семинары. Суперадмин осуществляет только общий контроль и просмотр статистики.',
            });
        }
        let tags = [];
        if (dto.tags && dto.tags.length > 0) {
            tags = await this.resolveTags(dto.tags);
        }
        const seminar = this.seminarRepo.create({
            title: dto.title,
            description: dto.description,
            authorId: userId,
            targetUserId: dto.targetUserId,
            departmentId: dto.departmentId,
            status: dto.status || enums_1.SeminarStatus.DRAFT,
            fileAccess: dto.fileAccess || enums_1.FileAccess.PUBLIC,
            scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
            tags,
        });
        const saved = await this.seminarRepo.save(seminar);
        return (0, response_1.successResponse)(saved, response_1.MESSAGES.SEMINAR_CREATED);
    }
    async toggleBookmark(seminarId, userId) {
        const seminar = await this.seminarRepo.findOne({
            where: { id: seminarId },
        });
        if (!seminar) {
            return (0, response_1.errorResponse)(response_1.MESSAGES.SEMINAR_NOT_FOUND);
        }
        const existing = await this.savedRepo.findOne({
            where: { seminarId, userId },
        });
        let isSaved = false;
        if (existing) {
            await this.savedRepo.remove(existing);
            isSaved = false;
        }
        else {
            const newSave = this.savedRepo.create({ seminarId, userId });
            await this.savedRepo.save(newSave);
            isSaved = true;
        }
        return (0, response_1.successResponse)({ isSaved, seminarId }, isSaved
            ? {
                uz: 'Seminar saqlanganlarga (bookmark) qo`shildi',
                ru: 'Семинар добавлен в закладки',
            }
            : {
                uz: 'Seminar saqlanganlardan chiqarildi',
                ru: 'Семинар удален из закладок',
            });
    }
    async getBookmarkedSeminars(userId, page = 1, limit = 12) {
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
        const items = savedItems
            .filter((s) => !!s.seminar)
            .map((s) => ({
            ...s.seminar,
            savedAt: s.createdAt,
            isSaved: true,
        }));
        return (0, response_1.successResponse)({
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        }, response_1.MESSAGES.FETCHED);
    }
    async findAll(query, currentUser) {
        const page = query.page || 1;
        const limit = query.limit || 12;
        const skip = (page - 1) * limit;
        const qb = this.seminarRepo
            .createQueryBuilder('seminar')
            .leftJoinAndSelect('seminar.author', 'author')
            .leftJoinAndSelect('seminar.targetUser', 'targetUser')
            .leftJoinAndSelect('seminar.department', 'department')
            .leftJoinAndSelect('seminar.tags', 'tags')
            .leftJoinAndSelect('seminar.files', 'files');
        if (!currentUser) {
            qb.andWhere('seminar.fileAccess = :publicAccess', {
                publicAccess: enums_1.FileAccess.PUBLIC,
            });
        }
        else if (currentUser.role === role_enum_1.Role.ADMIN ||
            currentUser.role === role_enum_1.Role.SUPERADMIN) {
        }
        else if (currentUser.role === role_enum_1.Role.HEAD_DEPARTMENT) {
            qb.andWhere('(seminar.fileAccess = :publicAccess OR seminar.authorId = :userId OR seminar.targetUserId = :userId OR seminar.departmentId = :userDeptId)', {
                publicAccess: enums_1.FileAccess.PUBLIC,
                userId: currentUser.id,
                userDeptId: currentUser.departmentId,
            });
        }
        else {
            qb.andWhere('(seminar.fileAccess = :publicAccess OR seminar.authorId = :userId OR seminar.targetUserId = :userId OR (seminar.departmentId = :userDeptId AND seminar.fileAccess IN (:...deptAccess)))', {
                publicAccess: enums_1.FileAccess.PUBLIC,
                userId: currentUser.id,
                userDeptId: currentUser.departmentId,
                deptAccess: [
                    enums_1.FileAccess.READABLE,
                    enums_1.FileAccess.PRIVATE,
                    enums_1.FileAccess.PUBLIC,
                ],
            });
        }
        if (query.tab) {
            switch (query.tab) {
                case query_seminar_dto_1.SeminarTabType.SCHEDULED:
                    qb.andWhere('seminar.status = :status', {
                        status: enums_1.SeminarStatus.SCHEDULED,
                    });
                    break;
                case query_seminar_dto_1.SeminarTabType.LIVE:
                    qb.andWhere('(seminar.isLive = true OR seminar.status = :liveStatus)', {
                        liveStatus: enums_1.SeminarStatus.LIVE,
                    });
                    break;
                case query_seminar_dto_1.SeminarTabType.COMPLETED:
                    qb.andWhere('(seminar.status = :completedStatus OR seminar.isRecorded = true)', {
                        completedStatus: enums_1.SeminarStatus.COMPLETED,
                    });
                    break;
                case query_seminar_dto_1.SeminarTabType.MY:
                    if (currentUser) {
                        qb.andWhere('seminar.authorId = :myId', { myId: currentUser.id });
                    }
                    break;
                case query_seminar_dto_1.SeminarTabType.DEPARTMENT:
                    if (currentUser?.departmentId) {
                        qb.andWhere('seminar.departmentId = :deptId', {
                            deptId: currentUser.departmentId,
                        });
                    }
                    break;
            }
        }
        if (query.search) {
            const cleanSearch = query.search.trim();
            if (cleanSearch) {
                qb.andWhere(`(
            to_tsvector('simple', COALESCE(seminar.title, '') || ' ' || COALESCE(seminar.description, '')) @@ plainto_tsquery('simple', :cleanSearch)
            OR LOWER(seminar.title) LIKE :likeSearch
            OR LOWER(seminar.description) LIKE :likeSearch
            OR tags.name ILIKE :tagSearch
          )`, {
                    cleanSearch,
                    likeSearch: `%${cleanSearch.toLowerCase()}%`,
                    tagSearch: `%${this.normalizeTagName(cleanSearch)}%`,
                });
            }
        }
        if (query.tag) {
            const cleanTag = this.normalizeTagName(query.tag);
            qb.andWhere('tags.name ILIKE :tagName', { tagName: `%${cleanTag}%` });
        }
        if (query.departmentId) {
            qb.andWhere('seminar.departmentId = :deptFilterId', {
                deptFilterId: query.departmentId,
            });
        }
        if (query.status) {
            qb.andWhere('seminar.status = :statusFilter', {
                statusFilter: query.status,
            });
        }
        if (query.fileAccess) {
            qb.andWhere('seminar.fileAccess = :fileAccessFilter', {
                fileAccessFilter: query.fileAccess,
            });
        }
        switch (query.sortBy) {
            case query_seminar_dto_1.SeminarSortBy.POPULAR:
                qb.addSelect(`(
            COALESCE(seminar.viewCount, 0) * 1.0 +
            (SELECT COUNT(*) FROM likes l WHERE l."seminarId" = seminar.id) * 3.0 +
            (SELECT COUNT(*) FROM comments c WHERE c."seminarId" = seminar.id) * 2.0 +
            (SELECT COUNT(*) FROM saved_seminars s WHERE s."seminarId" = seminar.id) * 2.5
          )`, 'popularity_score');
                qb.orderBy('popularity_score', 'DESC');
                qb.addOrderBy('seminar.createdAt', 'DESC');
                break;
            case query_seminar_dto_1.SeminarSortBy.VIEWS:
                qb.orderBy('seminar.viewCount', 'DESC');
                break;
            case query_seminar_dto_1.SeminarSortBy.LATEST:
            default:
                qb.orderBy('seminar.createdAt', 'DESC');
                break;
        }
        qb.skip(skip).take(limit);
        const [items, total] = await qb.getManyAndCount();
        if (items.length > 0) {
            const seminarIds = items.map((s) => s.id);
            const [likeCounts, commentCounts, userLikes, userSaves] = await Promise.all([
                this.likeRepo
                    .createQueryBuilder('like')
                    .select('like.seminarId', 'seminarId')
                    .addSelect('COUNT(like.id)', 'count')
                    .where('like.seminarId IN (:...seminarIds)', { seminarIds })
                    .groupBy('like.seminarId')
                    .getRawMany(),
                this.commentRepo
                    .createQueryBuilder('comment')
                    .select('comment.seminarId', 'seminarId')
                    .addSelect('COUNT(comment.id)', 'count')
                    .where('comment.seminarId IN (:...seminarIds)', { seminarIds })
                    .groupBy('comment.seminarId')
                    .getRawMany(),
                currentUser
                    ? this.likeRepo.find({
                        where: { userId: currentUser.id, seminarId: (0, typeorm_2.In)(seminarIds) },
                    })
                    : Promise.resolve([]),
                currentUser
                    ? this.savedRepo.find({
                        where: { userId: currentUser.id, seminarId: (0, typeorm_2.In)(seminarIds) },
                    })
                    : Promise.resolve([]),
            ]);
            const likeMap = new Map(likeCounts.map((r) => [r.seminarId, parseInt(r.count, 10)]));
            const commentMap = new Map(commentCounts.map((r) => [r.seminarId, parseInt(r.count, 10)]));
            const likedSet = new Set(userLikes.map((l) => l.seminarId));
            const savedSet = new Set(userSaves.map((s) => s.seminarId));
            items.forEach((item) => {
                item.likesCount = likeMap.get(item.id) || 0;
                item.commentsCount = commentMap.get(item.id) || 0;
                item.isLiked = likedSet.has(item.id);
                item.isSaved = savedSet.has(item.id);
            });
        }
        return (0, response_1.successResponse)({
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        }, response_1.MESSAGES.FETCHED);
    }
    async findOne(id, currentUser) {
        const seminar = await this.seminarRepo.findOne({
            where: { id },
            relations: {
                author: true,
                targetUser: true,
                department: true,
                tags: true,
                files: true,
            },
            order: {
                files: {
                    sortOrder: 'ASC',
                    createdAt: 'ASC',
                },
            },
        });
        if (!seminar) {
            return (0, response_1.errorResponse)(response_1.MESSAGES.SEMINAR_NOT_FOUND);
        }
        if (currentUser) {
            const isAuthor = seminar.authorId === currentUser.id;
            const isTarget = seminar.targetUserId === currentUser.id;
            const isAdmin = currentUser.role === role_enum_1.Role.ADMIN || currentUser.role === role_enum_1.Role.SUPERADMIN;
            const isSameDept = currentUser.departmentId &&
                currentUser.departmentId === seminar.departmentId;
            if (seminar.fileAccess === enums_1.FileAccess.PRIVATE &&
                !isAuthor &&
                !isTarget &&
                !isAdmin &&
                !isSameDept) {
                return (0, response_1.errorResponse)(response_1.MESSAGES.FORBIDDEN);
            }
        }
        else if (seminar.fileAccess !== enums_1.FileAccess.PUBLIC) {
            return (0, response_1.errorResponse)(response_1.MESSAGES.UNAUTHORIZED);
        }
        seminar.viewCount += 1;
        await this.seminarRepo.save(seminar);
        const [likesCount, commentsCount] = await Promise.all([
            this.likeRepo.count({ where: { seminarId: id } }),
            this.commentRepo.count({ where: { seminarId: id } }),
        ]);
        let isLiked = false;
        let isSaved = false;
        if (currentUser) {
            const [like, save] = await Promise.all([
                this.likeRepo.findOne({
                    where: { seminarId: id, userId: currentUser.id },
                }),
                this.savedRepo.findOne({
                    where: { seminarId: id, userId: currentUser.id },
                }),
            ]);
            isLiked = !!like;
            isSaved = !!save;
        }
        const filesWithPermissions = (seminar.files || []).map((file) => {
            let canDownload = false;
            const canView = true;
            if (seminar.fileAccess === enums_1.FileAccess.PUBLIC) {
                canDownload = true;
            }
            else if (seminar.fileAccess === enums_1.FileAccess.READABLE) {
                if (currentUser &&
                    (currentUser.role === role_enum_1.Role.ADMIN ||
                        currentUser.role === role_enum_1.Role.SUPERADMIN ||
                        currentUser.id === seminar.authorId)) {
                    canDownload = true;
                }
            }
            else if (seminar.fileAccess === enums_1.FileAccess.PRIVATE) {
                if (currentUser &&
                    (currentUser.role === role_enum_1.Role.ADMIN ||
                        currentUser.role === role_enum_1.Role.SUPERADMIN ||
                        currentUser.id === seminar.authorId ||
                        (currentUser.departmentId &&
                            currentUser.departmentId === seminar.departmentId))) {
                    canDownload = true;
                }
            }
            return {
                ...file,
                canView,
                canDownload,
            };
        });
        const result = {
            ...seminar,
            files: filesWithPermissions,
            likesCount,
            commentsCount,
            isLiked,
            isSaved,
        };
        return (0, response_1.successResponse)(result, response_1.MESSAGES.FETCHED);
    }
    async update(id, userId, userRole, dto) {
        const seminar = await this.seminarRepo.findOne({
            where: { id },
            relations: { tags: true },
        });
        if (!seminar) {
            return (0, response_1.errorResponse)(response_1.MESSAGES.SEMINAR_NOT_FOUND);
        }
        if (seminar.authorId !== userId &&
            userRole !== role_enum_1.Role.ADMIN &&
            userRole !== role_enum_1.Role.SUPERADMIN) {
            return (0, response_1.errorResponse)(response_1.MESSAGES.FORBIDDEN);
        }
        if (dto.tags) {
            seminar.tags = await this.resolveTags(dto.tags);
        }
        if (dto.title !== undefined)
            seminar.title = dto.title;
        if (dto.description !== undefined)
            seminar.description = dto.description;
        if (dto.targetUserId !== undefined)
            seminar.targetUserId = dto.targetUserId;
        if (dto.departmentId !== undefined)
            seminar.departmentId = dto.departmentId;
        if (dto.status !== undefined)
            seminar.status = dto.status;
        if (dto.fileAccess !== undefined)
            seminar.fileAccess = dto.fileAccess;
        if (dto.isLive !== undefined)
            seminar.isLive = dto.isLive;
        if (dto.isRecorded !== undefined)
            seminar.isRecorded = dto.isRecorded;
        if (dto.scheduledAt !== undefined) {
            seminar.scheduledAt = new Date(dto.scheduledAt);
        }
        const saved = await this.seminarRepo.save(seminar);
        return (0, response_1.successResponse)(saved, response_1.MESSAGES.SEMINAR_UPDATED);
    }
    async updateStatus(id, status, userId, userRole) {
        const seminar = await this.seminarRepo.findOne({ where: { id } });
        if (!seminar) {
            return (0, response_1.errorResponse)(response_1.MESSAGES.SEMINAR_NOT_FOUND);
        }
        if (seminar.authorId !== userId &&
            userRole !== role_enum_1.Role.ADMIN &&
            userRole !== role_enum_1.Role.SUPERADMIN) {
            return (0, response_1.errorResponse)(response_1.MESSAGES.FORBIDDEN);
        }
        seminar.status = status;
        if (status === enums_1.SeminarStatus.LIVE) {
            seminar.isLive = true;
            if (!seminar.startedAt)
                seminar.startedAt = new Date();
        }
        else if (status === enums_1.SeminarStatus.COMPLETED ||
            status === enums_1.SeminarStatus.CANCELLED) {
            seminar.isLive = false;
            if (!seminar.endedAt)
                seminar.endedAt = new Date();
        }
        const saved = await this.seminarRepo.save(seminar);
        return (0, response_1.successResponse)(saved, response_1.MESSAGES.SEMINAR_UPDATED);
    }
    async reorderFiles(seminarId, fileIds, userId, userRole) {
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
        for (let i = 0; i < fileIds.length; i++) {
            await this.fileRepo.update({ id: fileIds[i], seminarId }, { sortOrder: i + 1 });
        }
        const files = await this.fileRepo.find({
            where: { seminarId },
            order: { sortOrder: 'ASC' },
        });
        return (0, response_1.successResponse)(files, response_1.MESSAGES.UPDATED);
    }
    async getTargetSeminars(userId, page = 1, limit = 12) {
        const skip = (page - 1) * limit;
        const [items, total] = await this.seminarRepo.findAndCount({
            where: { targetUserId: userId },
            relations: {
                author: true,
                department: true,
                tags: true,
                files: true,
            },
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
    async getPopularTags() {
        const tags = await this.tagRepo
            .createQueryBuilder('tag')
            .leftJoin('tag.seminars', 'seminar')
            .select('tag.id', 'id')
            .addSelect('tag.name', 'name')
            .addSelect('COUNT(seminar.id)', 'count')
            .groupBy('tag.id')
            .addGroupBy('tag.name')
            .orderBy('count', 'DESC')
            .take(20)
            .getRawMany();
        return (0, response_1.successResponse)(tags, response_1.MESSAGES.FETCHED);
    }
    async remove(id, userId, userRole) {
        const seminar = await this.seminarRepo.findOne({ where: { id } });
        if (!seminar) {
            return (0, response_1.errorResponse)(response_1.MESSAGES.SEMINAR_NOT_FOUND);
        }
        if (seminar.authorId !== userId &&
            userRole !== role_enum_1.Role.ADMIN &&
            userRole !== role_enum_1.Role.SUPERADMIN) {
            return (0, response_1.errorResponse)(response_1.MESSAGES.FORBIDDEN);
        }
        await this.seminarRepo.remove(seminar);
        return (0, response_1.successResponse)(null, response_1.MESSAGES.SEMINAR_DELETED);
    }
    async getDashboardStats(currentUser) {
        const [liveCount, scheduledCount, topSeminars] = await Promise.all([
            this.seminarRepo.count({
                where: [{ isLive: true }, { status: enums_1.SeminarStatus.LIVE }],
            }),
            this.seminarRepo.count({
                where: { status: enums_1.SeminarStatus.SCHEDULED },
            }),
            this.seminarRepo.find({
                order: { viewCount: 'DESC' },
                take: 5,
                relations: { author: true, department: true },
            }),
        ]);
        let userStats = null;
        if (currentUser) {
            const [mySeminarsCount, myLikesReceived] = await Promise.all([
                this.seminarRepo.count({ where: { authorId: currentUser.id } }),
                this.likeRepo
                    .createQueryBuilder('like')
                    .innerJoin('like.seminar', 'seminar')
                    .where('seminar.authorId = :userId', { userId: currentUser.id })
                    .getCount(),
            ]);
            userStats = {
                mySeminarsCount,
                myLikesReceived,
            };
        }
        return (0, response_1.successResponse)({
            liveCount,
            scheduledCount,
            topSeminars,
            userStats,
        }, response_1.MESSAGES.FETCHED);
    }
    async resolveTags(rawInput) {
        const rawList = Array.isArray(rawInput)
            ? rawInput
            : typeof rawInput === 'string'
                ? rawInput.split(/[,;\s]+/)
                : [];
        const cleanNames = new Set();
        for (const raw of rawList) {
            const clean = this.normalizeTagName(raw);
            if (clean && clean.length >= 2) {
                cleanNames.add(clean);
            }
        }
        const tags = [];
        for (const name of cleanNames) {
            let tag = await this.tagRepo.findOne({ where: { name } });
            if (!tag) {
                tag = this.tagRepo.create({ name });
                tag = await this.tagRepo.save(tag);
            }
            tags.push(tag);
        }
        return tags;
    }
    normalizeTagName(rawTag) {
        if (!rawTag)
            return '';
        return rawTag
            .toLowerCase()
            .trim()
            .replace(/^#+/, '')
            .replace(/['’`"]/g, '')
            .replace(/[^a-z0-9а-яё_ -]/gi, '')
            .replace(/[\s-]+/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_+|_+$/g, '')
            .slice(0, 50);
    }
};
exports.SeminarsService = SeminarsService;
exports.SeminarsService = SeminarsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(seminar_entity_1.Seminar)),
    __param(1, (0, typeorm_1.InjectRepository)(seminar_file_entity_1.SeminarFile)),
    __param(2, (0, typeorm_1.InjectRepository)(tag_entity_1.Tag)),
    __param(3, (0, typeorm_1.InjectRepository)(like_entity_1.Like)),
    __param(4, (0, typeorm_1.InjectRepository)(comment_entity_1.Comment)),
    __param(5, (0, typeorm_1.InjectRepository)(saved_seminar_entity_1.SavedSeminar)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], SeminarsService);
//# sourceMappingURL=seminars.service.js.map
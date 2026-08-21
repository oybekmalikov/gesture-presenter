import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Seminar } from '../../database/entities/seminar.entity';
import { SeminarFile } from '../../database/entities/seminar-file.entity';
import { Tag } from '../../database/entities/tag.entity';
import { Like } from '../../database/entities/like.entity';
import { Comment } from '../../database/entities/comment.entity';
import { SavedSeminar } from '../../database/entities/saved-seminar.entity';
import { CreateSeminarDto } from './dto/create-seminar.dto';
import { UpdateSeminarDto } from './dto/update-seminar.dto';
import {
  QuerySeminarDto,
  SeminarTabType,
  SeminarSortBy,
} from './dto/query-seminar.dto';
import {
  ApiResponse,
  successResponse,
  errorResponse,
  MESSAGES,
} from '../../common/response';
import { Role } from '../../common/enums/role.enum';
import { SeminarStatus, FileAccess } from '../../common/enums';

import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../../common/enums';

@Injectable()
export class SeminarsService {
  constructor(
    @InjectRepository(Seminar)
    private readonly seminarRepo: Repository<Seminar>,
    @InjectRepository(SeminarFile)
    private readonly fileRepo: Repository<SeminarFile>,
    @InjectRepository(Tag)
    private readonly tagRepo: Repository<Tag>,
    @InjectRepository(Like)
    private readonly likeRepo: Repository<Like>,
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    @InjectRepository(SavedSeminar)
    private readonly savedRepo: Repository<SavedSeminar>,
    private readonly notificationsService: NotificationsService,
  ) { }

  async create(
    userId: string,
    dto: CreateSeminarDto,
    userRole?: Role,
  ): Promise<ApiResponse> {
    if (userRole === Role.SUPERADMIN) {
      return errorResponse({
        uz: 'Superadmin seminar yaratmaydi. Superadmin faqat umumiy nazorat va statistikani ko`radi.',
        ru: 'Суперадминистратор не создает семинары. Суперадмин осуществляет только общий контроль и просмотр статистики.',
      });
    }

    let tags: Tag[] = [];
    if (dto.tags && dto.tags.length > 0) {
      tags = await this.resolveTags(dto.tags);
    }

    const seminar = this.seminarRepo.create({
      title: dto.title,
      description: dto.description,
      coverImageUrl: dto.coverImageUrl,
      authorId: userId,
      targetUserId: dto.targetUserId,
      departmentId: dto.departmentId,
      status: dto.status || (dto.scheduledAt ? SeminarStatus.SCHEDULED : SeminarStatus.SCHEDULED),
      fileAccess: dto.fileAccess || FileAccess.PUBLIC,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
      tags,
    });

    const saved = await this.seminarRepo.save(seminar);

    // If targetUserId is specified, notify them immediately
    if (saved.targetUserId) {
      this.notificationsService
        .notifySeminarAssigned(saved, saved.targetUserId)
        .catch(() => {});
    }

    // If scheduled within 15 minutes, send immediate reminder (Point 9)
    if (saved.scheduledAt) {
      const now = Date.now();
      const diffMs = new Date(saved.scheduledAt).getTime() - now;
      const diffMin = Math.round(diffMs / (60 * 1000));
      if (diffMin >= -5 && diffMin <= 15) {
        const recipients = [userId];
        if (saved.targetUserId && saved.targetUserId !== userId) {
          recipients.push(saved.targetUserId);
        }
        for (const rId of recipients) {
          this.notificationsService
            .createNotification(
              rId,
              NotificationType.SEMINAR_REMINDER,
              `Seminar eslatmasi: ${diffMin <= 1 ? '1 daqiqa qoldi' : `${diffMin} daqiqa qoldi`}`,
              `"${saved.title}" seminari boshlanishiga oz qoldi (${diffMin <= 1 ? '1 daqiqa' : `${diffMin} daqiqa`}). Boshlanish vaqti: ${new Date(saved.scheduledAt).toLocaleTimeString()}`,
              { seminarId: saved.id, scheduledAt: saved.scheduledAt, intervalKey: '5m' },
            )
            .catch(() => {});
        }
      }
    }

    return successResponse(saved, MESSAGES.SEMINAR_CREATED);
  }

  async toggleBookmark(
    seminarId: string,
    userId: string,
  ): Promise<ApiResponse> {
    const seminar = await this.seminarRepo.findOne({
      where: { id: seminarId },
    });
    if (!seminar) {
      return errorResponse(MESSAGES.SEMINAR_NOT_FOUND);
    }

    const existing = await this.savedRepo.findOne({
      where: { seminarId, userId },
    });

    let isSaved = false;
    if (existing) {
      await this.savedRepo.remove(existing);
      isSaved = false;
    } else {
      const newSave = this.savedRepo.create({ seminarId, userId });
      await this.savedRepo.save(newSave);
      isSaved = true;
    }

    return successResponse(
      { isSaved, seminarId },
      isSaved
        ? {
          uz: 'Seminar saqlanganlarga (bookmark) qo`shildi',
          ru: 'Семинар добавлен в закладки',
        }
        : {
          uz: 'Seminar saqlanganlardan chiqarildi',
          ru: 'Семинар удален из закладок',
        },
    );
  }

  async getBookmarkedSeminars(
    userId: string,
    page = 1,
    limit = 12,
  ): Promise<ApiResponse> {
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

  async findAll(
    query: QuerySeminarDto,
    currentUser?: any,
  ): Promise<ApiResponse> {
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

    // 1. Role-based Visibility Filtering
    if (!currentUser) {
      // Guest / Unauthenticated: only PUBLIC
      qb.andWhere('seminar.fileAccess = :publicAccess', {
        publicAccess: FileAccess.PUBLIC,
      });
    } else if (
      currentUser.role === Role.ADMIN ||
      currentUser.role === Role.SUPERADMIN
    ) {
      // Admin/Superadmin sees everything
    } else if (currentUser.role === Role.HEAD_DEPARTMENT) {
      qb.andWhere(
        '(seminar.fileAccess = :publicAccess OR seminar.authorId = :userId OR seminar.targetUserId = :userId OR seminar.departmentId = :userDeptId)',
        {
          publicAccess: FileAccess.PUBLIC,
          userId: currentUser.id,
          userDeptId: currentUser.departmentId,
        },
      );
    } else {
      // Regular USER: public + own + target + department readable/private
      qb.andWhere(
        '(seminar.fileAccess = :publicAccess OR seminar.authorId = :userId OR seminar.targetUserId = :userId OR (seminar.departmentId = :userDeptId AND seminar.fileAccess IN (:...deptAccess)))',
        {
          publicAccess: FileAccess.PUBLIC,
          userId: currentUser.id,
          userDeptId: currentUser.departmentId,
          deptAccess: [
            FileAccess.READABLE,
            FileAccess.PRIVATE,
            FileAccess.PUBLIC,
          ],
        },
      );
    }

    // 2. Tab Filter
    if (query.tab) {
      switch (query.tab) {
        case SeminarTabType.SCHEDULED:
          qb.andWhere('seminar.status = :status', {
            status: SeminarStatus.SCHEDULED,
          });
          break;
        case SeminarTabType.LIVE:
          qb.andWhere(
            '(seminar.isLive = true OR seminar.status = :liveStatus)',
            {
              liveStatus: SeminarStatus.LIVE,
            },
          );
          break;
        case SeminarTabType.COMPLETED:
          qb.andWhere(
            '(seminar.status = :completedStatus OR seminar.isRecorded = true)',
            {
              completedStatus: SeminarStatus.COMPLETED,
            },
          );
          break;
        case SeminarTabType.MY:
          if (currentUser) {
            qb.andWhere('seminar.authorId = :myId', { myId: currentUser.id });
          }
          break;
        case SeminarTabType.DEPARTMENT:
          if (currentUser?.departmentId) {
            qb.andWhere('seminar.departmentId = :deptId', {
              deptId: currentUser.departmentId,
            });
          }
          break;
      }
    }

    // 3. Full-Text Search (FTS) & Like Fallback
    if (query.search) {
      const cleanSearch = query.search.trim();
      if (cleanSearch) {
        qb.andWhere(
          `(
            to_tsvector('simple', COALESCE(seminar.title, '') || ' ' || COALESCE(seminar.description, '')) @@ plainto_tsquery('simple', :cleanSearch)
            OR LOWER(seminar.title) LIKE :likeSearch
            OR LOWER(seminar.description) LIKE :likeSearch
            OR tags.name ILIKE :tagSearch
          )`,
          {
            cleanSearch,
            likeSearch: `%${cleanSearch.toLowerCase()}%`,
            tagSearch: `%${this.normalizeTagName(cleanSearch)}%`,
          },
        );
      }
    }

    // 4. Tag Filter
    if (query.tag) {
      const cleanTag = this.normalizeTagName(query.tag);
      qb.andWhere('tags.name ILIKE :tagName', { tagName: `%${cleanTag}%` });
    }

    // 5. Department filter
    if (query.departmentId) {
      qb.andWhere('seminar.departmentId = :deptFilterId', {
        deptFilterId: query.departmentId,
      });
    }

    // 6. Status filter
    if (query.status) {
      qb.andWhere('seminar.status = :statusFilter', {
        statusFilter: query.status,
      });
    }

    // 7. FileAccess filter
    if (query.fileAccess) {
      qb.andWhere('seminar.fileAccess = :fileAccessFilter', {
        fileAccessFilter: query.fileAccess,
      });
    }

    // 8. Sorting — Active Live Streams ALWAYS appear first
    switch (query.sortBy) {
      case SeminarSortBy.POPULAR:
        // Weighted Popularity formula: likes * 3 + views * 1 + comments * 2 + saves * 2.5
        qb.addSelect(
          `(
            COALESCE(seminar.viewCount, 0) * 1.0 +
            (SELECT COUNT(*) FROM likes l WHERE l."seminarId" = seminar.id) * 3.0 +
            (SELECT COUNT(*) FROM comments c WHERE c."seminarId" = seminar.id) * 2.0 +
            (SELECT COUNT(*) FROM saved_seminars s WHERE s."seminarId" = seminar.id) * 2.5
          )`,
          'popularity_score',
        );
        qb.orderBy('seminar.isLive', 'DESC');
        qb.addOrderBy('popularity_score', 'DESC');
        qb.addOrderBy('seminar.createdAt', 'DESC');
        break;
      case SeminarSortBy.VIEWS:
        qb.orderBy('seminar.isLive', 'DESC');
        qb.addOrderBy('seminar.viewCount', 'DESC');
        break;
      case SeminarSortBy.LATEST:
      default:
        qb.orderBy('seminar.isLive', 'DESC');
        qb.addOrderBy('seminar.createdAt', 'DESC');
        break;
    }

    qb.skip(skip).take(limit);

    const [items, total] = await qb.getManyAndCount();

    // Attach likeCounts, commentCounts, isLiked, isSaved
    if (items.length > 0) {
      const seminarIds = items.map((s: Seminar) => s.id);

      const [likeCounts, commentCounts, userLikes, userSaves] =
        await Promise.all([
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
              where: { userId: currentUser.id, seminarId: In(seminarIds) },
            })
            : Promise.resolve([]),
          currentUser
            ? this.savedRepo.find({
              where: { userId: currentUser.id, seminarId: In(seminarIds) },
            })
            : Promise.resolve([]),
        ]);

      const likeMap = new Map(
        likeCounts.map((r: any) => [r.seminarId, parseInt(r.count, 10)]),
      );
      const commentMap = new Map(
        commentCounts.map((r: any) => [r.seminarId, parseInt(r.count, 10)]),
      );
      const likedSet = new Set(userLikes.map((l: any) => l.seminarId));
      const savedSet = new Set(userSaves.map((s: any) => s.seminarId));

      items.forEach((item: any) => {
        item.likesCount = likeMap.get(item.id) || 0;
        item.commentsCount = commentMap.get(item.id) || 0;
        item.isLiked = likedSet.has(item.id);
        item.isSaved = savedSet.has(item.id);
      });
    }

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

  async findOne(id: string, currentUser?: any): Promise<ApiResponse> {
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
      return errorResponse(MESSAGES.SEMINAR_NOT_FOUND);
    }

    // Permission check to view
    if (currentUser) {
      const isAuthor = seminar.authorId === currentUser.id;
      const isTarget = seminar.targetUserId === currentUser.id;
      const isAdmin =
        currentUser.role === Role.ADMIN || currentUser.role === Role.SUPERADMIN;
      const isSameDept =
        currentUser.departmentId &&
        currentUser.departmentId === seminar.departmentId;

      if (
        seminar.fileAccess === FileAccess.PRIVATE &&
        !isAuthor &&
        !isTarget &&
        !isAdmin &&
        !isSameDept
      ) {
        return errorResponse(MESSAGES.FORBIDDEN);
      }
    } else if (seminar.fileAccess !== FileAccess.PUBLIC) {
      return errorResponse(MESSAGES.UNAUTHORIZED);
    }

    // Increment views
    seminar.viewCount += 1;
    await this.seminarRepo.save(seminar);

    // Likes & comments counts
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

    // Annotate files with permissions
    const filesWithPermissions = (seminar.files || []).map((file) => {
      let canDownload = false;
      const canView = true;

      if (seminar.fileAccess === FileAccess.PUBLIC) {
        canDownload = true;
      } else if (seminar.fileAccess === FileAccess.READABLE) {
        if (
          currentUser &&
          (currentUser.role === Role.ADMIN ||
            currentUser.role === Role.SUPERADMIN ||
            currentUser.id === seminar.authorId)
        ) {
          canDownload = true;
        }
      } else if (seminar.fileAccess === FileAccess.PRIVATE) {
        if (
          currentUser &&
          (currentUser.role === Role.ADMIN ||
            currentUser.role === Role.SUPERADMIN ||
            currentUser.id === seminar.authorId ||
            (currentUser.departmentId &&
              currentUser.departmentId === seminar.departmentId))
        ) {
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

    return successResponse(result, MESSAGES.FETCHED);
  }

  async update(
    id: string,
    userId: string,
    userRole: Role,
    dto: UpdateSeminarDto,
  ): Promise<ApiResponse> {
    const seminar = await this.seminarRepo.findOne({
      where: { id },
      relations: { tags: true },
    });

    if (!seminar) {
      return errorResponse(MESSAGES.SEMINAR_NOT_FOUND);
    }

    if (
      seminar.authorId !== userId &&
      userRole !== Role.ADMIN &&
      userRole !== Role.SUPERADMIN
    ) {
      return errorResponse(MESSAGES.FORBIDDEN);
    }

    if (dto.tags) {
      seminar.tags = await this.resolveTags(dto.tags);
    }

    if (dto.title !== undefined) seminar.title = dto.title;
    if (dto.description !== undefined) seminar.description = dto.description;
    if (dto.coverImageUrl !== undefined) seminar.coverImageUrl = dto.coverImageUrl;
    if (dto.targetUserId !== undefined) seminar.targetUserId = dto.targetUserId;
    if (dto.departmentId !== undefined) seminar.departmentId = dto.departmentId;
    if (dto.status !== undefined) seminar.status = dto.status;
    if (dto.fileAccess !== undefined) seminar.fileAccess = dto.fileAccess;
    if (dto.isLive !== undefined) seminar.isLive = dto.isLive;
    if (dto.isRecorded !== undefined) seminar.isRecorded = dto.isRecorded;
    if (dto.scheduledAt !== undefined) {
      seminar.scheduledAt = new Date(dto.scheduledAt);
    }

    const saved = await this.seminarRepo.save(seminar);
    return successResponse(saved, MESSAGES.SEMINAR_UPDATED);
  }

  async updateStatus(
    id: string,
    status: SeminarStatus,
    userId: string,
    userRole: Role,
  ): Promise<ApiResponse> {
    const seminar = await this.seminarRepo.findOne({ where: { id } });
    if (!seminar) {
      return errorResponse(MESSAGES.SEMINAR_NOT_FOUND);
    }

    if (
      seminar.authorId !== userId &&
      userRole !== Role.ADMIN &&
      userRole !== Role.SUPERADMIN
    ) {
      return errorResponse(MESSAGES.FORBIDDEN);
    }

    seminar.status = status;
    if (status === SeminarStatus.LIVE) {
      seminar.isLive = true;
      if (!seminar.startedAt) seminar.startedAt = new Date();
    } else if (
      status === SeminarStatus.COMPLETED ||
      status === SeminarStatus.CANCELLED
    ) {
      seminar.isLive = false;
      if (!seminar.endedAt) seminar.endedAt = new Date();
    }

    const saved = await this.seminarRepo.save(seminar);
    return successResponse(saved, MESSAGES.SEMINAR_UPDATED);
  }

  async reorderFiles(
    seminarId: string,
    fileIds: string[],
    userId: string,
    userRole: Role,
  ): Promise<ApiResponse> {
    const seminar = await this.seminarRepo.findOne({
      where: { id: seminarId },
    });
    if (!seminar) {
      return errorResponse(MESSAGES.SEMINAR_NOT_FOUND);
    }

    if (
      seminar.authorId !== userId &&
      userRole !== Role.ADMIN &&
      userRole !== Role.SUPERADMIN
    ) {
      return errorResponse(MESSAGES.FORBIDDEN);
    }

    for (let i = 0; i < fileIds.length; i++) {
      await this.fileRepo.update(
        { id: fileIds[i], seminarId },
        { sortOrder: i + 1 },
      );
    }

    const files = await this.fileRepo.find({
      where: { seminarId },
      order: { sortOrder: 'ASC' },
    });

    return successResponse(files, MESSAGES.UPDATED);
  }

  async getTargetSeminars(
    userId: string,
    page = 1,
    limit = 12,
  ): Promise<ApiResponse> {
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

  async getPopularTags(): Promise<ApiResponse> {
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

    return successResponse(tags, MESSAGES.FETCHED);
  }

  async remove(
    id: string,
    userId: string,
    userRole: Role,
  ): Promise<ApiResponse> {
    const seminar = await this.seminarRepo.findOne({ where: { id } });
    if (!seminar) {
      return errorResponse(MESSAGES.SEMINAR_NOT_FOUND);
    }

    if (
      seminar.authorId !== userId &&
      userRole !== Role.ADMIN &&
      userRole !== Role.SUPERADMIN
    ) {
      return errorResponse(MESSAGES.FORBIDDEN);
    }

    await this.seminarRepo.remove(seminar);
    return successResponse(null, MESSAGES.SEMINAR_DELETED);
  }

  async getDashboardStats(currentUser?: any): Promise<ApiResponse> {
    const [liveCount, scheduledCount, topSeminars] = await Promise.all([
      this.seminarRepo.count({
        where: [{ isLive: true }, { status: SeminarStatus.LIVE }],
      }),
      this.seminarRepo.count({
        where: { status: SeminarStatus.SCHEDULED },
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

    return successResponse(
      {
        liveCount,
        scheduledCount,
        topSeminars,
        userStats,
      },
      MESSAGES.FETCHED,
    );
  }

  private async resolveTags(rawInput: string[] | string): Promise<Tag[]> {
    const rawList = Array.isArray(rawInput)
      ? rawInput
      : typeof rawInput === 'string'
        ? rawInput.split(/[,;\s]+/)
        : [];

    const cleanNames = new Set<string>();
    for (const raw of rawList) {
      const clean = this.normalizeTagName(raw);
      if (clean && clean.length >= 2) {
        cleanNames.add(clean);
      }
    }

    const tags: Tag[] = [];
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

  private normalizeTagName(rawTag: string): string {
    if (!rawTag) return '';
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
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Like } from '../../database/entities/like.entity';
import { Comment } from '../../database/entities/comment.entity';
import { SavedSeminar } from '../../database/entities/saved-seminar.entity';
import { Seminar } from '../../database/entities/seminar.entity';
import { User } from '../../database/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { AddCommentDto } from './dto/add-comment.dto';
import {
  ApiResponse,
  successResponse,
  errorResponse,
  MESSAGES,
} from '../../common/response';
import { Role } from '../../common/enums/role.enum';
import { NotificationType } from '../../common/enums';

interface CommentNode {
  id: string;
  content: string;
  parentId: string | null;
  createdAt: Date;
  user: {
    id: string;
    fio: string;
    username: string;
    lavozim?: string;
    avatarUrl?: string;
  } | null;
  replies: CommentNode[];
}

@Injectable()
export class InteractionsService {
  constructor(
    @InjectRepository(Like)
    private readonly likeRepo: Repository<Like>,
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    @InjectRepository(SavedSeminar)
    private readonly savedRepo: Repository<SavedSeminar>,
    @InjectRepository(Seminar)
    private readonly seminarRepo: Repository<Seminar>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ==================== LIKES ====================
  async toggleLike(seminarId: string, userId: string): Promise<ApiResponse> {
    const seminar = await this.seminarRepo.findOne({
      where: { id: seminarId },
    });
    if (!seminar) {
      return errorResponse(MESSAGES.SEMINAR_NOT_FOUND);
    }

    const existing = await this.likeRepo.findOne({
      where: { seminarId, userId },
    });

    let liked = false;
    if (existing) {
      await this.likeRepo.remove(existing);
      liked = false;
    } else {
      const like = this.likeRepo.create({ seminarId, userId });
      await this.likeRepo.save(like);
      liked = true;

      // Send notification to author if author is not the liker
      if (seminar.authorId && seminar.authorId !== userId) {
        const liker = await this.userRepo.findOne({ where: { id: userId } });
        await this.notificationsService.createNotification(
          seminar.authorId,
          NotificationType.SEMINAR_REMINDER,
          'Seminaringizga yangi like bildirildi',
          `${liker?.fio || 'Foydalanuvchi'} sizning "${seminar.title}" seminaringizga like bosdi.`,
          { seminarId, likerId: userId },
        );
      }
    }

    const likesCount = await this.likeRepo.count({ where: { seminarId } });
    return successResponse(
      { liked, likesCount },
      liked ? MESSAGES.LIKED : MESSAGES.UNLIKED,
    );
  }

  // ==================== COMMENTS ====================
  async addComment(
    seminarId: string,
    userId: string,
    dto: AddCommentDto,
  ): Promise<ApiResponse> {
    const seminar = await this.seminarRepo.findOne({
      where: { id: seminarId },
    });
    if (!seminar) {
      return errorResponse(MESSAGES.SEMINAR_NOT_FOUND);
    }

    let parentComment: Comment | null = null;
    if (dto.parentId) {
      parentComment = await this.commentRepo.findOne({
        where: { id: dto.parentId, seminarId },
      });
      if (!parentComment) {
        return errorResponse({
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

    // Notify author of parent comment if it's a reply
    const authorUser = await this.userRepo.findOne({ where: { id: userId } });
    if (
      parentComment &&
      parentComment.userId &&
      parentComment.userId !== userId
    ) {
      await this.notificationsService.notifyCommentReply(
        parentComment.userId,
        seminar.id,
        seminar.title,
        authorUser?.fio || 'Foydalanuvchi',
      );
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

    return successResponse(result, MESSAGES.COMMENT_ADDED);
  }

  async getSeminarComments(seminarId: string): Promise<ApiResponse> {
    const comments = await this.commentRepo.find({
      where: { seminarId },
      relations: { user: true },
      order: { createdAt: 'ASC' },
    });

    // Build comment map
    const map = new Map<string, CommentNode>();
    const roots: CommentNode[] = [];

    comments.forEach((c) => {
      const node: CommentNode = {
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

    // Nest into tree
    comments.forEach((c) => {
      const node = map.get(c.id);
      if (!node) return;
      if (c.parentId && map.has(c.parentId)) {
        const parent = map.get(c.parentId);
        if (parent) {
          parent.replies.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    return successResponse(roots, MESSAGES.FETCHED);
  }

  async removeComment(
    commentId: string,
    userId: string,
    userRole: Role,
  ): Promise<ApiResponse> {
    const comment = await this.commentRepo.findOne({
      where: { id: commentId },
    });
    if (!comment) {
      return errorResponse(MESSAGES.NOT_FOUND);
    }

    if (
      comment.userId !== userId &&
      userRole !== Role.ADMIN &&
      userRole !== Role.SUPERADMIN
    ) {
      return errorResponse(MESSAGES.FORBIDDEN);
    }

    // Delete nested replies recursively or direct remove
    await this.commentRepo.delete({ parentId: commentId });
    await this.commentRepo.remove(comment);

    return successResponse(null, MESSAGES.DELETED);
  }

  // ==================== SAVED SEMINARS (BOOKMARKS) ====================
  async toggleSave(seminarId: string, userId: string): Promise<ApiResponse> {
    const seminar = await this.seminarRepo.findOne({
      where: { id: seminarId },
    });
    if (!seminar) {
      return errorResponse(MESSAGES.SEMINAR_NOT_FOUND);
    }

    const existing = await this.savedRepo.findOne({
      where: { seminarId, userId },
    });

    let saved = false;
    if (existing) {
      await this.savedRepo.remove(existing);
      saved = false;
    } else {
      const newSave = this.savedRepo.create({ seminarId, userId });
      await this.savedRepo.save(newSave);
      saved = true;
    }

    return successResponse(
      { saved },
      saved ? MESSAGES.SAVED : MESSAGES.UNSAVED,
    );
  }

  async getSavedSeminars(
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

    const seminars = savedItems
      .filter((s) => !!s.seminar)
      .map((s) => ({
        ...s.seminar,
        savedAt: s.createdAt,
        isSaved: true,
      }));

    return successResponse(
      {
        items: seminars,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      MESSAGES.FETCHED,
    );
  }
}

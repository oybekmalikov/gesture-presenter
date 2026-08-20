import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { AccessToken } from 'livekit-server-sdk';
import { LiveSession } from '../../database/entities/live-session.entity';
import { Seminar } from '../../database/entities/seminar.entity';
import { Recording } from '../../database/entities/recording.entity';
import { Comment } from '../../database/entities/comment.entity';
import { User } from '../../database/entities/user.entity';
import { SavedSeminar } from '../../database/entities/saved-seminar.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { LiveGateway } from './live.gateway';
import { UpdateLiveStateDto } from './dto/update-live-state.dto';
import { CreateRecordingDto } from './dto/create-recording.dto';
import {
  ApiResponse,
  successResponse,
  errorResponse,
  MESSAGES,
} from '../../common/response';
import {
  LiveSessionStatus,
  SeminarStatus,
  NotificationType,
  FileAccess,
} from '../../common/enums';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class LiveService {
  constructor(
    @InjectRepository(LiveSession)
    private readonly sessionRepo: Repository<LiveSession>,
    @InjectRepository(Seminar)
    private readonly seminarRepo: Repository<Seminar>,
    @InjectRepository(Recording)
    private readonly recordingRepo: Repository<Recording>,
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(SavedSeminar)
    private readonly savedRepo: Repository<SavedSeminar>,
    private readonly notificationsService: NotificationsService,
    private readonly config: ConfigService,
    @Optional()
    private readonly liveGateway?: LiveGateway,
  ) {}

  async startLiveSession(
    seminarId: string,
    userId: string,
    userRole: Role,
  ): Promise<ApiResponse> {
    const seminar = await this.seminarRepo.findOne({
      where: { id: seminarId },
      relations: { author: true, department: true },
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

    // Check if there is already an active session
    let session = await this.sessionRepo.findOne({
      where: { seminarId, status: LiveSessionStatus.ACTIVE },
    });

    const now = new Date();
    if (!session) {
      session = this.sessionRepo.create({
        seminarId,
        roomId: `live_${seminarId.slice(0, 8)}_${Date.now()}`,
        status: LiveSessionStatus.ACTIVE,
        startedAt: now,
        participantCount: 1,
        peakViewerCount: 1,
      });
      session = await this.sessionRepo.save(session);
    }

    // Update seminar
    seminar.isLive = true;
    seminar.status = SeminarStatus.LIVE;
    if (!seminar.startedAt) {
      seminar.startedAt = session.startedAt;
    }
    await this.seminarRepo.save(seminar);

    // Broadcast live state via WebSocket
    if (this.liveGateway) {
      this.liveGateway.broadcastLiveStateChange(seminarId, true, {
        roomId: session.roomId,
        startedAt: session.startedAt,
      });
    }

    // Send Live Announcement Notifications
    this.sendLiveStartedNotifications(seminar).catch(() => {});

    return successResponse(
      { session, roomId: session.roomId },
      {
        uz: 'Jonli seminar muvaffaqiyatli boshlandi',
        ru: 'Прямой эфир успешно начался',
      },
    );
  }

  async updateLiveState(
    seminarId: string,
    dto: UpdateLiveStateDto,
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

    const session = await this.sessionRepo.findOne({
      where: { seminarId, status: LiveSessionStatus.ACTIVE },
    });

    if (!session) {
      return errorResponse({
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
      session.peakViewerCount = Math.max(
        session.peakViewerCount,
        dto.participantCount,
      );
    }

    const saved = await this.sessionRepo.save(session);
    return successResponse(saved, MESSAGES.UPDATED);
  }

  async endLiveSession(
    seminarId: string,
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

    const session = await this.sessionRepo.findOne({
      where: { seminarId, status: LiveSessionStatus.ACTIVE },
    });

    const now = new Date();
    if (session) {
      session.status = LiveSessionStatus.ENDED;
      session.endedAt = now;
      await this.sessionRepo.save(session);

      // Automatic Live Chat Cleanup (ABOUT_PROJECT.MD requirement: chat disappears after live)
      if (session.startedAt) {
        await this.commentRepo.delete({
          seminarId,
          createdAt: Between(session.startedAt, now),
        });
      }
    }

    seminar.isLive = false;
    seminar.status = SeminarStatus.COMPLETED;
    seminar.endedAt = now;
    await this.seminarRepo.save(seminar);

    // Broadcast live state via WebSocket
    if (this.liveGateway) {
      this.liveGateway.broadcastLiveStateChange(seminarId, false, {
        endedAt: now,
      });
    }

    return successResponse(
      {
        seminarId,
        status: SeminarStatus.COMPLETED,
        liveChatCleaned: true,
      },
      {
        uz: 'Jonli seminar yakunlandi. Jonli chat tozalandi.',
        ru: 'Прямой эфир завершён. Чат прямого эфира очищен.',
      },
    );
  }

  /**
   * Generates a LiveKit JWT token for WebRTC video/audio streaming
   */
  async generateLiveKitToken(
    seminarId: string,
    currentUser?: any,
  ): Promise<ApiResponse> {
    const seminar = await this.seminarRepo.findOne({
      where: { id: seminarId },
      relations: { author: true },
    });

    if (!seminar) {
      return errorResponse(MESSAGES.SEMINAR_NOT_FOUND);
    }

    const apiKey = this.config.get<string>('LIVEKIT_API_KEY', 'okmk_livekit_key');
    const apiSecret = this.config.get<string>(
      'LIVEKIT_API_SECRET',
      'okmk_livekit_secret_dev_2026',
    );
    const serverUrl = this.config.get<string>(
      'LIVEKIT_URL',
      'ws://localhost:7880',
    );

    const isPresenter =
      currentUser &&
      (currentUser.id === seminar.authorId ||
        currentUser.role === Role.ADMIN ||
        currentUser.role === Role.SUPERADMIN);

    const identity = currentUser?.id || `guest_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const name = currentUser?.fio || currentUser?.username || 'Mehmon';

    const at = new AccessToken(apiKey, apiSecret, {
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

    return successResponse(
      {
        token,
        serverUrl,
        roomName: seminarId,
        identity,
        name,
        isPresenter: Boolean(isPresenter),
        seminarTitle: seminar.title,
      },
      {
        uz: 'LiveKit streaming tokeni muvaffaqiyatli yaratildi',
        ru: 'Токен для трансляции LiveKit успешно создан',
      },
    );
  }

  async addRecording(
    seminarId: string,
    dto: CreateRecordingDto,
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

    const session = await this.sessionRepo.findOne({
      where: { seminarId },
      order: { createdAt: 'DESC' },
    });

    if (!session) {
      return errorResponse({
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

    // Mark seminar as recorded
    seminar.isRecorded = true;
    await this.seminarRepo.save(seminar);

    return successResponse(saved, MESSAGES.CREATED);
  }

  async getSession(seminarId: string): Promise<ApiResponse> {
    const session = await this.sessionRepo.findOne({
      where: { seminarId },
      order: { createdAt: 'DESC' },
      relations: {
        seminar: { author: true, department: true },
        recordings: true,
      },
    });

    if (!session) {
      return errorResponse(MESSAGES.NOT_FOUND);
    }

    return successResponse(session, MESSAGES.FETCHED);
  }

  async getActiveSessions(): Promise<ApiResponse> {
    const sessions = await this.sessionRepo.find({
      where: { status: LiveSessionStatus.ACTIVE },
      relations: { seminar: { author: true, department: true } },
      order: { startedAt: 'DESC' },
    });

    return successResponse(sessions, MESSAGES.FETCHED);
  }

  private async sendLiveStartedNotifications(seminar: Seminar) {
    const recipientIds = new Set<string>();

    if (seminar.targetUserId) {
      recipientIds.add(seminar.targetUserId);
    }

    if (seminar.fileAccess === FileAccess.PRIVATE && seminar.departmentId) {
      const deptUsers = await this.userRepo.find({
        where: { departmentId: seminar.departmentId, isActive: true },
        select: { id: true },
      });
      deptUsers.forEach((u) => recipientIds.add(u.id));
    } else {
      const savedUsers = await this.savedRepo.find({
        where: { seminarId: seminar.id },
        select: { userId: true },
      });
      savedUsers.forEach((s) => recipientIds.add(s.userId));
    }

    for (const uId of recipientIds) {
      if (uId === seminar.authorId) continue;
      await this.notificationsService.createNotification(
        uId,
        NotificationType.SEMINAR_REMINDER,
        'Jonli seminar boshlandi!',
        `"${seminar.title}" mavzusidagi jonli seminar efiri hozir boshlandi. Qatnashish uchun bosing.`,
        { seminarId: seminar.id, isLive: true },
      );
    }
  }
}

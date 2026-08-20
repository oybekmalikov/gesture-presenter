import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Seminar } from '../../database/entities/seminar.entity';
import { Notification } from '../../database/entities/notification.entity';
import { User } from '../../database/entities/user.entity';
import { SavedSeminar } from '../../database/entities/saved-seminar.entity';
import {
  SeminarStatus,
  NotificationType,
  FileAccess,
} from '../../common/enums';

interface ReminderInterval {
  key: string;
  minMs: number;
  maxMs: number;
  labelUz: string;
  labelRu: string;
}

const INTERVALS: ReminderInterval[] = [
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

@Injectable()
export class ReminderSchedulerService {
  private readonly logger = new Logger(ReminderSchedulerService.name);

  constructor(
    @InjectRepository(Seminar)
    private readonly seminarRepo: Repository<Seminar>,
    @InjectRepository(Notification)
    private readonly notifRepo: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(SavedSeminar)
    private readonly savedRepo: Repository<SavedSeminar>,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async checkUpcomingSeminars() {
    try {
      const now = new Date();
      const maxFuture = new Date(now.getTime() + 74 * 3600 * 1000); // look ahead up to ~3 days

      const upcomingSeminars = await this.seminarRepo
        .createQueryBuilder('seminar')
        .leftJoinAndSelect('seminar.author', 'author')
        .leftJoinAndSelect('seminar.department', 'department')
        .where('seminar.status = :status', { status: SeminarStatus.SCHEDULED })
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
    } catch (err: any) {
      this.logger.error(`Scheduler xatolik: ${err.message}`, err.stack);
    }
  }

  private async processIntervalNotification(
    seminar: Seminar,
    interval: ReminderInterval,
  ) {
    // 1. Determine recipients
    const recipientIds = new Set<string>();

    if (seminar.authorId) {
      recipientIds.add(seminar.authorId);
    }
    if (seminar.targetUserId) {
      recipientIds.add(seminar.targetUserId);
    }

    // If private to department, add department members
    if (seminar.fileAccess === FileAccess.PRIVATE && seminar.departmentId) {
      const deptUsers = await this.userRepo.find({
        where: { departmentId: seminar.departmentId, isActive: true },
        select: { id: true },
      });
      deptUsers.forEach((u) => recipientIds.add(u.id));
    } else {
      // For public / readable, add users who saved/bookmarked this seminar
      const savedUsers = await this.savedRepo.find({
        where: { seminarId: seminar.id },
        select: { userId: true },
      });
      savedUsers.forEach((s) => recipientIds.add(s.userId));
    }

    if (recipientIds.size === 0) return;

    // 2. Filter out users who already received notification for this interval
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
          type: NotificationType.SEMINAR_REMINDER,
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
}

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import * as fs from 'fs';
import { SeminarFile } from '../../database/entities/seminar-file.entity';

@Injectable()
export class FileCleanupSchedulerService {
  private readonly logger = new Logger(FileCleanupSchedulerService.name);

  constructor(
    @InjectRepository(SeminarFile)
    private readonly fileRepo: Repository<SeminarFile>,
  ) {}

  /**
   * Runs daily at midnight to purge expired files
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async purgeExpiredFiles() {
    try {
      const now = new Date();
      const expiredFiles = await this.fileRepo.find({
        where: {
          deletionScheduledDate: LessThanOrEqual(now),
        },
        relations: { seminar: true },
      });

      if (expiredFiles.length === 0) {
        return;
      }

      this.logger.log(`🗑️ Topilgan ${expiredFiles.length} ta muddati o'tgan faylni o'chirish boshlandi`);

      let purgedCount = 0;
      for (const file of expiredFiles) {
        if (file.storagePath && fs.existsSync(file.storagePath)) {
          try {
            fs.unlinkSync(file.storagePath);
          } catch (err: any) {
            this.logger.warn(`Diskdan faylni o'chirishda xatolik: ${file.storagePath} - ${err.message}`);
          }
        }
        await this.fileRepo.remove(file);
        purgedCount++;
      }

      this.logger.log(`✅ ${purgedCount} ta muddati tugagan fayl diskdan va bazadan muvaffaqiyatli tozalandi`);
    } catch (err: any) {
      this.logger.error(`Fayllarni tozalash schedulerida xatolik: ${err.message}`, err.stack);
    }
  }

  /**
   * Manual trigger for admin
   */
  async runManualCleanupCycle(): Promise<{ purgedCount: number; filesPurged: string[] }> {
    const now = new Date();
    const expiredFiles = await this.fileRepo.find({
      where: {
        deletionScheduledDate: LessThanOrEqual(now),
      },
    });

    const filesPurged: string[] = [];
    for (const file of expiredFiles) {
      if (file.storagePath && fs.existsSync(file.storagePath)) {
        try {
          fs.unlinkSync(file.storagePath);
        } catch {}
      }
      filesPurged.push(file.originalName);
      await this.fileRepo.remove(file);
    }

    return {
      purgedCount: filesPurged.length,
      filesPurged,
    };
  }
}

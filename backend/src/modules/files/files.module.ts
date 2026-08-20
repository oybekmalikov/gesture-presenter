import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { FileCleanupSchedulerService } from './file-cleanup-scheduler.service';
import { ModelConverterService } from './model-converter.service';
import { SeminarFile } from '../../database/entities/seminar-file.entity';
import { Seminar } from '../../database/entities/seminar.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SeminarFile, Seminar]),
    NotificationsModule,
  ],
  controllers: [FilesController],
  providers: [
    FilesService,
    FileCleanupSchedulerService,
    ModelConverterService,
  ],
  exports: [FilesService, ModelConverterService],
})
export class FilesModule {}

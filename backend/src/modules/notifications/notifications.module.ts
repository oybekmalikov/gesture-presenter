import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { ReminderSchedulerService } from './reminder-scheduler.service';
import { NotificationsGateway } from './notifications.gateway';
import { Notification } from '../../database/entities/notification.entity';
import { Seminar } from '../../database/entities/seminar.entity';
import { User } from '../../database/entities/user.entity';
import { SavedSeminar } from '../../database/entities/saved-seminar.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, Seminar, User, SavedSeminar]),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    ReminderSchedulerService,
    NotificationsGateway,
  ],
  exports: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule {}


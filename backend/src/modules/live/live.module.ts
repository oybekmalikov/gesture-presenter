import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LiveService } from './live.service';
import { LiveController } from './live.controller';
import { LiveGateway } from './live.gateway';
import { LiveSession } from '../../database/entities/live-session.entity';
import { Seminar } from '../../database/entities/seminar.entity';
import { Recording } from '../../database/entities/recording.entity';
import { Comment } from '../../database/entities/comment.entity';
import { User } from '../../database/entities/user.entity';
import { SavedSeminar } from '../../database/entities/saved-seminar.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LiveSession,
      Seminar,
      Recording,
      Comment,
      User,
      SavedSeminar,
    ]),
    NotificationsModule,
  ],
  controllers: [LiveController],
  providers: [LiveService, LiveGateway],
  exports: [LiveService, LiveGateway],
})
export class LiveModule {}


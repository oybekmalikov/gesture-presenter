import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InteractionsService } from './interactions.service';
import { InteractionsController } from './interactions.controller';
import { Like } from '../../database/entities/like.entity';
import { Comment } from '../../database/entities/comment.entity';
import { SavedSeminar } from '../../database/entities/saved-seminar.entity';
import { Seminar } from '../../database/entities/seminar.entity';
import { User } from '../../database/entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Like, Comment, SavedSeminar, Seminar, User]),
    NotificationsModule,
  ],
  controllers: [InteractionsController],
  providers: [InteractionsService],
  exports: [InteractionsService],
})
export class InteractionsModule {}

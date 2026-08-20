import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeminarsService } from './seminars.service';
import { SeminarsController } from './seminars.controller';
import { Seminar } from '../../database/entities/seminar.entity';
import { SeminarFile } from '../../database/entities/seminar-file.entity';
import { Tag } from '../../database/entities/tag.entity';
import { Like } from '../../database/entities/like.entity';
import { Comment } from '../../database/entities/comment.entity';
import { SavedSeminar } from '../../database/entities/saved-seminar.entity';
import { SeminarViewLog } from '../../database/entities/seminar-view-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Seminar,
      SeminarFile,
      Tag,
      Like,
      Comment,
      SavedSeminar,
      SeminarViewLog,
    ]),
  ],
  controllers: [SeminarsController],
  providers: [SeminarsService],
  exports: [SeminarsService],
})
export class SeminarsModule {}

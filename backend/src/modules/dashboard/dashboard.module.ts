import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { Seminar } from '../../database/entities/seminar.entity';
import { User } from '../../database/entities/user.entity';
import { Department } from '../../database/entities/department.entity';
import { SeminarFile } from '../../database/entities/seminar-file.entity';
import { Like } from '../../database/entities/like.entity';
import { Comment } from '../../database/entities/comment.entity';
import { SavedSeminar } from '../../database/entities/saved-seminar.entity';
import { AuditLog } from '../../database/entities/audit-log.entity';
import { Tag } from '../../database/entities/tag.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Seminar,
      User,
      Department,
      SeminarFile,
      Like,
      Comment,
      SavedSeminar,
      AuditLog,
      Tag,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}

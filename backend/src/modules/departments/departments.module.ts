import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DepartmentsService } from './departments.service';
import { DepartmentsController } from './departments.controller';
import { Department } from '../../database/entities/department.entity';
import { SubDepartment } from '../../database/entities/sub-department.entity';
import { Position } from '../../database/entities/position.entity';
import { User } from '../../database/entities/user.entity';
import { Seminar } from '../../database/entities/seminar.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Department,
      SubDepartment,
      Position,
      User,
      Seminar,
    ]),
  ],
  controllers: [DepartmentsController],
  providers: [DepartmentsService],
  exports: [DepartmentsService],
})
export class DepartmentsModule {}

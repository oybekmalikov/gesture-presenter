import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from '../../database/entities/user.entity';
import { Department } from '../../database/entities/department.entity';
import { SubDepartment } from '../../database/entities/sub-department.entity';
import { Position } from '../../database/entities/position.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Department, SubDepartment, Position]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}

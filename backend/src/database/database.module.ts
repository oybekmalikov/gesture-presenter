import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  Department,
  SubDepartment,
  Position,
  User,
  Seminar,
  SeminarFile,
  Tag,
  Like,
  Comment,
  SavedSeminar,
  Notification,
  LiveSession,
  Recording,
  AuditLog,
  SeminarViewLog,
} from './entities';
import { SeedService } from './seeds/seed.service';

const ENTITIES = [
  Department,
  SubDepartment,
  Position,
  User,
  Seminar,
  SeminarFile,
  Tag,
  Like,
  Comment,
  SavedSeminar,
  Notification,
  LiveSession,
  Recording,
  AuditLog,
  SeminarViewLog,
];

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('database.host', 'postgres'),
        port: config.get<number>('database.port', 5432),
        username: config.get<string>('database.username', 'okmk_user'),
        password: config.get<string>('database.password', 'okmk_dev_2026'),
        database: config.get<string>('database.database', 'okmk_seminar'),
        entities: ENTITIES,
        synchronize: config.get<boolean>('database.synchronize', true),
        logging: config.get<boolean>('database.logging', false),
      }),
    }),
    TypeOrmModule.forFeature([User, Department, Seminar, Tag, SeminarViewLog]),
  ],
  providers: [SeedService],
  exports: [TypeOrmModule, SeedService],
})
export class DatabaseModule {}

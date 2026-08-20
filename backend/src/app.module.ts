import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { SeminarsModule } from './modules/seminars/seminars.module';
import { FilesModule } from './modules/files/files.module';
import { InteractionsModule } from './modules/interactions/interactions.module';
import { LiveModule } from './modules/live/live.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AuditModule } from './modules/audit/audit.module';
import { HealthModule } from './modules/health/health.module';
import { AiModule } from './modules/ai/ai.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule,
    DatabaseModule,
    AuditModule,
    AuthModule,
    UsersModule,
    DepartmentsModule,
    SeminarsModule,
    FilesModule,
    InteractionsModule,
    LiveModule,
    NotificationsModule,
    DashboardModule,
    HealthModule,
    AiModule,
  ],
})
export class AppModule {}

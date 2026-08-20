"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const config_module_1 = require("./config/config.module");
const database_module_1 = require("./database/database.module");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const departments_module_1 = require("./modules/departments/departments.module");
const seminars_module_1 = require("./modules/seminars/seminars.module");
const files_module_1 = require("./modules/files/files.module");
const interactions_module_1 = require("./modules/interactions/interactions.module");
const live_module_1 = require("./modules/live/live.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const dashboard_module_1 = require("./modules/dashboard/dashboard.module");
const audit_module_1 = require("./modules/audit/audit.module");
const health_module_1 = require("./modules/health/health.module");
const ai_module_1 = require("./modules/ai/ai.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            schedule_1.ScheduleModule.forRoot(),
            config_module_1.ConfigModule,
            database_module_1.DatabaseModule,
            audit_module_1.AuditModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            departments_module_1.DepartmentsModule,
            seminars_module_1.SeminarsModule,
            files_module_1.FilesModule,
            interactions_module_1.InteractionsModule,
            live_module_1.LiveModule,
            notifications_module_1.NotificationsModule,
            dashboard_module_1.DashboardModule,
            health_module_1.HealthModule,
            ai_module_1.AiModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map
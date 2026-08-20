"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const dashboard_service_1 = require("./dashboard.service");
const dashboard_controller_1 = require("./dashboard.controller");
const seminar_entity_1 = require("../../database/entities/seminar.entity");
const user_entity_1 = require("../../database/entities/user.entity");
const department_entity_1 = require("../../database/entities/department.entity");
const seminar_file_entity_1 = require("../../database/entities/seminar-file.entity");
const like_entity_1 = require("../../database/entities/like.entity");
const comment_entity_1 = require("../../database/entities/comment.entity");
const saved_seminar_entity_1 = require("../../database/entities/saved-seminar.entity");
const audit_log_entity_1 = require("../../database/entities/audit-log.entity");
const tag_entity_1 = require("../../database/entities/tag.entity");
let DashboardModule = class DashboardModule {
};
exports.DashboardModule = DashboardModule;
exports.DashboardModule = DashboardModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                seminar_entity_1.Seminar,
                user_entity_1.User,
                department_entity_1.Department,
                seminar_file_entity_1.SeminarFile,
                like_entity_1.Like,
                comment_entity_1.Comment,
                saved_seminar_entity_1.SavedSeminar,
                audit_log_entity_1.AuditLog,
                tag_entity_1.Tag,
            ]),
        ],
        controllers: [dashboard_controller_1.DashboardController],
        providers: [dashboard_service_1.DashboardService],
        exports: [dashboard_service_1.DashboardService],
    })
], DashboardModule);
//# sourceMappingURL=dashboard.module.js.map
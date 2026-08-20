"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeminarsController = void 0;
const common_1 = require("@nestjs/common");
const seminars_service_1 = require("./seminars.service");
const create_seminar_dto_1 = require("./dto/create-seminar.dto");
const update_seminar_dto_1 = require("./dto/update-seminar.dto");
const update_seminar_status_dto_1 = require("./dto/update-seminar-status.dto");
const reorder_files_dto_1 = require("./dto/reorder-files.dto");
const query_seminar_dto_1 = require("./dto/query-seminar.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const optional_jwt_auth_guard_1 = require("../../common/guards/optional-jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const audit_decorator_1 = require("../../common/decorators/audit.decorator");
const role_enum_1 = require("../../common/enums/role.enum");
let SeminarsController = class SeminarsController {
    seminarsService;
    constructor(seminarsService) {
        this.seminarsService = seminarsService;
    }
    getDashboardStats(currentUser) {
        return this.seminarsService.getDashboardStats(currentUser);
    }
    getPopularTags() {
        return this.seminarsService.getPopularTags();
    }
    getTargetSeminars(userId, page, limit) {
        return this.seminarsService.getTargetSeminars(userId, Number(page) || 1, Number(limit) || 12);
    }
    findAll(query, currentUser) {
        return this.seminarsService.findAll(query, currentUser);
    }
    findOne(id, currentUser) {
        return this.seminarsService.findOne(id, currentUser);
    }
    getBookmarkedSeminars(userId, page, limit) {
        return this.seminarsService.getBookmarkedSeminars(userId, Number(page) || 1, Number(limit) || 12);
    }
    toggleBookmark(id, userId) {
        return this.seminarsService.toggleBookmark(id, userId);
    }
    create(userId, userRole, dto) {
        return this.seminarsService.create(userId, dto, userRole);
    }
    update(id, currentUser, dto) {
        return this.seminarsService.update(id, currentUser.id, currentUser.role, dto);
    }
    updateStatus(id, currentUser, dto) {
        return this.seminarsService.updateStatus(id, dto.status, currentUser.id, currentUser.role);
    }
    reorderFiles(id, currentUser, dto) {
        return this.seminarsService.reorderFiles(id, dto.fileIds, currentUser.id, currentUser.role);
    }
    remove(id, currentUser) {
        return this.seminarsService.remove(id, currentUser.id, currentUser.role);
    }
};
exports.SeminarsController = SeminarsController;
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, common_1.UseGuards)(optional_jwt_auth_guard_1.OptionalJwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SeminarsController.prototype, "getDashboardStats", null);
__decorate([
    (0, common_1.Get)('tags/popular'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SeminarsController.prototype, "getPopularTags", null);
__decorate([
    (0, common_1.Get)('assigned/for-me'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", void 0)
], SeminarsController.prototype, "getTargetSeminars", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(optional_jwt_auth_guard_1.OptionalJwtAuthGuard),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_seminar_dto_1.QuerySeminarDto, Object]),
    __metadata("design:returntype", void 0)
], SeminarsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(optional_jwt_auth_guard_1.OptionalJwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SeminarsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('bookmarks'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", void 0)
], SeminarsController.prototype, "getBookmarkedSeminars", null);
__decorate([
    (0, common_1.Post)(':id/bookmark'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], SeminarsController.prototype, "toggleBookmark", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, audit_decorator_1.Audit)({ action: 'seminar_create', entityType: 'seminar' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('role')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_seminar_dto_1.CreateSeminarDto]),
    __metadata("design:returntype", void 0)
], SeminarsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, audit_decorator_1.Audit)({ action: 'seminar_update', entityType: 'seminar' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, update_seminar_dto_1.UpdateSeminarDto]),
    __metadata("design:returntype", void 0)
], SeminarsController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, audit_decorator_1.Audit)({ action: 'seminar_status_change', entityType: 'seminar' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, update_seminar_status_dto_1.UpdateSeminarStatusDto]),
    __metadata("design:returntype", void 0)
], SeminarsController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Patch)(':id/files/reorder'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, reorder_files_dto_1.ReorderFilesDto]),
    __metadata("design:returntype", void 0)
], SeminarsController.prototype, "reorderFiles", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, audit_decorator_1.Audit)({ action: 'seminar_delete', entityType: 'seminar' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SeminarsController.prototype, "remove", null);
exports.SeminarsController = SeminarsController = __decorate([
    (0, common_1.Controller)('seminars'),
    __metadata("design:paramtypes", [seminars_service_1.SeminarsService])
], SeminarsController);
//# sourceMappingURL=seminars.controller.js.map
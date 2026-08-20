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
exports.InteractionsController = void 0;
const common_1 = require("@nestjs/common");
const interactions_service_1 = require("./interactions.service");
const add_comment_dto_1 = require("./dto/add-comment.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let InteractionsController = class InteractionsController {
    interactionsService;
    constructor(interactionsService) {
        this.interactionsService = interactionsService;
    }
    toggleLike(seminarId, userId) {
        return this.interactionsService.toggleLike(seminarId, userId);
    }
    getComments(seminarId) {
        return this.interactionsService.getSeminarComments(seminarId);
    }
    addComment(seminarId, userId, dto) {
        return this.interactionsService.addComment(seminarId, userId, dto);
    }
    removeComment(id, currentUser) {
        return this.interactionsService.removeComment(id, currentUser.id, currentUser.role);
    }
    toggleSave(seminarId, userId) {
        return this.interactionsService.toggleSave(seminarId, userId);
    }
    getSavedSeminars(userId, page, limit) {
        return this.interactionsService.getSavedSeminars(userId, Number(page) || 1, Number(limit) || 12);
    }
};
exports.InteractionsController = InteractionsController;
__decorate([
    (0, common_1.Post)('seminars/:seminarId/like'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('seminarId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], InteractionsController.prototype, "toggleLike", null);
__decorate([
    (0, common_1.Get)('seminars/:seminarId/comments'),
    __param(0, (0, common_1.Param)('seminarId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InteractionsController.prototype, "getComments", null);
__decorate([
    (0, common_1.Post)('seminars/:seminarId/comments'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('seminarId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, add_comment_dto_1.AddCommentDto]),
    __metadata("design:returntype", void 0)
], InteractionsController.prototype, "addComment", null);
__decorate([
    (0, common_1.Delete)('comments/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], InteractionsController.prototype, "removeComment", null);
__decorate([
    (0, common_1.Post)('seminars/:seminarId/save'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('seminarId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], InteractionsController.prototype, "toggleSave", null);
__decorate([
    (0, common_1.Get)('saved'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", void 0)
], InteractionsController.prototype, "getSavedSeminars", null);
exports.InteractionsController = InteractionsController = __decorate([
    (0, common_1.Controller)('interactions'),
    __metadata("design:paramtypes", [interactions_service_1.InteractionsService])
], InteractionsController);
//# sourceMappingURL=interactions.controller.js.map
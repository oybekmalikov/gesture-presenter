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
exports.LiveController = void 0;
const common_1 = require("@nestjs/common");
const live_service_1 = require("./live.service");
const update_live_state_dto_1 = require("./dto/update-live-state.dto");
const create_recording_dto_1 = require("./dto/create-recording.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const optional_jwt_auth_guard_1 = require("../../common/guards/optional-jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const audit_decorator_1 = require("../../common/decorators/audit.decorator");
let LiveController = class LiveController {
    liveService;
    constructor(liveService) {
        this.liveService = liveService;
    }
    getActiveSessions() {
        return this.liveService.getActiveSessions();
    }
    getToken(seminarId, currentUser) {
        return this.liveService.generateLiveKitToken(seminarId, currentUser);
    }
    generateToken(seminarId, currentUser) {
        return this.liveService.generateLiveKitToken(seminarId, currentUser);
    }
    getSession(seminarId) {
        return this.liveService.getSession(seminarId);
    }
    startLiveSession(seminarId, currentUser) {
        return this.liveService.startLiveSession(seminarId, currentUser.id, currentUser.role);
    }
    updateLiveState(seminarId, dto, currentUser) {
        return this.liveService.updateLiveState(seminarId, dto, currentUser.id, currentUser.role);
    }
    endLiveSession(seminarId, currentUser) {
        return this.liveService.endLiveSession(seminarId, currentUser.id, currentUser.role);
    }
    addRecording(seminarId, dto, currentUser) {
        return this.liveService.addRecording(seminarId, dto, currentUser.id, currentUser.role);
    }
};
exports.LiveController = LiveController;
__decorate([
    (0, common_1.Get)('active'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], LiveController.prototype, "getActiveSessions", null);
__decorate([
    (0, common_1.Get)(':seminarId/token'),
    (0, common_1.UseGuards)(optional_jwt_auth_guard_1.OptionalJwtAuthGuard),
    __param(0, (0, common_1.Param)('seminarId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], LiveController.prototype, "getToken", null);
__decorate([
    (0, common_1.Post)(':seminarId/token'),
    (0, common_1.UseGuards)(optional_jwt_auth_guard_1.OptionalJwtAuthGuard),
    __param(0, (0, common_1.Param)('seminarId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], LiveController.prototype, "generateToken", null);
__decorate([
    (0, common_1.Get)(':seminarId'),
    __param(0, (0, common_1.Param)('seminarId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LiveController.prototype, "getSession", null);
__decorate([
    (0, common_1.Post)(':seminarId/start'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, audit_decorator_1.Audit)({ action: 'live_session_start', entityType: 'live_session' }),
    __param(0, (0, common_1.Param)('seminarId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], LiveController.prototype, "startLiveSession", null);
__decorate([
    (0, common_1.Patch)(':seminarId/state'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('seminarId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_live_state_dto_1.UpdateLiveStateDto, Object]),
    __metadata("design:returntype", void 0)
], LiveController.prototype, "updateLiveState", null);
__decorate([
    (0, common_1.Post)(':seminarId/end'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, audit_decorator_1.Audit)({ action: 'live_session_end', entityType: 'live_session' }),
    __param(0, (0, common_1.Param)('seminarId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], LiveController.prototype, "endLiveSession", null);
__decorate([
    (0, common_1.Post)(':seminarId/recordings'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, audit_decorator_1.Audit)({ action: 'recording_uploaded', entityType: 'recording' }),
    __param(0, (0, common_1.Param)('seminarId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_recording_dto_1.CreateRecordingDto, Object]),
    __metadata("design:returntype", void 0)
], LiveController.prototype, "addRecording", null);
exports.LiveController = LiveController = __decorate([
    (0, common_1.Controller)('live'),
    __metadata("design:paramtypes", [live_service_1.LiveService])
], LiveController);
//# sourceMappingURL=live.controller.js.map
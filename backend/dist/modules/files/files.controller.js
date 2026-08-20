"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const uuid_1 = require("uuid");
const files_service_1 = require("./files.service");
const mark_cleanup_dto_1 = require("./dto/mark-cleanup.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const optional_jwt_auth_guard_1 = require("../../common/guards/optional-jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const audit_decorator_1 = require("../../common/decorators/audit.decorator");
const role_enum_1 = require("../../common/enums/role.enum");
const uploadStorage = (0, multer_1.diskStorage)({
    destination: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
        let subDir = 'media';
        if (['pdf', 'pptx', 'ppt'].includes(ext))
            subDir = 'pdf';
        else if (['step', 'stp', 'glb', 'gltf'].includes(ext))
            subDir = 'glb';
        else if (['mp4', 'webm', 'mkv', 'mov'].includes(ext))
            subDir = 'media';
        const dir = path.resolve(process.cwd(), 'uploads', subDir);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        const uniqueName = `${(0, uuid_1.v4)()}${ext}`;
        cb(null, uniqueName);
    },
});
let FilesController = class FilesController {
    filesService;
    constructor(filesService) {
        this.filesService = filesService;
    }
    uploadFile(seminarId, file, currentUser) {
        if (!file) {
            throw new common_1.BadRequestException('Fayl yuborilmadi');
        }
        return this.filesService.uploadSeminarFile(seminarId, file, currentUser.id, currentUser.role);
    }
    uploadMultiple(seminarId, files, currentUser) {
        if (!files || files.length === 0) {
            throw new common_1.BadRequestException('Fayllar yuborilmadi');
        }
        return this.filesService.uploadMultipleSeminarFiles(seminarId, files, currentUser.id, currentUser.role);
    }
    findBySeminar(seminarId) {
        return this.filesService.findBySeminar(seminarId);
    }
    async viewFile(id, currentUser, res) {
        const file = await this.filesService.findOne(id);
        if (!file || !file.storagePath || !fs.existsSync(file.storagePath)) {
            throw new common_1.NotFoundException('Fayl topilmadi');
        }
        const hasAccess = this.filesService.checkFilePermission(file, currentUser, 'view');
        if (!hasAccess) {
            throw new common_1.ForbiddenException('Ushbu faylni ko`rish uchun ruxsat yo`q');
        }
        res.sendFile(file.storagePath);
    }
    async downloadFile(id, currentUser, res) {
        const file = await this.filesService.findOne(id);
        if (!file || !file.storagePath || !fs.existsSync(file.storagePath)) {
            throw new common_1.NotFoundException('Fayl topilmadi');
        }
        const hasAccess = this.filesService.checkFilePermission(file, currentUser, 'download');
        if (!hasAccess) {
            throw new common_1.ForbiddenException('Ushbu faylni yuklab olish cheklangan (faqat ko`rish mumkin yoki ruxsat yo`q)');
        }
        res.download(file.storagePath, file.originalName);
    }
    inspect3DModel(id) {
        return this.filesService.inspect3DModel(id);
    }
    remove(id, currentUser) {
        return this.filesService.remove(id, currentUser.id, currentUser.role);
    }
    getCleanupCandidates() {
        return this.filesService.getAdminCleanupCandidates();
    }
    getPendingCleanup() {
        return this.filesService.getPendingCleanupFiles();
    }
    markCleanup(dto, adminId) {
        return this.filesService.markFilesForCleanup(dto, adminId);
    }
    cancelCleanup(fileIds) {
        return this.filesService.cancelCleanup(fileIds);
    }
    forceDelete(id) {
        return this.filesService.forceDelete(id);
    }
};
exports.FilesController = FilesController;
__decorate([
    (0, common_1.Post)('upload/:seminarId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, audit_decorator_1.Audit)({ action: 'file_upload', entityType: 'file' }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: uploadStorage,
        limits: {
            fileSize: 100 * 1024 * 1024,
        },
    })),
    __param(0, (0, common_1.Param)('seminarId')),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], FilesController.prototype, "uploadFile", null);
__decorate([
    (0, common_1.Post)('upload/:seminarId/multiple'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, audit_decorator_1.Audit)({ action: 'multiple_files_upload', entityType: 'file' }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('files', 20, {
        storage: uploadStorage,
        limits: {
            fileSize: 100 * 1024 * 1024,
        },
    })),
    __param(0, (0, common_1.Param)('seminarId')),
    __param(1, (0, common_1.UploadedFiles)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array, Object]),
    __metadata("design:returntype", void 0)
], FilesController.prototype, "uploadMultiple", null);
__decorate([
    (0, common_1.Get)('seminar/:seminarId'),
    __param(0, (0, common_1.Param)('seminarId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FilesController.prototype, "findBySeminar", null);
__decorate([
    (0, common_1.Get)(':id/view'),
    (0, common_1.UseGuards)(optional_jwt_auth_guard_1.OptionalJwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "viewFile", null);
__decorate([
    (0, common_1.Get)(':id/download'),
    (0, common_1.UseGuards)(optional_jwt_auth_guard_1.OptionalJwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "downloadFile", null);
__decorate([
    (0, common_1.Get)(':id/inspect-3d'),
    (0, common_1.UseGuards)(optional_jwt_auth_guard_1.OptionalJwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FilesController.prototype, "inspect3DModel", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, audit_decorator_1.Audit)({ action: 'file_delete', entityType: 'file' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FilesController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)('admin/cleanup-candidates'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.SUPERADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FilesController.prototype, "getCleanupCandidates", null);
__decorate([
    (0, common_1.Get)('admin/pending-cleanup'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.SUPERADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FilesController.prototype, "getPendingCleanup", null);
__decorate([
    (0, common_1.Post)('admin/mark-cleanup'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.SUPERADMIN),
    (0, audit_decorator_1.Audit)({ action: 'files_marked_for_cleanup', entityType: 'file' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mark_cleanup_dto_1.MarkCleanupDto, String]),
    __metadata("design:returntype", void 0)
], FilesController.prototype, "markCleanup", null);
__decorate([
    (0, common_1.Post)('admin/cancel-cleanup'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.SUPERADMIN),
    (0, audit_decorator_1.Audit)({ action: 'files_cleanup_cancelled', entityType: 'file' }),
    __param(0, (0, common_1.Body)('fileIds')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", void 0)
], FilesController.prototype, "cancelCleanup", null);
__decorate([
    (0, common_1.Delete)('admin/force-delete/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.SUPERADMIN),
    (0, audit_decorator_1.Audit)({ action: 'file_force_deleted', entityType: 'file' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FilesController.prototype, "forceDelete", null);
exports.FilesController = FilesController = __decorate([
    (0, common_1.Controller)('files'),
    __metadata("design:paramtypes", [files_service_1.FilesService])
], FilesController);
//# sourceMappingURL=files.controller.js.map
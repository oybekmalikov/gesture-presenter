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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const uuid_1 = require("uuid");
const users_service_1 = require("./users.service");
const register_dto_1 = require("../auth/dto/register.dto");
const query_user_dto_1 = require("./dto/query-user.dto");
const update_profile_dto_1 = require("./dto/update-profile.dto");
const bulk_import_user_dto_1 = require("./dto/bulk-import-user.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const audit_decorator_1 = require("../../common/decorators/audit.decorator");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const role_enum_1 = require("../../common/enums/role.enum");
const avatarStorage = (0, multer_1.diskStorage)({
    destination: (_req, _file, cb) => {
        const dir = path.resolve(process.cwd(), 'uploads', 'avatars');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase() || '.png';
        const uniqueName = `${(0, uuid_1.v4)()}${ext}`;
        cb(null, uniqueName);
    },
});
let UsersController = class UsersController {
    usersService;
    constructor(usersService) {
        this.usersService = usersService;
    }
    uploadAvatar(userId, file) {
        if (!file) {
            throw new common_1.BadRequestException('Rasm fayli yuborilmadi');
        }
        return this.usersService.uploadAvatar(userId, file);
    }
    deleteAvatar(userId) {
        return this.usersService.deleteAvatar(userId);
    }
    serveAvatar(filename, res) {
        const filePath = this.usersService.getAvatarFilePath(filename);
        if (!filePath) {
            throw new common_1.NotFoundException('Rasm topilmadi');
        }
        res.sendFile(filePath);
    }
    bulkImport(dto) {
        return this.usersService.bulkImport(dto);
    }
    getMyTeam(currentUser, query) {
        return this.usersService.getMyTeam(currentUser, query);
    }
    getMyProfile(userId) {
        return this.usersService.findOne(userId);
    }
    updateMyProfile(userId, dto) {
        return this.usersService.updateProfile(userId, dto);
    }
    create(dto) {
        return this.usersService.create(dto);
    }
    findAll(query) {
        return this.usersService.findAll(query);
    }
    findOne(id) {
        return this.usersService.findOne(id);
    }
    update(id, dto) {
        return this.usersService.update(id, dto);
    }
    remove(id) {
        return this.usersService.remove(id);
    }
    toggleActive(id) {
        return this.usersService.toggleActive(id);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Post)('profile/avatar'),
    (0, audit_decorator_1.Audit)({ action: 'avatar_uploaded', entityType: 'user' }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('avatar', {
        storage: avatarStorage,
        limits: {
            fileSize: 5 * 1024 * 1024,
        },
        fileFilter: (_req, file, cb) => {
            const allowedMimes = [
                'image/jpeg',
                'image/png',
                'image/webp',
                'image/jpg',
            ];
            if (allowedMimes.includes(file.mimetype.toLowerCase())) {
                cb(null, true);
            }
            else {
                cb(new common_1.BadRequestException('Faqat rasm formatidagi fayllar qabul qilinadi (.jpg, .png, .webp)'), false);
            }
        },
    })),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "uploadAvatar", null);
__decorate([
    (0, common_1.Delete)('profile/avatar'),
    (0, audit_decorator_1.Audit)({ action: 'avatar_deleted', entityType: 'user' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "deleteAvatar", null);
__decorate([
    (0, common_1.Get)('profile/avatar/file/:filename'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Param)('filename')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "serveAvatar", null);
__decorate([
    (0, common_1.Post)('bulk-import'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.SUPERADMIN),
    (0, audit_decorator_1.Audit)({ action: 'users_bulk_imported', entityType: 'user' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [bulk_import_user_dto_1.BulkImportUsersDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "bulkImport", null);
__decorate([
    (0, common_1.Get)('department/my-team'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.HEAD_DEPARTMENT, role_enum_1.Role.ADMIN, role_enum_1.Role.SUPERADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, query_user_dto_1.QueryUserDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getMyTeam", null);
__decorate([
    (0, common_1.Get)('profile/me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getMyProfile", null);
__decorate([
    (0, common_1.Patch)('profile/me'),
    (0, audit_decorator_1.Audit)({ action: 'profile_updated', entityType: 'user' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_profile_dto_1.UpdateProfileDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateMyProfile", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.SUPERADMIN),
    (0, audit_decorator_1.Audit)({ action: 'user_created', entityType: 'user' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_dto_1.RegisterDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.SUPERADMIN),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_user_dto_1.QueryUserDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.SUPERADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.SUPERADMIN),
    (0, audit_decorator_1.Audit)({ action: 'user_updated', entityType: 'user' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.SUPERADMIN),
    (0, audit_decorator_1.Audit)({ action: 'user_deleted', entityType: 'user' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "remove", null);
__decorate([
    (0, common_1.Patch)(':id/toggle-active'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.SUPERADMIN),
    (0, audit_decorator_1.Audit)({ action: 'user_status_toggled', entityType: 'user' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "toggleActive", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)('users'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map
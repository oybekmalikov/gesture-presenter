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
exports.FilesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const seminar_file_entity_1 = require("../../database/entities/seminar-file.entity");
const seminar_entity_1 = require("../../database/entities/seminar.entity");
const notifications_service_1 = require("../notifications/notifications.service");
const model_converter_service_1 = require("./model-converter.service");
const response_1 = require("../../common/response");
const role_enum_1 = require("../../common/enums/role.enum");
const enums_1 = require("../../common/enums");
const MAX_3D_SIZE = 100 * 1024 * 1024;
const MAX_DOC_SIZE = 50 * 1024 * 1024;
let FilesService = class FilesService {
    fileRepo;
    seminarRepo;
    notificationsService;
    modelConverter;
    uploadBase = path.resolve(process.cwd(), 'uploads');
    constructor(fileRepo, seminarRepo, notificationsService, modelConverter) {
        this.fileRepo = fileRepo;
        this.seminarRepo = seminarRepo;
        this.notificationsService = notificationsService;
        this.modelConverter = modelConverter;
        this.ensureDirectories();
    }
    ensureDirectories() {
        const dirs = ['pdf', 'glb', 'models', 'media', 'temp'];
        for (const d of dirs) {
            const full = path.join(this.uploadBase, d);
            if (!fs.existsSync(full)) {
                fs.mkdirSync(full, { recursive: true });
            }
        }
    }
    async uploadSeminarFile(seminarId, file, userId, userRole) {
        const seminar = await this.seminarRepo.findOne({
            where: { id: seminarId },
        });
        if (!seminar) {
            this.safeUnlink(file.path);
            return (0, response_1.errorResponse)(response_1.MESSAGES.SEMINAR_NOT_FOUND);
        }
        if (seminar.authorId !== userId &&
            userRole !== role_enum_1.Role.ADMIN &&
            userRole !== role_enum_1.Role.SUPERADMIN) {
            this.safeUnlink(file.path);
            return (0, response_1.errorResponse)(response_1.MESSAGES.FORBIDDEN);
        }
        const validation = this.validateFileSizeAndType(file);
        if (!validation.valid) {
            this.safeUnlink(file.path);
            return (0, response_1.errorResponse)(validation.error || response_1.MESSAGES.FILE_TOO_LARGE);
        }
        const currentCount = await this.fileRepo.count({ where: { seminarId } });
        const semFile = this.fileRepo.create({
            seminarId,
            originalName: file.originalname,
            storedName: file.filename,
            fileType: validation.fileType,
            mimeType: file.mimetype,
            size: file.size,
            storagePath: file.path,
            sortOrder: currentCount + 1,
        });
        const saved = await this.fileRepo.save(semFile);
        return (0, response_1.successResponse)(saved, response_1.MESSAGES.FILE_UPLOADED);
    }
    async uploadMultipleSeminarFiles(seminarId, files, userId, userRole) {
        const seminar = await this.seminarRepo.findOne({
            where: { id: seminarId },
        });
        if (!seminar) {
            files.forEach((f) => this.safeUnlink(f.path));
            return (0, response_1.errorResponse)(response_1.MESSAGES.SEMINAR_NOT_FOUND);
        }
        if (seminar.authorId !== userId &&
            userRole !== role_enum_1.Role.ADMIN &&
            userRole !== role_enum_1.Role.SUPERADMIN) {
            files.forEach((f) => this.safeUnlink(f.path));
            return (0, response_1.errorResponse)(response_1.MESSAGES.FORBIDDEN);
        }
        let currentOrder = await this.fileRepo.count({ where: { seminarId } });
        const savedFiles = [];
        const errors = [];
        for (const file of files) {
            const validation = this.validateFileSizeAndType(file);
            if (!validation.valid) {
                this.safeUnlink(file.path);
                errors.push({
                    filename: file.originalname,
                    reason: validation.error?.uz || 'Fayl hajmi yoki formati noto`g`ri',
                });
                continue;
            }
            currentOrder += 1;
            const semFile = this.fileRepo.create({
                seminarId,
                originalName: file.originalname,
                storedName: file.filename,
                fileType: validation.fileType,
                mimeType: file.mimetype,
                size: file.size,
                storagePath: file.path,
                sortOrder: currentOrder,
            });
            const saved = await this.fileRepo.save(semFile);
            savedFiles.push(saved);
        }
        return (0, response_1.successResponse)({
            total: files.length,
            successCount: savedFiles.length,
            failedCount: errors.length,
            uploadedFiles: savedFiles,
            errors,
        }, {
            uz: `${savedFiles.length} ta fayl muvaffaqiyatli yuklandi`,
            ru: `${savedFiles.length} файлов успешно загружено`,
        });
    }
    async findBySeminar(seminarId) {
        const files = await this.fileRepo.find({
            where: { seminarId },
            order: { sortOrder: 'ASC', createdAt: 'ASC' },
        });
        return (0, response_1.successResponse)(files, response_1.MESSAGES.FETCHED);
    }
    async findOne(id) {
        return this.fileRepo.findOne({
            where: { id },
            relations: { seminar: true },
        });
    }
    checkFilePermission(file, currentUser, action) {
        const seminar = file.seminar;
        if (!seminar)
            return true;
        if (seminar.fileAccess === enums_1.FileAccess.PUBLIC) {
            return true;
        }
        if (seminar.fileAccess === enums_1.FileAccess.READABLE) {
            if (action === 'view') {
                return true;
            }
            if (action === 'download') {
                if (currentUser &&
                    (currentUser.role === role_enum_1.Role.ADMIN ||
                        currentUser.role === role_enum_1.Role.SUPERADMIN ||
                        currentUser.id === seminar.authorId)) {
                    return true;
                }
                return false;
            }
        }
        if (seminar.fileAccess === enums_1.FileAccess.PRIVATE) {
            if (!currentUser)
                return false;
            if (currentUser.role === role_enum_1.Role.ADMIN ||
                currentUser.role === role_enum_1.Role.SUPERADMIN ||
                currentUser.id === seminar.authorId ||
                currentUser.id === seminar.targetUserId ||
                (currentUser.departmentId &&
                    currentUser.departmentId === seminar.departmentId)) {
                return true;
            }
            return false;
        }
        return true;
    }
    async remove(id, userId, userRole) {
        const file = await this.fileRepo.findOne({
            where: { id },
            relations: { seminar: true },
        });
        if (!file) {
            return (0, response_1.errorResponse)(response_1.MESSAGES.FILE_NOT_FOUND);
        }
        if (file.seminar?.authorId !== userId &&
            userRole !== role_enum_1.Role.ADMIN &&
            userRole !== role_enum_1.Role.SUPERADMIN) {
            return (0, response_1.errorResponse)(response_1.MESSAGES.FORBIDDEN);
        }
        this.safeUnlink(file.storagePath);
        await this.fileRepo.remove(file);
        return (0, response_1.successResponse)(null, response_1.MESSAGES.FILE_DELETED);
    }
    async markFilesForCleanup(dto, adminId) {
        if (!dto.fileIds || dto.fileIds.length === 0) {
            return (0, response_1.errorResponse)({
                uz: 'O`chirish uchun fayllar tanlanmadi',
                ru: 'Файлы для удаления не выбраны',
            });
        }
        const files = await this.fileRepo.find({
            where: { id: (0, typeorm_2.In)(dto.fileIds) },
            relations: { seminar: { author: true } },
        });
        if (files.length === 0) {
            return (0, response_1.errorResponse)(response_1.MESSAGES.NOT_FOUND);
        }
        const now = new Date();
        const scheduledDate = new Date(now.getTime() + dto.retentionDays * 24 * 3600 * 1000);
        for (const file of files) {
            file.markedForDeletionAt = now;
            file.deletionScheduledDate = scheduledDate;
            file.deletionReason =
                dto.reason ||
                    'Eski yoki kam foydalanilgan fayllar xotirani tejash maqsadida o`chirilishga qo`yildi';
            file.markedByUserId = adminId;
            await this.fileRepo.save(file);
            if (file.seminar?.authorId) {
                this.notificationsService.notifyFileDeleteWarning(file.seminar.authorId, file.originalName, file.seminar.title, dto.retentionDays).catch(() => { });
            }
        }
        return (0, response_1.successResponse)({
            count: files.length,
            scheduledDate,
            retentionDays: dto.retentionDays,
        }, {
            uz: `${files.length} ta fayl ${dto.retentionDays} kundan so'ng o'chirilishga belgilandi va egalari ogohlantirildi`,
            ru: `${files.length} файлов запланированы к удалению через ${dto.retentionDays} дн. Владельцы уведомлены.`,
        });
    }
    async cancelCleanup(fileIds) {
        if (!fileIds || fileIds.length === 0) {
            return (0, response_1.errorResponse)(response_1.MESSAGES.BAD_REQUEST);
        }
        await this.fileRepo.update({ id: (0, typeorm_2.In)(fileIds) }, {
            markedForDeletionAt: null,
            deletionScheduledDate: null,
            deletionReason: null,
            markedByUserId: null,
        });
        return (0, response_1.successResponse)(null, {
            uz: 'Fayllarni o`chirish bekor qilindi',
            ru: 'Удаление файлов отменено',
        });
    }
    async forceDelete(fileId) {
        const file = await this.fileRepo.findOne({ where: { id: fileId } });
        if (!file) {
            return (0, response_1.errorResponse)(response_1.MESSAGES.FILE_NOT_FOUND);
        }
        this.safeUnlink(file.storagePath);
        await this.fileRepo.remove(file);
        return (0, response_1.successResponse)(null, response_1.MESSAGES.FILE_DELETED);
    }
    async getPendingCleanupFiles() {
        const files = await this.fileRepo.find({
            where: {
                deletionScheduledDate: (0, typeorm_2.Not)((0, typeorm_2.IsNull)()),
            },
            relations: { seminar: { author: true } },
            order: { deletionScheduledDate: 'ASC' },
        });
        const now = new Date().getTime();
        const result = files.map((f) => {
            const remainingMs = new Date(f.deletionScheduledDate).getTime() - now;
            const remainingDays = Math.max(0, Math.ceil(remainingMs / (24 * 3600 * 1000)));
            return {
                ...f,
                remainingDays,
            };
        });
        return (0, response_1.successResponse)(result, response_1.MESSAGES.FETCHED);
    }
    async getAdminCleanupCandidates() {
        const files = await this.fileRepo
            .createQueryBuilder('file')
            .leftJoinAndSelect('file.seminar', 'seminar')
            .leftJoinAndSelect('seminar.author', 'author')
            .where('file.deletionScheduledDate IS NULL')
            .orderBy('file.createdAt', 'ASC')
            .take(100)
            .getMany();
        return (0, response_1.successResponse)(files, response_1.MESSAGES.FETCHED);
    }
    async inspect3DModel(fileId) {
        const file = await this.fileRepo.findOne({ where: { id: fileId } });
        if (!file || !fs.existsSync(file.storagePath)) {
            return (0, response_1.errorResponse)(response_1.MESSAGES.FILE_NOT_FOUND);
        }
        if (!this.modelConverter) {
            return (0, response_1.successResponse)(null, response_1.MESSAGES.FETCHED);
        }
        const metadata = await this.modelConverter.inspect3DModel(file.storagePath);
        return (0, response_1.successResponse)(metadata, response_1.MESSAGES.FETCHED);
    }
    validateFileSizeAndType(file) {
        const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
        const is3D = ['step', 'stp', 'glb', 'gltf'].includes(ext);
        let fileType = 'other';
        if (['pdf'].includes(ext))
            fileType = 'pdf';
        else if (is3D)
            fileType = '3d';
        else if (['pptx', 'ppt'].includes(ext))
            fileType = 'presentation';
        else if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext))
            fileType = 'image';
        else if (['mp4', 'webm', 'mkv', 'mov'].includes(ext))
            fileType = 'video';
        const maxSize = is3D ? MAX_3D_SIZE : MAX_DOC_SIZE;
        if (file.size > maxSize) {
            return {
                valid: false,
                fileType,
                error: {
                    uz: is3D
                        ? '3D obyekt fayli 100 MB dan oshmasligi kerak'
                        : 'Fayl hajmi 50 MB dan oshmasligi kerak',
                    ru: is3D
                        ? 'Размер 3D файла не должен превышать 100 МБ'
                        : 'Размер файла не должен превышать 50 МБ',
                },
            };
        }
        return { valid: true, fileType };
    }
    safeUnlink(filePath) {
        if (filePath && fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
            }
            catch {
            }
        }
    }
};
exports.FilesService = FilesService;
exports.FilesService = FilesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(seminar_file_entity_1.SeminarFile)),
    __param(1, (0, typeorm_1.InjectRepository)(seminar_entity_1.Seminar)),
    __param(3, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        notifications_service_1.NotificationsService,
        model_converter_service_1.ModelConverterService])
], FilesService);
//# sourceMappingURL=files.service.js.map
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
var FileCleanupSchedulerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileCleanupSchedulerService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const fs = __importStar(require("fs"));
const seminar_file_entity_1 = require("../../database/entities/seminar-file.entity");
let FileCleanupSchedulerService = FileCleanupSchedulerService_1 = class FileCleanupSchedulerService {
    fileRepo;
    logger = new common_1.Logger(FileCleanupSchedulerService_1.name);
    constructor(fileRepo) {
        this.fileRepo = fileRepo;
    }
    async purgeExpiredFiles() {
        try {
            const now = new Date();
            const expiredFiles = await this.fileRepo.find({
                where: {
                    deletionScheduledDate: (0, typeorm_2.LessThanOrEqual)(now),
                },
                relations: { seminar: true },
            });
            if (expiredFiles.length === 0) {
                return;
            }
            this.logger.log(`🗑️ Topilgan ${expiredFiles.length} ta muddati o'tgan faylni o'chirish boshlandi`);
            let purgedCount = 0;
            for (const file of expiredFiles) {
                if (file.storagePath && fs.existsSync(file.storagePath)) {
                    try {
                        fs.unlinkSync(file.storagePath);
                    }
                    catch (err) {
                        this.logger.warn(`Diskdan faylni o'chirishda xatolik: ${file.storagePath} - ${err.message}`);
                    }
                }
                await this.fileRepo.remove(file);
                purgedCount++;
            }
            this.logger.log(`✅ ${purgedCount} ta muddati tugagan fayl diskdan va bazadan muvaffaqiyatli tozalandi`);
        }
        catch (err) {
            this.logger.error(`Fayllarni tozalash schedulerida xatolik: ${err.message}`, err.stack);
        }
    }
    async runManualCleanupCycle() {
        const now = new Date();
        const expiredFiles = await this.fileRepo.find({
            where: {
                deletionScheduledDate: (0, typeorm_2.LessThanOrEqual)(now),
            },
        });
        const filesPurged = [];
        for (const file of expiredFiles) {
            if (file.storagePath && fs.existsSync(file.storagePath)) {
                try {
                    fs.unlinkSync(file.storagePath);
                }
                catch { }
            }
            filesPurged.push(file.originalName);
            await this.fileRepo.remove(file);
        }
        return {
            purgedCount: filesPurged.length,
            filesPurged,
        };
    }
};
exports.FileCleanupSchedulerService = FileCleanupSchedulerService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_MIDNIGHT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FileCleanupSchedulerService.prototype, "purgeExpiredFiles", null);
exports.FileCleanupSchedulerService = FileCleanupSchedulerService = FileCleanupSchedulerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(seminar_file_entity_1.SeminarFile)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], FileCleanupSchedulerService);
//# sourceMappingURL=file-cleanup-scheduler.service.js.map
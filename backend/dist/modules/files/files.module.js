"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const files_service_1 = require("./files.service");
const files_controller_1 = require("./files.controller");
const file_cleanup_scheduler_service_1 = require("./file-cleanup-scheduler.service");
const model_converter_service_1 = require("./model-converter.service");
const seminar_file_entity_1 = require("../../database/entities/seminar-file.entity");
const seminar_entity_1 = require("../../database/entities/seminar.entity");
const notifications_module_1 = require("../notifications/notifications.module");
let FilesModule = class FilesModule {
};
exports.FilesModule = FilesModule;
exports.FilesModule = FilesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([seminar_file_entity_1.SeminarFile, seminar_entity_1.Seminar]),
            notifications_module_1.NotificationsModule,
        ],
        controllers: [files_controller_1.FilesController],
        providers: [
            files_service_1.FilesService,
            file_cleanup_scheduler_service_1.FileCleanupSchedulerService,
            model_converter_service_1.ModelConverterService,
        ],
        exports: [files_service_1.FilesService, model_converter_service_1.ModelConverterService],
    })
], FilesModule);
//# sourceMappingURL=files.module.js.map
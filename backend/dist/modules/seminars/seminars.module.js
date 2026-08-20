"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeminarsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const seminars_service_1 = require("./seminars.service");
const seminars_controller_1 = require("./seminars.controller");
const seminar_entity_1 = require("../../database/entities/seminar.entity");
const seminar_file_entity_1 = require("../../database/entities/seminar-file.entity");
const tag_entity_1 = require("../../database/entities/tag.entity");
const like_entity_1 = require("../../database/entities/like.entity");
const comment_entity_1 = require("../../database/entities/comment.entity");
const saved_seminar_entity_1 = require("../../database/entities/saved-seminar.entity");
const seminar_view_log_entity_1 = require("../../database/entities/seminar-view-log.entity");
let SeminarsModule = class SeminarsModule {
};
exports.SeminarsModule = SeminarsModule;
exports.SeminarsModule = SeminarsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                seminar_entity_1.Seminar,
                seminar_file_entity_1.SeminarFile,
                tag_entity_1.Tag,
                like_entity_1.Like,
                comment_entity_1.Comment,
                saved_seminar_entity_1.SavedSeminar,
                seminar_view_log_entity_1.SeminarViewLog,
            ]),
        ],
        controllers: [seminars_controller_1.SeminarsController],
        providers: [seminars_service_1.SeminarsService],
        exports: [seminars_service_1.SeminarsService],
    })
], SeminarsModule);
//# sourceMappingURL=seminars.module.js.map
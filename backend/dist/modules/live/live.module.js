"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const live_service_1 = require("./live.service");
const live_controller_1 = require("./live.controller");
const live_gateway_1 = require("./live.gateway");
const live_session_entity_1 = require("../../database/entities/live-session.entity");
const seminar_entity_1 = require("../../database/entities/seminar.entity");
const recording_entity_1 = require("../../database/entities/recording.entity");
const comment_entity_1 = require("../../database/entities/comment.entity");
const user_entity_1 = require("../../database/entities/user.entity");
const saved_seminar_entity_1 = require("../../database/entities/saved-seminar.entity");
const notifications_module_1 = require("../notifications/notifications.module");
let LiveModule = class LiveModule {
};
exports.LiveModule = LiveModule;
exports.LiveModule = LiveModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                live_session_entity_1.LiveSession,
                seminar_entity_1.Seminar,
                recording_entity_1.Recording,
                comment_entity_1.Comment,
                user_entity_1.User,
                saved_seminar_entity_1.SavedSeminar,
            ]),
            notifications_module_1.NotificationsModule,
        ],
        controllers: [live_controller_1.LiveController],
        providers: [live_service_1.LiveService, live_gateway_1.LiveGateway],
        exports: [live_service_1.LiveService, live_gateway_1.LiveGateway],
    })
], LiveModule);
//# sourceMappingURL=live.module.js.map
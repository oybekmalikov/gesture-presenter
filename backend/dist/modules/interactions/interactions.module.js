"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InteractionsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const interactions_service_1 = require("./interactions.service");
const interactions_controller_1 = require("./interactions.controller");
const like_entity_1 = require("../../database/entities/like.entity");
const comment_entity_1 = require("../../database/entities/comment.entity");
const saved_seminar_entity_1 = require("../../database/entities/saved-seminar.entity");
const seminar_entity_1 = require("../../database/entities/seminar.entity");
const user_entity_1 = require("../../database/entities/user.entity");
const notifications_module_1 = require("../notifications/notifications.module");
let InteractionsModule = class InteractionsModule {
};
exports.InteractionsModule = InteractionsModule;
exports.InteractionsModule = InteractionsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([like_entity_1.Like, comment_entity_1.Comment, saved_seminar_entity_1.SavedSeminar, seminar_entity_1.Seminar, user_entity_1.User]),
            notifications_module_1.NotificationsModule,
        ],
        controllers: [interactions_controller_1.InteractionsController],
        providers: [interactions_service_1.InteractionsService],
        exports: [interactions_service_1.InteractionsService],
    })
], InteractionsModule);
//# sourceMappingURL=interactions.module.js.map
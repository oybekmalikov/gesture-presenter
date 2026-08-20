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
exports.AiController = void 0;
const common_1 = require("@nestjs/common");
const ai_service_1 = require("./ai.service");
const generate_outline_dto_1 = require("./dto/generate-outline.dto");
const generate_slides_dto_1 = require("./dto/generate-slides.dto");
const generate_meta_dto_1 = require("./dto/generate-meta.dto");
const ai_chat_dto_1 = require("./dto/ai-chat.dto");
const optional_jwt_auth_guard_1 = require("../../common/guards/optional-jwt-auth.guard");
let AiController = class AiController {
    aiService;
    constructor(aiService) {
        this.aiService = aiService;
    }
    getTemplates() {
        return this.aiService.getTemplates();
    }
    generateOutline(dto) {
        return this.aiService.generateOutline(dto);
    }
    generateSlides(dto) {
        return this.aiService.generateSlides(dto);
    }
    generateMeta(dto) {
        return this.aiService.generateMeta(dto);
    }
    askAssistant(dto) {
        return this.aiService.askAssistant(dto);
    }
};
exports.AiController = AiController;
__decorate([
    (0, common_1.Get)('templates'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AiController.prototype, "getTemplates", null);
__decorate([
    (0, common_1.Post)('outline'),
    (0, common_1.UseGuards)(optional_jwt_auth_guard_1.OptionalJwtAuthGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generate_outline_dto_1.GenerateOutlineDto]),
    __metadata("design:returntype", void 0)
], AiController.prototype, "generateOutline", null);
__decorate([
    (0, common_1.Post)('slides'),
    (0, common_1.UseGuards)(optional_jwt_auth_guard_1.OptionalJwtAuthGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generate_slides_dto_1.GenerateSlidesDto]),
    __metadata("design:returntype", void 0)
], AiController.prototype, "generateSlides", null);
__decorate([
    (0, common_1.Post)('meta'),
    (0, common_1.UseGuards)(optional_jwt_auth_guard_1.OptionalJwtAuthGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generate_meta_dto_1.GenerateMetaDto]),
    __metadata("design:returntype", void 0)
], AiController.prototype, "generateMeta", null);
__decorate([
    (0, common_1.Post)('chat'),
    (0, common_1.UseGuards)(optional_jwt_auth_guard_1.OptionalJwtAuthGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ai_chat_dto_1.AiChatDto]),
    __metadata("design:returntype", void 0)
], AiController.prototype, "askAssistant", null);
exports.AiController = AiController = __decorate([
    (0, common_1.Controller)('ai'),
    __metadata("design:paramtypes", [ai_service_1.AiService])
], AiController);
//# sourceMappingURL=ai.controller.js.map
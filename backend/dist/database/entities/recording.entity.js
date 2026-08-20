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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Recording = void 0;
const typeorm_1 = require("typeorm");
const live_session_entity_1 = require("./live-session.entity");
let Recording = class Recording {
    id;
    liveSessionId;
    liveSession;
    filePath;
    size;
    durationSeconds;
    createdAt;
};
exports.Recording = Recording;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Recording.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Recording.prototype, "liveSessionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => live_session_entity_1.LiveSession, (ls) => ls.recordings, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'liveSessionId' }),
    __metadata("design:type", live_session_entity_1.LiveSession)
], Recording.prototype, "liveSession", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Recording.prototype, "filePath", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], Recording.prototype, "size", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Recording.prototype, "durationSeconds", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Recording.prototype, "createdAt", void 0);
exports.Recording = Recording = __decorate([
    (0, typeorm_1.Entity)('recordings')
], Recording);
//# sourceMappingURL=recording.entity.js.map
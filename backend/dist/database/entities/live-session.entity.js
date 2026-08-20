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
exports.LiveSession = void 0;
const typeorm_1 = require("typeorm");
const enums_1 = require("../../common/enums");
const seminar_entity_1 = require("./seminar.entity");
let LiveSession = class LiveSession {
    id;
    seminarId;
    seminar;
    roomId;
    status;
    participantCount;
    peakViewerCount;
    currentFileId;
    currentSlideIndex;
    startedAt;
    endedAt;
    createdAt;
    recordings;
};
exports.LiveSession = LiveSession;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], LiveSession.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], LiveSession.prototype, "seminarId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => seminar_entity_1.Seminar, (s) => s.liveSessions, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'seminarId' }),
    __metadata("design:type", seminar_entity_1.Seminar)
], LiveSession.prototype, "seminar", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, unique: true }),
    __metadata("design:type", String)
], LiveSession.prototype, "roomId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: enums_1.LiveSessionStatus,
        default: enums_1.LiveSessionStatus.WAITING,
    }),
    __metadata("design:type", String)
], LiveSession.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], LiveSession.prototype, "participantCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], LiveSession.prototype, "peakViewerCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], LiveSession.prototype, "currentFileId", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], LiveSession.prototype, "currentSlideIndex", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], LiveSession.prototype, "startedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], LiveSession.prototype, "endedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], LiveSession.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('Recording', 'liveSession'),
    __metadata("design:type", Array)
], LiveSession.prototype, "recordings", void 0);
exports.LiveSession = LiveSession = __decorate([
    (0, typeorm_1.Entity)('live_sessions')
], LiveSession);
//# sourceMappingURL=live-session.entity.js.map
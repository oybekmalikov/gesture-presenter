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
exports.SeminarViewLog = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const seminar_entity_1 = require("./seminar.entity");
let SeminarViewLog = class SeminarViewLog {
    id;
    seminarId;
    seminar;
    userId;
    user;
    ipAddress;
    userAgent;
    viewedAt;
};
exports.SeminarViewLog = SeminarViewLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SeminarViewLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SeminarViewLog.prototype, "seminarId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => seminar_entity_1.Seminar, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'seminarId' }),
    __metadata("design:type", seminar_entity_1.Seminar)
], SeminarViewLog.prototype, "seminar", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], SeminarViewLog.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", user_entity_1.User)
], SeminarViewLog.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], SeminarViewLog.prototype, "ipAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], SeminarViewLog.prototype, "userAgent", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], SeminarViewLog.prototype, "viewedAt", void 0);
exports.SeminarViewLog = SeminarViewLog = __decorate([
    (0, typeorm_1.Entity)('seminar_view_logs')
], SeminarViewLog);
//# sourceMappingURL=seminar-view-log.entity.js.map
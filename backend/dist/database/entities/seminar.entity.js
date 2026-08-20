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
exports.Seminar = void 0;
const typeorm_1 = require("typeorm");
const enums_1 = require("../../common/enums");
const user_entity_1 = require("./user.entity");
const department_entity_1 = require("./department.entity");
const tag_entity_1 = require("./tag.entity");
let Seminar = class Seminar {
    id;
    title;
    description;
    coverImageUrl;
    authorId;
    author;
    targetUserId;
    targetUser;
    departmentId;
    department;
    status;
    fileAccess;
    scheduledAt;
    startedAt;
    endedAt;
    isLive;
    isRecorded;
    viewCount;
    createdAt;
    updatedAt;
    files;
    tags;
    likes;
    comments;
    savedBy;
    liveSessions;
};
exports.Seminar = Seminar;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Seminar.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500 }),
    __metadata("design:type", String)
], Seminar.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Seminar.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Seminar.prototype, "coverImageUrl", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Seminar.prototype, "authorId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (u) => u.seminars, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'authorId' }),
    __metadata("design:type", user_entity_1.User)
], Seminar.prototype, "author", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Seminar.prototype, "targetUserId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'targetUserId' }),
    __metadata("design:type", user_entity_1.User)
], Seminar.prototype, "targetUser", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Seminar.prototype, "departmentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => department_entity_1.Department, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'departmentId' }),
    __metadata("design:type", department_entity_1.Department)
], Seminar.prototype, "department", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: enums_1.SeminarStatus, default: enums_1.SeminarStatus.DRAFT }),
    __metadata("design:type", String)
], Seminar.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: enums_1.FileAccess, default: enums_1.FileAccess.PUBLIC }),
    __metadata("design:type", String)
], Seminar.prototype, "fileAccess", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Seminar.prototype, "scheduledAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Seminar.prototype, "startedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Seminar.prototype, "endedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Seminar.prototype, "isLive", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Seminar.prototype, "isRecorded", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Seminar.prototype, "viewCount", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Seminar.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Seminar.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('SeminarFile', 'seminar'),
    __metadata("design:type", Array)
], Seminar.prototype, "files", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => tag_entity_1.Tag, (tag) => tag.seminars, { cascade: true }),
    (0, typeorm_1.JoinTable)({
        name: 'seminar_tags',
        joinColumn: { name: 'seminarId', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'tagId', referencedColumnName: 'id' },
    }),
    __metadata("design:type", Array)
], Seminar.prototype, "tags", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('Like', 'seminar'),
    __metadata("design:type", Array)
], Seminar.prototype, "likes", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('Comment', 'seminar'),
    __metadata("design:type", Array)
], Seminar.prototype, "comments", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('SavedSeminar', 'seminar'),
    __metadata("design:type", Array)
], Seminar.prototype, "savedBy", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('LiveSession', 'seminar'),
    __metadata("design:type", Array)
], Seminar.prototype, "liveSessions", void 0);
exports.Seminar = Seminar = __decorate([
    (0, typeorm_1.Entity)('seminars')
], Seminar);
//# sourceMappingURL=seminar.entity.js.map
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
exports.SeminarFile = void 0;
const typeorm_1 = require("typeorm");
const seminar_entity_1 = require("./seminar.entity");
let SeminarFile = class SeminarFile {
    id;
    seminarId;
    seminar;
    originalName;
    storedName;
    fileType;
    mimeType;
    size;
    storagePath;
    convertedFrom;
    sortOrder;
    markedForDeletionAt;
    deletionScheduledDate;
    deletionReason;
    markedByUserId;
    createdAt;
};
exports.SeminarFile = SeminarFile;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SeminarFile.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SeminarFile.prototype, "seminarId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => seminar_entity_1.Seminar, (s) => s.files, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'seminarId' }),
    __metadata("design:type", seminar_entity_1.Seminar)
], SeminarFile.prototype, "seminar", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500 }),
    __metadata("design:type", String)
], SeminarFile.prototype, "originalName", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500 }),
    __metadata("design:type", String)
], SeminarFile.prototype, "storedName", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], SeminarFile.prototype, "fileType", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], SeminarFile.prototype, "mimeType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint' }),
    __metadata("design:type", Number)
], SeminarFile.prototype, "size", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], SeminarFile.prototype, "storagePath", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, nullable: true }),
    __metadata("design:type", String)
], SeminarFile.prototype, "convertedFrom", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], SeminarFile.prototype, "sortOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], SeminarFile.prototype, "markedForDeletionAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], SeminarFile.prototype, "deletionScheduledDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500, nullable: true }),
    __metadata("design:type", String)
], SeminarFile.prototype, "deletionReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], SeminarFile.prototype, "markedByUserId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], SeminarFile.prototype, "createdAt", void 0);
exports.SeminarFile = SeminarFile = __decorate([
    (0, typeorm_1.Entity)('seminar_files')
], SeminarFile);
//# sourceMappingURL=seminar-file.entity.js.map
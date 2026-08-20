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
exports.QuerySeminarDto = exports.SeminarSortBy = exports.SeminarTabType = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const enums_1 = require("../../../common/enums");
var SeminarTabType;
(function (SeminarTabType) {
    SeminarTabType["ALL"] = "all";
    SeminarTabType["SCHEDULED"] = "scheduled";
    SeminarTabType["LIVE"] = "live";
    SeminarTabType["COMPLETED"] = "completed";
    SeminarTabType["MY"] = "my";
    SeminarTabType["DEPARTMENT"] = "department";
})(SeminarTabType || (exports.SeminarTabType = SeminarTabType = {}));
var SeminarSortBy;
(function (SeminarSortBy) {
    SeminarSortBy["LATEST"] = "latest";
    SeminarSortBy["POPULAR"] = "popular";
    SeminarSortBy["VIEWS"] = "views";
})(SeminarSortBy || (exports.SeminarSortBy = SeminarSortBy = {}));
class QuerySeminarDto {
    tab = SeminarTabType.ALL;
    search;
    tag;
    departmentId;
    status;
    fileAccess;
    sortBy = SeminarSortBy.LATEST;
    page = 1;
    limit = 12;
}
exports.QuerySeminarDto = QuerySeminarDto;
__decorate([
    (0, class_validator_1.IsEnum)(SeminarTabType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QuerySeminarDto.prototype, "tab", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QuerySeminarDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QuerySeminarDto.prototype, "tag", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QuerySeminarDto.prototype, "departmentId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(enums_1.SeminarStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QuerySeminarDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(enums_1.FileAccess),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QuerySeminarDto.prototype, "fileAccess", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(SeminarSortBy),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QuerySeminarDto.prototype, "sortBy", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], QuerySeminarDto.prototype, "page", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], QuerySeminarDto.prototype, "limit", void 0);
//# sourceMappingURL=query-seminar.dto.js.map
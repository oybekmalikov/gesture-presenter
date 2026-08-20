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
exports.BulkImportUsersDto = exports.BulkImportUserItemDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const role_enum_1 = require("../../../common/enums/role.enum");
const enums_1 = require("../../../common/enums");
class BulkImportUserItemDto {
    fio;
    username;
    password;
    role;
    gender;
    lavozim;
    departmentCodeOrId;
    subDepartmentCodeOrId;
    positionCodeOrId;
    email;
    phone;
}
exports.BulkImportUserItemDto = BulkImportUserItemDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], BulkImportUserItemDto.prototype, "fio", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], BulkImportUserItemDto.prototype, "username", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], BulkImportUserItemDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(role_enum_1.Role),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], BulkImportUserItemDto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(enums_1.Gender),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], BulkImportUserItemDto.prototype, "gender", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], BulkImportUserItemDto.prototype, "lavozim", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], BulkImportUserItemDto.prototype, "departmentCodeOrId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], BulkImportUserItemDto.prototype, "subDepartmentCodeOrId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], BulkImportUserItemDto.prototype, "positionCodeOrId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], BulkImportUserItemDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], BulkImportUserItemDto.prototype, "phone", void 0);
class BulkImportUsersDto {
    users;
}
exports.BulkImportUsersDto = BulkImportUsersDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => BulkImportUserItemDto),
    __metadata("design:type", Array)
], BulkImportUsersDto.prototype, "users", void 0);
//# sourceMappingURL=bulk-import-user.dto.js.map
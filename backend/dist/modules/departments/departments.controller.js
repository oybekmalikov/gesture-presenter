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
exports.DepartmentsController = void 0;
const common_1 = require("@nestjs/common");
const departments_service_1 = require("./departments.service");
const create_department_dto_1 = require("./dto/create-department.dto");
const create_sub_department_dto_1 = require("./dto/create-sub-department.dto");
const create_position_dto_1 = require("./dto/create-position.dto");
const set_department_head_dto_1 = require("./dto/set-department-head.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const role_enum_1 = require("../../common/enums/role.enum");
let DepartmentsController = class DepartmentsController {
    departmentsService;
    constructor(departmentsService) {
        this.departmentsService = departmentsService;
    }
    getOrgTree() {
        return this.departmentsService.getOrgTree();
    }
    findAllDepartments() {
        return this.departmentsService.findAllDepartments();
    }
    getDepartmentStats(id) {
        return this.departmentsService.getDepartmentStats(id);
    }
    findOneDepartment(id) {
        return this.departmentsService.findOneDepartment(id);
    }
    createDepartment(dto) {
        return this.departmentsService.createDepartment(dto);
    }
    updateDepartment(id, dto) {
        return this.departmentsService.updateDepartment(id, dto);
    }
    setDepartmentHead(id, dto) {
        return this.departmentsService.setDepartmentHead(id, dto.userId);
    }
    removeDepartment(id) {
        return this.departmentsService.removeDepartment(id);
    }
    findAllSubDepartments(departmentId) {
        return this.departmentsService.findAllSubDepartments(departmentId);
    }
    createSubDepartment(dto) {
        return this.departmentsService.createSubDepartment(dto);
    }
    updateSubDepartment(id, dto) {
        return this.departmentsService.updateSubDepartment(id, dto);
    }
    removeSubDepartment(id) {
        return this.departmentsService.removeSubDepartment(id);
    }
    findAllPositions() {
        return this.departmentsService.findAllPositions();
    }
    createPosition(dto) {
        return this.departmentsService.createPosition(dto);
    }
    updatePosition(id, dto) {
        return this.departmentsService.updatePosition(id, dto);
    }
    removePosition(id) {
        return this.departmentsService.removePosition(id);
    }
};
exports.DepartmentsController = DepartmentsController;
__decorate([
    (0, common_1.Get)('tree'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DepartmentsController.prototype, "getOrgTree", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DepartmentsController.prototype, "findAllDepartments", null);
__decorate([
    (0, common_1.Get)(':id/stats'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DepartmentsController.prototype, "getDepartmentStats", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DepartmentsController.prototype, "findOneDepartment", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_department_dto_1.CreateDepartmentDto]),
    __metadata("design:returntype", void 0)
], DepartmentsController.prototype, "createDepartment", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DepartmentsController.prototype, "updateDepartment", null);
__decorate([
    (0, common_1.Patch)(':id/head'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, set_department_head_dto_1.SetDepartmentHeadDto]),
    __metadata("design:returntype", void 0)
], DepartmentsController.prototype, "setDepartmentHead", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DepartmentsController.prototype, "removeDepartment", null);
__decorate([
    (0, common_1.Get)('sub/list'),
    __param(0, (0, common_1.Query)('departmentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DepartmentsController.prototype, "findAllSubDepartments", null);
__decorate([
    (0, common_1.Post)('sub'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_sub_department_dto_1.CreateSubDepartmentDto]),
    __metadata("design:returntype", void 0)
], DepartmentsController.prototype, "createSubDepartment", null);
__decorate([
    (0, common_1.Put)('sub/:id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DepartmentsController.prototype, "updateSubDepartment", null);
__decorate([
    (0, common_1.Delete)('sub/:id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DepartmentsController.prototype, "removeSubDepartment", null);
__decorate([
    (0, common_1.Get)('positions/list'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DepartmentsController.prototype, "findAllPositions", null);
__decorate([
    (0, common_1.Post)('positions'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_position_dto_1.CreatePositionDto]),
    __metadata("design:returntype", void 0)
], DepartmentsController.prototype, "createPosition", null);
__decorate([
    (0, common_1.Put)('positions/:id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DepartmentsController.prototype, "updatePosition", null);
__decorate([
    (0, common_1.Delete)('positions/:id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DepartmentsController.prototype, "removePosition", null);
exports.DepartmentsController = DepartmentsController = __decorate([
    (0, common_1.Controller)('departments'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [departments_service_1.DepartmentsService])
], DepartmentsController);
//# sourceMappingURL=departments.controller.js.map
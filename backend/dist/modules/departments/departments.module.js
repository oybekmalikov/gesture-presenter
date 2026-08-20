"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepartmentsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const departments_service_1 = require("./departments.service");
const departments_controller_1 = require("./departments.controller");
const department_entity_1 = require("../../database/entities/department.entity");
const sub_department_entity_1 = require("../../database/entities/sub-department.entity");
const position_entity_1 = require("../../database/entities/position.entity");
const user_entity_1 = require("../../database/entities/user.entity");
const seminar_entity_1 = require("../../database/entities/seminar.entity");
let DepartmentsModule = class DepartmentsModule {
};
exports.DepartmentsModule = DepartmentsModule;
exports.DepartmentsModule = DepartmentsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                department_entity_1.Department,
                sub_department_entity_1.SubDepartment,
                position_entity_1.Position,
                user_entity_1.User,
                seminar_entity_1.Seminar,
            ]),
        ],
        controllers: [departments_controller_1.DepartmentsController],
        providers: [departments_service_1.DepartmentsService],
        exports: [departments_service_1.DepartmentsService],
    })
], DepartmentsModule);
//# sourceMappingURL=departments.module.js.map
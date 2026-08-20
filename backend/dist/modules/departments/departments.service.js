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
exports.DepartmentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const department_entity_1 = require("../../database/entities/department.entity");
const sub_department_entity_1 = require("../../database/entities/sub-department.entity");
const position_entity_1 = require("../../database/entities/position.entity");
const user_entity_1 = require("../../database/entities/user.entity");
const seminar_entity_1 = require("../../database/entities/seminar.entity");
const response_1 = require("../../common/response");
const role_enum_1 = require("../../common/enums/role.enum");
let DepartmentsService = class DepartmentsService {
    departmentRepo;
    subDepartmentRepo;
    positionRepo;
    userRepo;
    seminarRepo;
    constructor(departmentRepo, subDepartmentRepo, positionRepo, userRepo, seminarRepo) {
        this.departmentRepo = departmentRepo;
        this.subDepartmentRepo = subDepartmentRepo;
        this.positionRepo = positionRepo;
        this.userRepo = userRepo;
        this.seminarRepo = seminarRepo;
    }
    async findAllDepartments() {
        const departments = await this.departmentRepo.find({
            relations: {
                headUser: true,
                subDepartments: true,
            },
            order: { name: 'ASC' },
        });
        return (0, response_1.successResponse)(departments, response_1.MESSAGES.FETCHED);
    }
    async findOneDepartment(id) {
        const department = await this.departmentRepo.findOne({
            where: { id },
            relations: {
                headUser: true,
                subDepartments: true,
            },
        });
        if (!department) {
            return (0, response_1.errorResponse)(response_1.MESSAGES.DEPARTMENT_NOT_FOUND);
        }
        return (0, response_1.successResponse)(department, response_1.MESSAGES.FETCHED);
    }
    async createDepartment(dto) {
        const existing = await this.departmentRepo.findOne({
            where: { code: dto.code },
        });
        if (existing) {
            return (0, response_1.errorResponse)({
                uz: "Bu kodli bo'lim allaqachon mavjud",
                ru: 'Отдел с таким кодом уже существует',
            });
        }
        const dep = this.departmentRepo.create(dto);
        const saved = await this.departmentRepo.save(dep);
        return (0, response_1.successResponse)(saved, response_1.MESSAGES.DEPARTMENT_CREATED);
    }
    async updateDepartment(id, dto) {
        const dep = await this.departmentRepo.findOne({ where: { id } });
        if (!dep) {
            return (0, response_1.errorResponse)(response_1.MESSAGES.DEPARTMENT_NOT_FOUND);
        }
        Object.assign(dep, dto);
        const saved = await this.departmentRepo.save(dep);
        return (0, response_1.successResponse)(saved, response_1.MESSAGES.UPDATED);
    }
    async removeDepartment(id) {
        const dep = await this.departmentRepo.findOne({ where: { id } });
        if (!dep) {
            return (0, response_1.errorResponse)(response_1.MESSAGES.DEPARTMENT_NOT_FOUND);
        }
        await this.departmentRepo.remove(dep);
        return (0, response_1.successResponse)(null, response_1.MESSAGES.DELETED);
    }
    async setDepartmentHead(departmentId, userId) {
        const dep = await this.departmentRepo.findOne({
            where: { id: departmentId },
        });
        if (!dep) {
            return (0, response_1.errorResponse)(response_1.MESSAGES.DEPARTMENT_NOT_FOUND);
        }
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) {
            return (0, response_1.errorResponse)(response_1.MESSAGES.USER_NOT_FOUND);
        }
        dep.headUserId = user.id;
        await this.departmentRepo.save(dep);
        if (user.role === role_enum_1.Role.USER) {
            user.role = role_enum_1.Role.HEAD_DEPARTMENT;
        }
        user.departmentId = dep.id;
        await this.userRepo.save(user);
        const updated = await this.departmentRepo.findOne({
            where: { id: departmentId },
            relations: { headUser: true, subDepartments: true },
        });
        return (0, response_1.successResponse)(updated, {
            uz: "Bo'lim boshlig'i muvaffaqiyatli tayinlandi",
            ru: 'Руководитель отдела успешно назначен',
        });
    }
    async getDepartmentStats(id) {
        const department = await this.departmentRepo.findOne({
            where: { id },
            relations: { headUser: true, subDepartments: true },
        });
        if (!department) {
            return (0, response_1.errorResponse)(response_1.MESSAGES.DEPARTMENT_NOT_FOUND);
        }
        const [activeUsersCount, seminarsCount] = await Promise.all([
            this.userRepo.count({
                where: { departmentId: id, isActive: true },
            }),
            this.seminarRepo.count({
                where: { departmentId: id },
            }),
        ]);
        const stats = {
            department,
            activeUsersCount,
            subDepartmentsCount: department.subDepartments?.length || 0,
            seminarsCount,
        };
        return (0, response_1.successResponse)(stats, response_1.MESSAGES.FETCHED);
    }
    async findAllSubDepartments(departmentId) {
        const where = departmentId ? { departmentId } : {};
        const subs = await this.subDepartmentRepo.find({
            where,
            relations: { department: true },
            order: { name: 'ASC' },
        });
        return (0, response_1.successResponse)(subs, response_1.MESSAGES.FETCHED);
    }
    async createSubDepartment(dto) {
        const dep = await this.departmentRepo.findOne({
            where: { id: dto.departmentId },
        });
        if (!dep) {
            return (0, response_1.errorResponse)(response_1.MESSAGES.DEPARTMENT_NOT_FOUND);
        }
        const sub = this.subDepartmentRepo.create(dto);
        const saved = await this.subDepartmentRepo.save(sub);
        return (0, response_1.successResponse)(saved, response_1.MESSAGES.CREATED);
    }
    async updateSubDepartment(id, dto) {
        const sub = await this.subDepartmentRepo.findOne({ where: { id } });
        if (!sub) {
            return (0, response_1.errorResponse)(response_1.MESSAGES.NOT_FOUND);
        }
        Object.assign(sub, dto);
        const saved = await this.subDepartmentRepo.save(sub);
        return (0, response_1.successResponse)(saved, response_1.MESSAGES.UPDATED);
    }
    async removeSubDepartment(id) {
        const sub = await this.subDepartmentRepo.findOne({ where: { id } });
        if (!sub) {
            return (0, response_1.errorResponse)(response_1.MESSAGES.NOT_FOUND);
        }
        await this.subDepartmentRepo.remove(sub);
        return (0, response_1.successResponse)(null, response_1.MESSAGES.DELETED);
    }
    async findAllPositions() {
        const positions = await this.positionRepo.find({
            order: { name: 'ASC' },
        });
        return (0, response_1.successResponse)(positions, response_1.MESSAGES.FETCHED);
    }
    async createPosition(dto) {
        const position = this.positionRepo.create(dto);
        const saved = await this.positionRepo.save(position);
        return (0, response_1.successResponse)(saved, response_1.MESSAGES.CREATED);
    }
    async updatePosition(id, dto) {
        const pos = await this.positionRepo.findOne({ where: { id } });
        if (!pos) {
            return (0, response_1.errorResponse)(response_1.MESSAGES.NOT_FOUND);
        }
        Object.assign(pos, dto);
        const saved = await this.positionRepo.save(pos);
        return (0, response_1.successResponse)(saved, response_1.MESSAGES.UPDATED);
    }
    async removePosition(id) {
        const pos = await this.positionRepo.findOne({ where: { id } });
        if (!pos) {
            return (0, response_1.errorResponse)(response_1.MESSAGES.NOT_FOUND);
        }
        await this.positionRepo.remove(pos);
        return (0, response_1.successResponse)(null, response_1.MESSAGES.DELETED);
    }
    async getOrgTree() {
        const departments = await this.departmentRepo.find({
            where: { isActive: true },
            relations: {
                headUser: true,
                subDepartments: true,
            },
            order: { name: 'ASC' },
        });
        const userCounts = await this.userRepo
            .createQueryBuilder('user')
            .select('user.departmentId', 'departmentId')
            .addSelect('COUNT(user.id)', 'count')
            .where('user.isActive = true')
            .andWhere('user.departmentId IS NOT NULL')
            .groupBy('user.departmentId')
            .getRawMany();
        const countMap = new Map(userCounts.map((r) => [r.departmentId, parseInt(r.count, 10)]));
        const tree = departments.map((dep) => ({
            id: dep.id,
            name: dep.name,
            code: dep.code,
            description: dep.description,
            headUser: dep.headUser
                ? {
                    id: dep.headUser.id,
                    fio: dep.headUser.fio,
                    username: dep.headUser.username,
                    lavozim: dep.headUser.lavozim,
                    phone: dep.headUser.phone,
                    avatarUrl: dep.headUser.avatarUrl,
                }
                : null,
            activeUsersCount: countMap.get(dep.id) || 0,
            subDepartments: (dep.subDepartments || []).map((sub) => ({
                id: sub.id,
                name: sub.name,
                code: sub.code,
                description: sub.description,
                isActive: sub.isActive,
            })),
        }));
        return (0, response_1.successResponse)(tree, response_1.MESSAGES.FETCHED);
    }
};
exports.DepartmentsService = DepartmentsService;
exports.DepartmentsService = DepartmentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(department_entity_1.Department)),
    __param(1, (0, typeorm_1.InjectRepository)(sub_department_entity_1.SubDepartment)),
    __param(2, (0, typeorm_1.InjectRepository)(position_entity_1.Position)),
    __param(3, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(4, (0, typeorm_1.InjectRepository)(seminar_entity_1.Seminar)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], DepartmentsService);
//# sourceMappingURL=departments.service.js.map
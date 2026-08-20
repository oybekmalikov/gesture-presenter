"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = __importStar(require("bcryptjs"));
const uuid_1 = require("uuid");
const user_entity_1 = require("../../database/entities/user.entity");
const department_entity_1 = require("../../database/entities/department.entity");
const sub_department_entity_1 = require("../../database/entities/sub-department.entity");
const position_entity_1 = require("../../database/entities/position.entity");
const response_1 = require("../../common/response");
const role_enum_1 = require("../../common/enums/role.enum");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let UsersService = class UsersService {
    userRepo;
    departmentRepo;
    subDepartmentRepo;
    positionRepo;
    avatarDir = path.resolve(process.cwd(), 'uploads', 'avatars');
    constructor(userRepo, departmentRepo, subDepartmentRepo, positionRepo) {
        this.userRepo = userRepo;
        this.departmentRepo = departmentRepo;
        this.subDepartmentRepo = subDepartmentRepo;
        this.positionRepo = positionRepo;
        if (!fs.existsSync(this.avatarDir)) {
            fs.mkdirSync(this.avatarDir, { recursive: true });
        }
    }
    async uploadAvatar(userId, file) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) {
            if (file?.path && fs.existsSync(file.path)) {
                try {
                    fs.unlinkSync(file.path);
                }
                catch { }
            }
            return (0, response_1.errorResponse)(response_1.MESSAGES.USER_NOT_FOUND);
        }
        if (user.avatarUrl) {
            this.safeDeleteOldAvatar(user.avatarUrl);
        }
        const avatarRelativeUrl = `/api/v1/users/profile/avatar/file/${file.filename}`;
        user.avatarUrl = avatarRelativeUrl;
        const saved = await this.userRepo.save(user);
        const { passwordHash: _p, ...result } = saved;
        return (0, response_1.successResponse)(result, {
            uz: 'Profil rasmi muvaffaqiyatli yangilandi',
            ru: 'Аватар профиля успешно обновлён',
        });
    }
    async deleteAvatar(userId) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) {
            return (0, response_1.errorResponse)(response_1.MESSAGES.USER_NOT_FOUND);
        }
        if (user.avatarUrl) {
            this.safeDeleteOldAvatar(user.avatarUrl);
        }
        user.avatarUrl = null;
        const saved = await this.userRepo.save(user);
        const { passwordHash: _p, ...result } = saved;
        return (0, response_1.successResponse)(result, {
            uz: 'Profil rasmi o`chirildi',
            ru: 'Аватар профиля удалён',
        });
    }
    getAvatarFilePath(filename) {
        const safeFilename = path.basename(filename);
        const fullPath = path.join(this.avatarDir, safeFilename);
        if (fs.existsSync(fullPath)) {
            return fullPath;
        }
        return null;
    }
    safeDeleteOldAvatar(avatarUrl) {
        try {
            const match = avatarUrl.match(/\/file\/([^/?#]+)$/);
            if (match && match[1]) {
                const oldFile = path.join(this.avatarDir, match[1]);
                if (fs.existsSync(oldFile)) {
                    fs.unlinkSync(oldFile);
                }
            }
        }
        catch { }
    }
    async create(dto) {
        const existing = await this.userRepo.findOne({
            where: { username: dto.username },
        });
        if (existing) {
            return (0, response_1.errorResponse)(response_1.MESSAGES.USER_EXISTS);
        }
        const defaultPassword = dto.password || 'okmk2026';
        const hash = await bcrypt.hash(defaultPassword, 12);
        const user = this.userRepo.create({
            id: dto.id || (0, uuid_1.v4)(),
            fio: dto.fio,
            username: dto.username,
            passwordHash: hash,
            role: dto.role || role_enum_1.Role.USER,
            gender: dto.gender,
            lavozim: dto.lavozim,
            positionId: dto.positionId,
            departmentId: dto.departmentId,
            subDepartmentId: dto.subDepartmentId,
            email: dto.email,
            phone: dto.phone,
        });
        const saved = await this.userRepo.save(user);
        const { passwordHash: _hash, ...result } = saved;
        return (0, response_1.successResponse)(result, response_1.MESSAGES.USER_CREATED);
    }
    async bulkImport(dto) {
        const [departments, subDepartments, positions] = await Promise.all([
            this.departmentRepo.find(),
            this.subDepartmentRepo.find(),
            this.positionRepo.find(),
        ]);
        const depMap = new Map();
        departments.forEach((d) => {
            depMap.set(d.id, d.id);
            depMap.set(d.code.toLowerCase(), d.id);
        });
        const subMap = new Map();
        subDepartments.forEach((s) => {
            subMap.set(s.id, s.id);
            subMap.set(s.code.toLowerCase(), s.id);
        });
        const posMap = new Map();
        positions.forEach((p) => {
            posMap.set(p.id, p.id);
            if (p.code)
                posMap.set(p.code.toLowerCase(), p.id);
        });
        const createdUsers = [];
        const errors = [];
        const defaultHash = await bcrypt.hash('okmk2026', 12);
        for (const item of dto.users) {
            try {
                const existing = await this.userRepo.findOne({
                    where: { username: item.username },
                });
                if (existing) {
                    errors.push({
                        username: item.username,
                        reason: 'Bu username allaqachon mavjud',
                    });
                    continue;
                }
                const passwordHash = item.password
                    ? await bcrypt.hash(item.password, 12)
                    : defaultHash;
                let departmentId;
                if (item.departmentCodeOrId) {
                    departmentId =
                        depMap.get(item.departmentCodeOrId.toLowerCase()) ||
                            depMap.get(item.departmentCodeOrId);
                }
                let subDepartmentId;
                if (item.subDepartmentCodeOrId) {
                    subDepartmentId =
                        subMap.get(item.subDepartmentCodeOrId.toLowerCase()) ||
                            subMap.get(item.subDepartmentCodeOrId);
                }
                let positionId;
                if (item.positionCodeOrId) {
                    positionId =
                        posMap.get(item.positionCodeOrId.toLowerCase()) ||
                            posMap.get(item.positionCodeOrId);
                }
                const user = this.userRepo.create({
                    id: (0, uuid_1.v4)(),
                    fio: item.fio,
                    username: item.username,
                    passwordHash,
                    role: item.role || role_enum_1.Role.USER,
                    gender: item.gender,
                    lavozim: item.lavozim,
                    departmentId,
                    subDepartmentId,
                    positionId,
                    email: item.email,
                    phone: item.phone,
                });
                const saved = await this.userRepo.save(user);
                const { passwordHash: _p, ...res } = saved;
                createdUsers.push(res);
            }
            catch (err) {
                errors.push({
                    username: item.username,
                    reason: err.message || 'Xatolik yuz berdi',
                });
            }
        }
        const summary = {
            total: dto.users.length,
            successCount: createdUsers.length,
            failedCount: errors.length,
            createdUsers,
            errors,
        };
        return (0, response_1.successResponse)(summary, {
            uz: `Ommaviy import: ${createdUsers.length} ta xodim muvaffaqiyatli yuklandi`,
            ru: `Массовый импорт: ${createdUsers.length} сотрудников успешно загружено`,
        });
    }
    async getMyTeam(currentUser, query) {
        if (!currentUser.departmentId) {
            return (0, response_1.errorResponse)({
                uz: 'Siz birorta bo`limga biriktirilmagansiz',
                ru: 'Вы не прикреплены ни к одному отделу',
            });
        }
        const page = query?.page || 1;
        const limit = query?.limit || 20;
        const skip = (page - 1) * limit;
        const qb = this.userRepo
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.subDepartment', 'subDepartment')
            .leftJoinAndSelect('user.position', 'position')
            .where('user.departmentId = :deptId', {
            deptId: currentUser.departmentId,
        })
            .select([
            'user.id',
            'user.fio',
            'user.username',
            'user.role',
            'user.gender',
            'user.lavozim',
            'user.email',
            'user.phone',
            'user.avatarUrl',
            'user.isActive',
            'user.lastLoginAt',
            'user.createdAt',
            'subDepartment.id',
            'subDepartment.name',
            'subDepartment.code',
            'position.id',
            'position.name',
        ]);
        if (query?.search) {
            const search = `%${query.search.toLowerCase()}%`;
            qb.andWhere('(LOWER(user.fio) LIKE :search OR LOWER(user.username) LIKE :search OR LOWER(user.lavozim) LIKE :search)', { search });
        }
        if (query?.isActive !== undefined) {
            qb.andWhere('user.isActive = :isActive', { isActive: query.isActive });
        }
        qb.orderBy('user.createdAt', 'DESC');
        qb.skip(skip).take(limit);
        const [items, total] = await qb.getManyAndCount();
        return (0, response_1.successResponse)({
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        }, response_1.MESSAGES.FETCHED);
    }
    async findAll(query) {
        const page = query?.page || 1;
        const limit = query?.limit || 20;
        const skip = (page - 1) * limit;
        const qb = this.userRepo
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.department', 'department')
            .leftJoinAndSelect('user.subDepartment', 'subDepartment')
            .leftJoinAndSelect('user.position', 'position')
            .select([
            'user.id',
            'user.fio',
            'user.username',
            'user.role',
            'user.gender',
            'user.lavozim',
            'user.email',
            'user.phone',
            'user.avatarUrl',
            'user.isActive',
            'user.lastLoginAt',
            'user.createdAt',
            'user.departmentId',
            'user.subDepartmentId',
            'user.positionId',
            'department.id',
            'department.name',
            'department.code',
            'subDepartment.id',
            'subDepartment.name',
            'subDepartment.code',
            'position.id',
            'position.name',
        ]);
        if (query?.search) {
            const search = `%${query.search.toLowerCase()}%`;
            qb.andWhere('(LOWER(user.fio) LIKE :search OR LOWER(user.username) LIKE :search OR LOWER(user.email) LIKE :search OR LOWER(user.lavozim) LIKE :search)', { search });
        }
        if (query?.role) {
            qb.andWhere('user.role = :role', { role: query.role });
        }
        if (query?.departmentId) {
            qb.andWhere('user.departmentId = :departmentId', {
                departmentId: query.departmentId,
            });
        }
        if (query?.isActive !== undefined) {
            qb.andWhere('user.isActive = :isActive', { isActive: query.isActive });
        }
        qb.orderBy('user.createdAt', 'DESC');
        qb.skip(skip).take(limit);
        const [items, total] = await qb.getManyAndCount();
        return (0, response_1.successResponse)({
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        }, response_1.MESSAGES.FETCHED);
    }
    async findOne(id) {
        const user = await this.userRepo.findOne({
            where: { id },
            relations: {
                department: true,
                subDepartment: true,
                position: true,
            },
        });
        if (!user) {
            return (0, response_1.errorResponse)(response_1.MESSAGES.USER_NOT_FOUND);
        }
        const { passwordHash: _p, ...result } = user;
        return (0, response_1.successResponse)(result, response_1.MESSAGES.FETCHED);
    }
    async update(id, dto) {
        const user = await this.userRepo.findOne({ where: { id } });
        if (!user) {
            return (0, response_1.errorResponse)(response_1.MESSAGES.USER_NOT_FOUND);
        }
        if (dto.password) {
            user.passwordHash = await bcrypt.hash(dto.password, 12);
        }
        if (dto.fio !== undefined)
            user.fio = dto.fio;
        if (dto.role !== undefined)
            user.role = dto.role;
        if (dto.gender !== undefined)
            user.gender = dto.gender;
        if (dto.lavozim !== undefined)
            user.lavozim = dto.lavozim;
        if (dto.positionId !== undefined)
            user.positionId = dto.positionId;
        if (dto.departmentId !== undefined)
            user.departmentId = dto.departmentId;
        if (dto.subDepartmentId !== undefined)
            user.subDepartmentId = dto.subDepartmentId;
        if (dto.email !== undefined)
            user.email = dto.email;
        if (dto.phone !== undefined)
            user.phone = dto.phone;
        const saved = await this.userRepo.save(user);
        const { passwordHash: _p, ...result } = saved;
        return (0, response_1.successResponse)(result, response_1.MESSAGES.USER_UPDATED);
    }
    async updateProfile(userId, dto) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) {
            return (0, response_1.errorResponse)(response_1.MESSAGES.USER_NOT_FOUND);
        }
        if (dto.fio !== undefined)
            user.fio = dto.fio;
        if (dto.gender !== undefined)
            user.gender = dto.gender;
        if (dto.email !== undefined)
            user.email = dto.email;
        if (dto.phone !== undefined)
            user.phone = dto.phone;
        if (dto.avatarUrl !== undefined)
            user.avatarUrl = dto.avatarUrl;
        const saved = await this.userRepo.save(user);
        const { passwordHash: _p, ...result } = saved;
        return (0, response_1.successResponse)(result, response_1.MESSAGES.USER_UPDATED);
    }
    async remove(id) {
        const user = await this.userRepo.findOne({ where: { id } });
        if (!user) {
            return (0, response_1.errorResponse)(response_1.MESSAGES.USER_NOT_FOUND);
        }
        await this.userRepo.remove(user);
        return (0, response_1.successResponse)(null, response_1.MESSAGES.USER_DELETED);
    }
    async toggleActive(id) {
        const user = await this.userRepo.findOne({ where: { id } });
        if (!user) {
            return (0, response_1.errorResponse)(response_1.MESSAGES.USER_NOT_FOUND);
        }
        user.isActive = !user.isActive;
        await this.userRepo.save(user);
        const { passwordHash: _p, ...result } = user;
        return (0, response_1.successResponse)(result, response_1.MESSAGES.USER_UPDATED);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(department_entity_1.Department)),
    __param(2, (0, typeorm_1.InjectRepository)(sub_department_entity_1.SubDepartment)),
    __param(3, (0, typeorm_1.InjectRepository)(position_entity_1.Position)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map
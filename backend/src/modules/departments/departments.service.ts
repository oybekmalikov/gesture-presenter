import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from '../../database/entities/department.entity';
import { SubDepartment } from '../../database/entities/sub-department.entity';
import { Position } from '../../database/entities/position.entity';
import { User } from '../../database/entities/user.entity';
import { Seminar } from '../../database/entities/seminar.entity';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { CreateSubDepartmentDto } from './dto/create-sub-department.dto';
import { CreatePositionDto } from './dto/create-position.dto';
import {
  ApiResponse,
  successResponse,
  errorResponse,
  MESSAGES,
} from '../../common/response';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private readonly departmentRepo: Repository<Department>,
    @InjectRepository(SubDepartment)
    private readonly subDepartmentRepo: Repository<SubDepartment>,
    @InjectRepository(Position)
    private readonly positionRepo: Repository<Position>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Seminar)
    private readonly seminarRepo: Repository<Seminar>,
  ) {}

  // ==================== DEPARTMENTS ====================
  async findAllDepartments(): Promise<ApiResponse> {
    const departments = await this.departmentRepo.find({
      relations: {
        headUser: true,
        subDepartments: true,
      },
      order: { name: 'ASC' },
    });
    return successResponse(departments, MESSAGES.FETCHED);
  }

  async findOneDepartment(id: string): Promise<ApiResponse> {
    const department = await this.departmentRepo.findOne({
      where: { id },
      relations: {
        headUser: true,
        subDepartments: true,
      },
    });
    if (!department) {
      return errorResponse(MESSAGES.DEPARTMENT_NOT_FOUND);
    }
    return successResponse(department, MESSAGES.FETCHED);
  }

  async createDepartment(dto: CreateDepartmentDto): Promise<ApiResponse> {
    const existing = await this.departmentRepo.findOne({
      where: { code: dto.code },
    });
    if (existing) {
      return errorResponse({
        uz: "Bu kodli bo'lim allaqachon mavjud",
        ru: 'Отдел с таким кодом уже существует',
      });
    }

    const dep = this.departmentRepo.create(dto);
    const saved = await this.departmentRepo.save(dep);
    return successResponse(saved, MESSAGES.DEPARTMENT_CREATED);
  }

  async updateDepartment(
    id: string,
    dto: Partial<CreateDepartmentDto>,
  ): Promise<ApiResponse> {
    const dep = await this.departmentRepo.findOne({ where: { id } });
    if (!dep) {
      return errorResponse(MESSAGES.DEPARTMENT_NOT_FOUND);
    }

    Object.assign(dep, dto);
    const saved = await this.departmentRepo.save(dep);
    return successResponse(saved, MESSAGES.UPDATED);
  }

  async removeDepartment(id: string): Promise<ApiResponse> {
    const dep = await this.departmentRepo.findOne({ where: { id } });
    if (!dep) {
      return errorResponse(MESSAGES.DEPARTMENT_NOT_FOUND);
    }
    await this.departmentRepo.remove(dep);
    return successResponse(null, MESSAGES.DELETED);
  }

  async setDepartmentHead(
    departmentId: string,
    userId: string,
  ): Promise<ApiResponse> {
    const dep = await this.departmentRepo.findOne({
      where: { id: departmentId },
    });
    if (!dep) {
      return errorResponse(MESSAGES.DEPARTMENT_NOT_FOUND);
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      return errorResponse(MESSAGES.USER_NOT_FOUND);
    }

    // Set department head
    dep.headUserId = user.id;
    await this.departmentRepo.save(dep);

    // If user was regular USER, promote to HEAD_DEPARTMENT and bind to department
    if (user.role === Role.USER) {
      user.role = Role.HEAD_DEPARTMENT;
    }
    user.departmentId = dep.id;
    await this.userRepo.save(user);

    const updated = await this.departmentRepo.findOne({
      where: { id: departmentId },
      relations: { headUser: true, subDepartments: true },
    });

    return successResponse(updated, {
      uz: "Bo'lim boshlig'i muvaffaqiyatli tayinlandi",
      ru: 'Руководитель отдела успешно назначен',
    });
  }

  async getDepartmentStats(id: string): Promise<ApiResponse> {
    const department = await this.departmentRepo.findOne({
      where: { id },
      relations: { headUser: true, subDepartments: true },
    });

    if (!department) {
      return errorResponse(MESSAGES.DEPARTMENT_NOT_FOUND);
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

    return successResponse(stats, MESSAGES.FETCHED);
  }

  // ==================== SUB-DEPARTMENTS ====================
  async findAllSubDepartments(departmentId?: string): Promise<ApiResponse> {
    const where = departmentId ? { departmentId } : {};
    const subs = await this.subDepartmentRepo.find({
      where,
      relations: { department: true },
      order: { name: 'ASC' },
    });
    return successResponse(subs, MESSAGES.FETCHED);
  }

  async createSubDepartment(dto: CreateSubDepartmentDto): Promise<ApiResponse> {
    const dep = await this.departmentRepo.findOne({
      where: { id: dto.departmentId },
    });
    if (!dep) {
      return errorResponse(MESSAGES.DEPARTMENT_NOT_FOUND);
    }

    const sub = this.subDepartmentRepo.create(dto);
    const saved = await this.subDepartmentRepo.save(sub);
    return successResponse(saved, MESSAGES.CREATED);
  }

  async updateSubDepartment(
    id: string,
    dto: Partial<CreateSubDepartmentDto>,
  ): Promise<ApiResponse> {
    const sub = await this.subDepartmentRepo.findOne({ where: { id } });
    if (!sub) {
      return errorResponse(MESSAGES.NOT_FOUND);
    }

    Object.assign(sub, dto);
    const saved = await this.subDepartmentRepo.save(sub);
    return successResponse(saved, MESSAGES.UPDATED);
  }

  async removeSubDepartment(id: string): Promise<ApiResponse> {
    const sub = await this.subDepartmentRepo.findOne({ where: { id } });
    if (!sub) {
      return errorResponse(MESSAGES.NOT_FOUND);
    }
    await this.subDepartmentRepo.remove(sub);
    return successResponse(null, MESSAGES.DELETED);
  }

  // ==================== POSITIONS ====================
  async findAllPositions(): Promise<ApiResponse> {
    const positions = await this.positionRepo.find({
      order: { name: 'ASC' },
    });
    return successResponse(positions, MESSAGES.FETCHED);
  }

  async createPosition(dto: CreatePositionDto): Promise<ApiResponse> {
    const position = this.positionRepo.create(dto);
    const saved = await this.positionRepo.save(position);
    return successResponse(saved, MESSAGES.CREATED);
  }

  async updatePosition(
    id: string,
    dto: Partial<CreatePositionDto>,
  ): Promise<ApiResponse> {
    const pos = await this.positionRepo.findOne({ where: { id } });
    if (!pos) {
      return errorResponse(MESSAGES.NOT_FOUND);
    }

    Object.assign(pos, dto);
    const saved = await this.positionRepo.save(pos);
    return successResponse(saved, MESSAGES.UPDATED);
  }

  async removePosition(id: string): Promise<ApiResponse> {
    const pos = await this.positionRepo.findOne({ where: { id } });
    if (!pos) {
      return errorResponse(MESSAGES.NOT_FOUND);
    }
    await this.positionRepo.remove(pos);
    return successResponse(null, MESSAGES.DELETED);
  }

  // ==================== ORG TREE ====================
  async getOrgTree(): Promise<ApiResponse> {
    const departments = await this.departmentRepo.find({
      where: { isActive: true },
      relations: {
        headUser: true,
        subDepartments: true,
      },
      order: { name: 'ASC' },
    });

    // Compute active users per department
    const userCounts = await this.userRepo
      .createQueryBuilder('user')
      .select('user.departmentId', 'departmentId')
      .addSelect('COUNT(user.id)', 'count')
      .where('user.isActive = true')
      .andWhere('user.departmentId IS NOT NULL')
      .groupBy('user.departmentId')
      .getRawMany();

    const countMap = new Map(
      userCounts.map((r: any) => [r.departmentId, parseInt(r.count, 10)]),
    );

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

    return successResponse(tree, MESSAGES.FETCHED);
  }
}

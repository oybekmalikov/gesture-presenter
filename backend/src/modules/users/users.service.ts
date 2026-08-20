import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../database/entities/user.entity';
import { Department } from '../../database/entities/department.entity';
import { SubDepartment } from '../../database/entities/sub-department.entity';
import { Position } from '../../database/entities/position.entity';
import { RegisterDto } from '../auth/dto/register.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { BulkImportUsersDto } from './dto/bulk-import-user.dto';
import {
  ApiResponse,
  successResponse,
  errorResponse,
  MESSAGES,
} from '../../common/response';
import { Role } from '../../common/enums/role.enum';

import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UsersService {
  private readonly avatarDir = path.resolve(process.cwd(), 'uploads', 'avatars');

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Department)
    private readonly departmentRepo: Repository<Department>,
    @InjectRepository(SubDepartment)
    private readonly subDepartmentRepo: Repository<SubDepartment>,
    @InjectRepository(Position)
    private readonly positionRepo: Repository<Position>,
  ) {
    if (!fs.existsSync(this.avatarDir)) {
      fs.mkdirSync(this.avatarDir, { recursive: true });
    }
  }

  async uploadAvatar(
    userId: string,
    file: Express.Multer.File,
  ): Promise<ApiResponse> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      if (file?.path && fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
        } catch {}
      }
      return errorResponse(MESSAGES.USER_NOT_FOUND);
    }

    // Delete old avatar if stored locally
    if (user.avatarUrl) {
      this.safeDeleteOldAvatar(user.avatarUrl);
    }

    const avatarRelativeUrl = `/api/v1/users/profile/avatar/file/${file.filename}`;
    user.avatarUrl = avatarRelativeUrl;

    const saved = await this.userRepo.save(user);
    const { passwordHash: _p, ...result } = saved;

    return successResponse(result, {
      uz: 'Profil rasmi muvaffaqiyatli yangilandi',
      ru: 'Аватар профиля успешно обновлён',
    });
  }

  async deleteAvatar(userId: string): Promise<ApiResponse> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      return errorResponse(MESSAGES.USER_NOT_FOUND);
    }

    if (user.avatarUrl) {
      this.safeDeleteOldAvatar(user.avatarUrl);
    }

    user.avatarUrl = null as any;
    const saved = await this.userRepo.save(user);
    const { passwordHash: _p, ...result } = saved;

    return successResponse(result, {
      uz: 'Profil rasmi o`chirildi',
      ru: 'Аватар профиля удалён',
    });
  }

  getAvatarFilePath(filename: string): string | null {
    // Sanitize filename to prevent directory traversal
    const safeFilename = path.basename(filename);
    const fullPath = path.join(this.avatarDir, safeFilename);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
    return null;
  }

  private safeDeleteOldAvatar(avatarUrl: string) {
    try {
      const match = avatarUrl.match(/\/file\/([^/?#]+)$/);
      if (match && match[1]) {
        const oldFile = path.join(this.avatarDir, match[1]);
        if (fs.existsSync(oldFile)) {
          fs.unlinkSync(oldFile);
        }
      }
    } catch {}
  }

  async create(dto: RegisterDto): Promise<ApiResponse> {
    const existing = await this.userRepo.findOne({
      where: { username: dto.username },
    });
    if (existing) {
      return errorResponse(MESSAGES.USER_EXISTS);
    }

    const defaultPassword = dto.password || 'okmk2026';
    const hash = await bcrypt.hash(defaultPassword, 12);
    const user = this.userRepo.create({
      id: dto.id || uuidv4(),
      fio: dto.fio,
      username: dto.username,
      passwordHash: hash,
      role: dto.role || Role.USER,
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
    return successResponse(result, MESSAGES.USER_CREATED);
  }

  async bulkImport(dto: BulkImportUsersDto): Promise<ApiResponse> {
    const [departments, subDepartments, positions] = await Promise.all([
      this.departmentRepo.find(),
      this.subDepartmentRepo.find(),
      this.positionRepo.find(),
    ]);

    // Fast lookup maps by code & id
    const depMap = new Map<string, string>();
    departments.forEach((d) => {
      depMap.set(d.id, d.id);
      depMap.set(d.code.toLowerCase(), d.id);
    });

    const subMap = new Map<string, string>();
    subDepartments.forEach((s) => {
      subMap.set(s.id, s.id);
      subMap.set(s.code.toLowerCase(), s.id);
    });

    const posMap = new Map<string, string>();
    positions.forEach((p) => {
      posMap.set(p.id, p.id);
      if (p.code) posMap.set(p.code.toLowerCase(), p.id);
    });

    const createdUsers: any[] = [];
    const errors: { username: string; reason: string }[] = [];

    // Cache default password hash
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

        let departmentId: string | undefined;
        if (item.departmentCodeOrId) {
          departmentId =
            depMap.get(item.departmentCodeOrId.toLowerCase()) ||
            depMap.get(item.departmentCodeOrId);
        }

        let subDepartmentId: string | undefined;
        if (item.subDepartmentCodeOrId) {
          subDepartmentId =
            subMap.get(item.subDepartmentCodeOrId.toLowerCase()) ||
            subMap.get(item.subDepartmentCodeOrId);
        }

        let positionId: string | undefined;
        if (item.positionCodeOrId) {
          positionId =
            posMap.get(item.positionCodeOrId.toLowerCase()) ||
            posMap.get(item.positionCodeOrId);
        }

        const user = this.userRepo.create({
          id: uuidv4(),
          fio: item.fio,
          username: item.username,
          passwordHash,
          role: item.role || Role.USER,
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
      } catch (err: any) {
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

    return successResponse(summary, {
      uz: `Ommaviy import: ${createdUsers.length} ta xodim muvaffaqiyatli yuklandi`,
      ru: `Массовый импорт: ${createdUsers.length} сотрудников успешно загружено`,
    });
  }

  async getMyTeam(
    currentUser: any,
    query?: QueryUserDto,
  ): Promise<ApiResponse> {
    if (!currentUser.departmentId) {
      return errorResponse({
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
      qb.andWhere(
        '(LOWER(user.fio) LIKE :search OR LOWER(user.username) LIKE :search OR LOWER(user.lavozim) LIKE :search)',
        { search },
      );
    }

    if (query?.isActive !== undefined) {
      qb.andWhere('user.isActive = :isActive', { isActive: query.isActive });
    }

    qb.orderBy('user.createdAt', 'DESC');
    qb.skip(skip).take(limit);

    const [items, total] = await qb.getManyAndCount();

    return successResponse(
      {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      MESSAGES.FETCHED,
    );
  }

  async findAll(query?: QueryUserDto): Promise<ApiResponse> {
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
      qb.andWhere(
        '(LOWER(user.fio) LIKE :search OR LOWER(user.username) LIKE :search OR LOWER(user.email) LIKE :search OR LOWER(user.lavozim) LIKE :search)',
        { search },
      );
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

    return successResponse(
      {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      MESSAGES.FETCHED,
    );
  }

  async findOne(id: string): Promise<ApiResponse> {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: {
        department: true,
        subDepartment: true,
        position: true,
      },
    });
    if (!user) {
      return errorResponse(MESSAGES.USER_NOT_FOUND);
    }
    const { passwordHash: _p, ...result } = user;
    return successResponse(result, MESSAGES.FETCHED);
  }

  async update(id: string, dto: Partial<RegisterDto>): Promise<ApiResponse> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      return errorResponse(MESSAGES.USER_NOT_FOUND);
    }

    if (dto.password) {
      user.passwordHash = await bcrypt.hash(dto.password, 12);
    }
    if (dto.fio !== undefined) user.fio = dto.fio;
    if (dto.role !== undefined) user.role = dto.role;
    if (dto.gender !== undefined) user.gender = dto.gender;
    if (dto.lavozim !== undefined) user.lavozim = dto.lavozim;
    if (dto.positionId !== undefined) user.positionId = dto.positionId;
    if (dto.departmentId !== undefined) user.departmentId = dto.departmentId;
    if (dto.subDepartmentId !== undefined)
      user.subDepartmentId = dto.subDepartmentId;
    if (dto.email !== undefined) user.email = dto.email;
    if (dto.phone !== undefined) user.phone = dto.phone;

    const saved = await this.userRepo.save(user);
    const { passwordHash: _p, ...result } = saved;
    return successResponse(result, MESSAGES.USER_UPDATED);
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<ApiResponse> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      return errorResponse(MESSAGES.USER_NOT_FOUND);
    }

    if (dto.fio !== undefined) user.fio = dto.fio;
    if (dto.gender !== undefined) user.gender = dto.gender;
    if (dto.email !== undefined) user.email = dto.email;
    if (dto.phone !== undefined) user.phone = dto.phone;
    if (dto.avatarUrl !== undefined) user.avatarUrl = dto.avatarUrl;

    const saved = await this.userRepo.save(user);
    const { passwordHash: _p, ...result } = saved;
    return successResponse(result, MESSAGES.USER_UPDATED);
  }

  async remove(id: string): Promise<ApiResponse> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      return errorResponse(MESSAGES.USER_NOT_FOUND);
    }
    await this.userRepo.remove(user);
    return successResponse(null, MESSAGES.USER_DELETED);
  }

  async toggleActive(id: string): Promise<ApiResponse> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      return errorResponse(MESSAGES.USER_NOT_FOUND);
    }
    user.isActive = !user.isActive;
    await this.userRepo.save(user);
    const { passwordHash: _p, ...result } = user;
    return successResponse(result, MESSAGES.USER_UPDATED);
  }
}

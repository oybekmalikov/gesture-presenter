import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../database/entities/audit-log.entity';
import { ApiResponse, successResponse, MESSAGES } from '../../common/response';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  async logAction(data: {
    userId?: string;
    action: string;
    entityType?: string;
    entityId?: string;
    oldValue?: Record<string, any>;
    newValue?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<AuditLog> {
    const log = this.auditRepo.create(data);
    return this.auditRepo.save(log);
  }

  async findAll(
    page = 1,
    limit = 50,
    action?: string,
    entityType?: string,
  ): Promise<ApiResponse> {
    const skip = (page - 1) * limit;

    const qb = this.auditRepo
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.user', 'user')
      .orderBy('log.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (action) {
      qb.andWhere('log.action = :action', { action });
    }
    if (entityType) {
      qb.andWhere('log.entityType = :entityType', { entityType });
    }

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
}

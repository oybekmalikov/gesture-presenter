import { Repository } from 'typeorm';
import { AuditLog } from '../../database/entities/audit-log.entity';
import { ApiResponse } from '../../common/response';
export declare class AuditService {
    private readonly auditRepo;
    constructor(auditRepo: Repository<AuditLog>);
    logAction(data: {
        userId?: string;
        action: string;
        entityType?: string;
        entityId?: string;
        oldValue?: Record<string, any>;
        newValue?: Record<string, any>;
        ipAddress?: string;
        userAgent?: string;
    }): Promise<AuditLog>;
    findAll(page?: number, limit?: number, action?: string, entityType?: string): Promise<ApiResponse>;
}

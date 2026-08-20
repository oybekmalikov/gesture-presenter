import { AuditService } from './audit.service';
export declare class AuditController {
    private readonly auditService;
    constructor(auditService: AuditService);
    findAll(page?: number, limit?: number, action?: string, entityType?: string): Promise<import("../../common/response").ApiResponse<any>>;
}

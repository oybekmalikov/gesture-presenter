import { User } from './user.entity';
export declare class AuditLog {
    id: string;
    userId: string;
    user: User;
    action: string;
    entityType: string;
    entityId: string;
    oldValue: Record<string, any>;
    newValue: Record<string, any>;
    ipAddress: string;
    userAgent: string;
    createdAt: Date;
}

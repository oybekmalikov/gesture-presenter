export declare const AUDIT_METADATA_KEY = "audit_metadata";
export interface AuditOptions {
    action: string;
    entityType?: string;
}
export declare const Audit: (options: AuditOptions) => import("@nestjs/common").CustomDecorator<string>;

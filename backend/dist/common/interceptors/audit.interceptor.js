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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditInterceptor = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const operators_1 = require("rxjs/operators");
const audit_service_1 = require("../../modules/audit/audit.service");
const audit_decorator_1 = require("../decorators/audit.decorator");
let AuditInterceptor = class AuditInterceptor {
    reflector;
    auditService;
    constructor(reflector, auditService) {
        this.reflector = reflector;
        this.auditService = auditService;
    }
    intercept(context, next) {
        const auditOptions = this.reflector.get(audit_decorator_1.AUDIT_METADATA_KEY, context.getHandler());
        if (!auditOptions) {
            return next.handle();
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const ipAddress = request.headers['x-forwarded-for'] ||
            request.connection?.remoteAddress ||
            request.ip;
        const userAgent = request.headers['user-agent'];
        const entityId = request.params?.id || request.params?.seminarId;
        const body = request.body ? { ...request.body } : undefined;
        if (body) {
            if (body.password)
                delete body.password;
            if (body.oldPassword)
                delete body.oldPassword;
            if (body.newPassword)
                delete body.newPassword;
        }
        return next.handle().pipe((0, operators_1.tap)((response) => {
            const resEntityId = entityId ||
                response?.data?.id ||
                response?.data?.session?.id ||
                response?.id;
            this.auditService
                .logAction({
                userId: user?.id || null,
                action: auditOptions.action,
                entityType: auditOptions.entityType || 'system',
                entityId: resEntityId ? String(resEntityId) : undefined,
                newValue: body || (response?.data ? response.data : undefined),
                ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : String(ipAddress || ''),
                userAgent: userAgent ? String(userAgent) : undefined,
            })
                .catch(() => { });
        }));
    }
};
exports.AuditInterceptor = AuditInterceptor;
exports.AuditInterceptor = AuditInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        audit_service_1.AuditService])
], AuditInterceptor);
//# sourceMappingURL=audit.interceptor.js.map
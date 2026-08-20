import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../../modules/audit/audit.service';
import { AUDIT_METADATA_KEY, AuditOptions } from '../decorators/audit.decorator';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditOptions = this.reflector.get<AuditOptions>(
      AUDIT_METADATA_KEY,
      context.getHandler(),
    );

    if (!auditOptions) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const ipAddress =
      request.headers['x-forwarded-for'] ||
      request.connection?.remoteAddress ||
      request.ip;
    const userAgent = request.headers['user-agent'];
    const entityId = request.params?.id || request.params?.seminarId;
    const body = request.body ? { ...request.body } : undefined;

    // Filter out passwords from audit logs
    if (body) {
      if (body.password) delete body.password;
      if (body.oldPassword) delete body.oldPassword;
      if (body.newPassword) delete body.newPassword;
    }

    return next.handle().pipe(
      tap((response) => {
        const resEntityId =
          entityId ||
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
          .catch(() => {});
      }),
    );
  }
}

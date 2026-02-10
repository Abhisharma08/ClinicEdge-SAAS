import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { UserRole } from '@prisma/client';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (user) {
            // Inject tenant context into request
            request.tenantContext = {
                clinicId: user.clinicId,
                role: user.role,
                isSuperAdmin: user.role === UserRole.SUPER_ADMIN,
            };

            // For non-super admins, automatically scope queries
            if (user.role !== UserRole.SUPER_ADMIN && user.clinicId) {
                // Add clinicId to query params if not specified
                if (!request.query.clinicId) {
                    request.query.clinicId = user.clinicId;
                }

                // Add clinicId to body if not specified (for create operations)
                if (request.body && !request.body.clinicId) {
                    request.body.clinicId = user.clinicId;
                }
            }
        }

        return next.handle();
    }
}

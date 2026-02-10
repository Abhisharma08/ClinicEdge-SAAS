import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

@Injectable()
export class TenantGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            return true; // Let auth guard handle this
        }

        // SUPER_ADMIN can access any tenant
        if (user.role === UserRole.SUPER_ADMIN) {
            return true;
        }

        // For tenant-scoped roles, ensure clinicId is present
        if ([UserRole.CLINIC_ADMIN, UserRole.DOCTOR].includes(user.role)) {
            if (!user.clinicId) {
                throw new ForbiddenException('User is not associated with any clinic');
            }
        }

        // Check if request is trying to access another tenant's data
        const requestedClinicId =
            request.params.clinicId ||
            request.query.clinicId ||
            request.body?.clinicId;

        if (
            requestedClinicId &&
            user.clinicId &&
            requestedClinicId !== user.clinicId &&
            user.role !== UserRole.SUPER_ADMIN
        ) {
            throw new ForbiddenException('Access to other clinic data is forbidden');
        }

        return true;
    }
}

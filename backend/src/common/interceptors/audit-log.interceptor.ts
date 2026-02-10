import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction } from '@prisma/client';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
    // Entities that require audit logging
    private readonly auditableEntities = [
        'patients',
        'appointments',
        'visit-records',
        'prescriptions',
        'feedback',
    ];

    // Methods that modify data
    private readonly auditableMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

    constructor(private prisma: PrismaService) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const { method, path, user, body, ip, headers } = request;

        // Only audit modifying operations on auditable entities
        if (!this.shouldAudit(method, path)) {
            return next.handle();
        }

        const startTime = Date.now();
        const entityType = this.extractEntityType(path);
        const entityId = request.params.id;

        return next.handle().pipe(
            tap({
                next: async (response) => {
                    try {
                        const action = this.getAuditAction(method);

                        await this.prisma.auditLog.create({
                            data: {
                                entityType,
                                entityId: entityId || response?.id || 'unknown',
                                action,
                                oldValues: method === 'DELETE' ? body : null,
                                newValues: ['POST', 'PUT', 'PATCH'].includes(method) ? body : null,
                                userId: user?.userId || null,
                                clinicId: user?.clinicId || null,
                                ipAddress: ip || this.getClientIp(headers),
                                userAgent: headers['user-agent'] || null,
                            },
                        });
                    } catch (error) {
                        // Log error but don't fail the request
                        console.error('Audit log failed:', error);
                    }
                },
                error: () => {
                    // Don't log audit on errors
                },
            }),
        );
    }

    private shouldAudit(method: string, path: string): boolean {
        if (!this.auditableMethods.includes(method)) {
            return false;
        }

        return this.auditableEntities.some((entity) =>
            path.includes(`/api/v1/${entity}`),
        );
    }

    private extractEntityType(path: string): string {
        const match = path.match(/\/api\/v1\/([^\/]+)/);
        return match ? match[1] : 'unknown';
    }

    private getAuditAction(method: string): AuditAction {
        switch (method) {
            case 'POST':
                return AuditAction.CREATE;
            case 'PUT':
            case 'PATCH':
                return AuditAction.UPDATE;
            case 'DELETE':
                return AuditAction.DELETE;
            default:
                return AuditAction.UPDATE;
        }
    }

    private getClientIp(headers: any): string {
        return (
            headers['x-forwarded-for']?.split(',')[0] ||
            headers['x-real-ip'] ||
            'unknown'
        );
    }
}

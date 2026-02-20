import { Controller, Get, Patch, Param, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CurrentUser, CurrentUserData, Roles } from '../../common/decorators';
import { UserRole } from '@prisma/client';

@ApiTags('notifications')
@Controller('notifications')
@ApiBearerAuth('JWT-auth')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get()
    @Roles(UserRole.CLINIC_ADMIN, UserRole.DOCTOR)
    @ApiOperation({ summary: 'Get dashboard notifications' })
    async getDashboardNotifications(@CurrentUser() user: CurrentUserData) {
        if (!user.clinicId) {
            throw new ForbiddenException('User must be associated with a clinic');
        }
        return this.notificationsService.getDashboardNotifications(
            user.clinicId,
            user.userId,
        );
    }

    @Patch('read-all')
    @Roles(UserRole.CLINIC_ADMIN, UserRole.DOCTOR)
    @ApiOperation({ summary: 'Mark all dashboard notifications as read' })
    async markAllAsRead(@CurrentUser() user: CurrentUserData) {
        if (!user.clinicId) {
            throw new ForbiddenException('User must be associated with a clinic');
        }
        return this.notificationsService.markAllAsRead(user.clinicId, user.userId);
    }

    @Patch(':id/read')
    @ApiOperation({ summary: 'Mark notification as read' })
    async markAsRead(@Param('id') id: string) {
        return this.notificationsService.markAsRead(id);
    }
}

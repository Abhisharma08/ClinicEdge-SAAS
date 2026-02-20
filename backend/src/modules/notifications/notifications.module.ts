import { Module, forwardRef } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationCleanupService } from './notification-cleanup.service';
import { NotificationSchedulerService } from './notification-scheduler.service';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
    imports: [forwardRef(() => IntegrationsModule)],
    controllers: [NotificationsController],
    providers: [NotificationsService, NotificationCleanupService, NotificationSchedulerService],
    exports: [NotificationsService],
})
export class NotificationsModule { }

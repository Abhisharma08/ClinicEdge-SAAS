import { Module, forwardRef } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
    imports: [forwardRef(() => IntegrationsModule)],
    controllers: [NotificationsController],
    providers: [NotificationsService],
    exports: [NotificationsService],
})
export class NotificationsModule { }

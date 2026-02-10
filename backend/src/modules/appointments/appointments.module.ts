import { Module } from '@nestjs/common';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { SlotsService } from './slots.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { PatientsModule } from '../patients/patients.module';

@Module({
    imports: [NotificationsModule, PatientsModule],
    controllers: [AppointmentsController],
    providers: [AppointmentsService, SlotsService],
    exports: [AppointmentsService, SlotsService],
})
export class AppointmentsModule { }

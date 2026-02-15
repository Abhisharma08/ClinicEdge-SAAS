import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ClinicsModule } from './modules/clinics/clinics.module';
import { DoctorsModule } from './modules/doctors/doctors.module';
import { SpecialistsModule } from './modules/specialists/specialists.module';
import { PatientsModule } from './modules/patients/patients.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { VisitRecordsModule } from './modules/visit-records/visit-records.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { StorageModule } from './modules/storage/storage.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { TenantGuard } from './common/guards/tenant.guard';
import { HealthController } from './common/health.controller';
import configuration from './config/configuration';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
        ThrottlerModule.forRoot([{
            ttl: 60000,
            limit: 60,
        }]),
        PrismaModule,
        RedisModule,
        StorageModule,
        AuthModule,
        UsersModule,
        ClinicsModule,
        DoctorsModule,
        SpecialistsModule,
        PatientsModule,
        AppointmentsModule,
        VisitRecordsModule,
        FeedbackModule,
        NotificationsModule,
        IntegrationsModule,
    ],
    controllers: [HealthController],
    providers: [
        { provide: APP_GUARD, useClass: ThrottlerGuard },
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
        { provide: APP_GUARD, useClass: TenantGuard },
    ],
})
export class AppModule { }

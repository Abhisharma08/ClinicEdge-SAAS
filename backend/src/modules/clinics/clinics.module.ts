import { Module } from '@nestjs/common';
import { ClinicsController } from './clinics.controller';
import { ClinicsService } from './clinics.service';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
    imports: [IntegrationsModule],
    controllers: [ClinicsController],
    providers: [ClinicsService],
    exports: [ClinicsService],
})
export class ClinicsModule { }

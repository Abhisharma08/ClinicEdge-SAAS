import { Module } from '@nestjs/common';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';
import { ImportExportService } from './import-export.service';

@Module({
    controllers: [PatientsController],
    providers: [PatientsService, ImportExportService],
    exports: [PatientsService],
})
export class PatientsModule { }

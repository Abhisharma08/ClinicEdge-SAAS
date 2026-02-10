import { Module } from '@nestjs/common';
import { VisitRecordsController } from './visit-records.controller';
import { VisitRecordsService } from './visit-records.service';
import { StorageModule } from '../storage/storage.module';
import { PdfModule } from '../pdf/pdf.module';

@Module({
    imports: [StorageModule, PdfModule],
    controllers: [VisitRecordsController],
    providers: [VisitRecordsService],
    exports: [VisitRecordsService],
})
export class VisitRecordsModule { }

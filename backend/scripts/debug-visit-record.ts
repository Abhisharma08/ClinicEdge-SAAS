
import { VisitRecordsService } from '../src/modules/visit-records/visit-records.service';
import { PrismaClient } from '@prisma/client';
import { CreateVisitRecordDto } from '../src/modules/visit-records/dto/create-visit-record.dto';
import * as fs from 'fs';

// Setup logging
function log(msg: any) {
    const text = typeof msg === 'string' ? msg : JSON.stringify(msg, null, 2);
    console.log(text);
    fs.appendFileSync('debug_visit_log.txt', text + '\n');
}

// Mock Storage Service
const mockStorageService = {
    uploadFile: async () => 'http://mock-url.com/file.pdf',
} as any; // Cast to any to bypass type checks for other methods

// Real Prisma
const prisma = new PrismaClient();

async function run() {
    log('--- STARTING DEBUG SCRIPT ---');
    try {
        const service = new VisitRecordsService(prisma as any, mockStorageService, {} as any);

        // Data from previous context
        const appointmentId = 'ef250009-4f5c-4a7f-bc5b-1fde9b94db09';
        // Need to fetch doctorId and clinicId from the appointment to be sure, or use known ones.
        // Let's fetch the appointment first to see if it exists and what IDs it has.

        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId }
        });

        if (!appointment) {
            log('❌ Appointment NOT FOUND in DB: ' + appointmentId);
            return;
        }
        log('Found Appointment: ' + JSON.stringify(appointment, null, 2));

        const doctorId = appointment.doctorId;
        const clinicId = appointment.clinicId;

        const dto: CreateVisitRecordDto = {
            appointmentId: appointmentId,
            symptoms: 'Fever and Cough',
            diagnosis: 'Viral Infection',
            notes: 'Rest recommended',
            followUpDate: new Date().toISOString(),
            prescriptions: [
                {
                    medication: 'Paracetamol',
                    dosage: '500mg',
                    frequency: '1-0-1',
                    duration: '3 days',
                    instructions: 'After food'
                }
            ]
        };

        log('DTO prepared. Checking for existing record...');

        // Check if one exists first
        const existing = await prisma.visitRecord.findFirst({
            where: { appointmentId: appointmentId }
        });

        if (existing) {
            log('⚠️ Visit Record ALREADY EXISTS: ' + existing.id);
            log('Deleting existing record to allow test...');
            await prisma.visitRecord.delete({ where: { id: existing.id } });
        }

        log('Calling service.create()...');
        const result = await service.create(dto, doctorId, clinicId);
        log('✅ Success! Created Record ID: ' + result.id);

    } catch (error) {
        log('❌ FAILED with error:');
        log(error);
        if (error instanceof Error) {
            log('Stack: ' + error.stack);
        }
    } finally {
        await prisma.$disconnect();
    }
}

run();

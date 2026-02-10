
import { Test } from '@nestjs/testing';
import { DoctorsService } from '../src/modules/doctors/doctors.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { PrismaClient } from '@prisma/client';

// Real Prisma Client for accurate DB testing
const prisma = new PrismaClient();

const mockPrismaService = prisma; // Use real prisma

async function run() {
    const moduleRef = await Test.createTestingModule({
        providers: [
            DoctorsService,
            { provide: PrismaService, useValue: mockPrismaService },
        ],
    }).compile();

    const doctorsService = moduleRef.get<DoctorsService>(DoctorsService);

    const doctorId = '67dfe9a1-dd49-4b43-81fe-811bcb0eb3b6'; // Abhimanyu Sharma

    console.log('--- Testing getAppointments(id, undefined, true) ---');
    try {
        const result = await doctorsService.getAppointments(doctorId, undefined, true);
        console.log('Result Items:', result.items.length);
        result.items.forEach(a => {
            console.log(`- ${a.id}: ${a.appointmentDate} (${a.status})`);
        });
    } catch (error) {
        console.error('Test Failed:', error);
    }

    console.log('--- Testing getAppointments(id, undefined, false) ---');
    try {
        const result = await doctorsService.getAppointments(doctorId, undefined, false);
        console.log('Result Items (All/None):', result.items.length);
    } catch (error) {
        console.error('Test Failed:', error);
    }

}

run()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

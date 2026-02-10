
import { Test } from '@nestjs/testing';
import { DoctorsService } from '../src/modules/doctors/doctors.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { PrismaClient } from '@prisma/client';
import { PaginationDto } from '../src/common/dto/pagination.dto';

// Real Prisma Client
const prisma = new PrismaClient();
const mockPrismaService = prisma;

async function run() {
    const moduleRef = await Test.createTestingModule({
        providers: [
            DoctorsService,
            { provide: PrismaService, useValue: mockPrismaService },
        ],
    }).compile();

    const doctorsService = moduleRef.get<DoctorsService>(DoctorsService);

    const doctorId = '67dfe9a1-dd49-4b43-81fe-811bcb0eb3b6';

    // Simulate Frontend Request
    // URL: /doctors/:id/appointments?upcoming=true&limit=50
    // Controller receives:
    // id: string
    // date: undefined
    // upcoming: 'true' (if not transformed to bool by pipe) or true
    // pagination: { limit: 50, page: 1 } (transformed by pipe)

    const pagination = new PaginationDto();
    pagination.limit = 50;
    pagination.page = 1;

    console.log('--- Simulating Frontend Request ---');
    console.log('Params:', { doctorId, upcoming: 'true', pagination });

    try {
        // Pass 'true' string to test my manual conversion logic again just to be safe
        const result = await doctorsService.getAppointments(doctorId, undefined, 'true' as any, pagination);

        console.log('Success:', result.meta);
        console.log('Items found:', result.items.length);

        if (result.items.length === 0) {
            console.log('❌ Still 0 items. Checking Debug logs...');
        } else {
            console.log('✅ Found items:');
            result.items.forEach(a => console.log(`${a.appointmentDate.toISOString()} - ${a.status}`));
        }

    } catch (error) {
        console.error('Failed:', error);
    }
}

run()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

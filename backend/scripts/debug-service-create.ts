
import { Test } from '@nestjs/testing';
import { AppointmentsService } from '../src/modules/appointments/appointments.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { SlotsService } from '../src/modules/appointments/slots.service';
import { NotificationsService } from '../src/modules/notifications/notifications.service';
import { RedisService } from '../src/redis/redis.service';
import { PatientsService } from '../src/modules/patients/patients.service';
import { CreateAppointmentDto } from '../src/modules/appointments/dto';

// Mock dependencies
const mockPrismaService = {
    appointment: {
        findUnique: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn(), // for isSlotAvailable internal check
    },
    user: {
        findUnique: jest.fn(),
    },
    doctorClinic: {
        findUnique: jest.fn(),
    }
};

const mockSlotsService = {
    acquireSlotLock: jest.fn().mockResolvedValue('lock-id'),
    releaseSlotLock: jest.fn(),
    isSlotAvailable: jest.fn().mockResolvedValue(true),
    invalidateCache: jest.fn(),
};

const mockNotificationsService = {
    scheduleAppointmentNotifications: jest.fn(),
};

const mockPatientsService = {};

async function run() {
    const moduleRef = await Test.createTestingModule({
        providers: [
            AppointmentsService,
            { provide: PrismaService, useValue: mockPrismaService },
            { provide: SlotsService, useValue: mockSlotsService },
            { provide: NotificationsService, useValue: mockNotificationsService },
            { provide: PatientsService, useValue: mockPatientsService },
        ],
    }).compile();

    const appointmentsService = moduleRef.get<AppointmentsService>(AppointmentsService);

    const dto: CreateAppointmentDto = {
        clinicId: '0cd98a17-be27-465d-b78b-838daff95520',
        doctorId: '67dfe9a1-dd49-4b43-81fe-811bcb0eb3b6',
        patientId: 'patient-id',
        appointmentDate: '2026-02-09',
        startTime: '09:00',
        endTime: '09:30',
        notes: 'Test',
    };

    try {
        console.log('Testing create...');
        // Mock db returns
        mockPrismaService.appointment.create.mockResolvedValue({ id: 'new-apt-id', ...dto });

        const result = await appointmentsService.create(dto, 'user-id');
        console.log('Create Result:', result);
    } catch (error) {
        console.error('Create Failed:', error);
    }
}

run();

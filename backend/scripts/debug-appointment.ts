
import { PrismaClient } from '@prisma/client';
import { generateTimeSlots, parseTime, formatTime, addMinutes, getDayName } from '../src/common/utils/date.util';

const prisma = new PrismaClient();

async function main() {
    console.log('Connecting...');

    const clinicId = '0cd98a17-be27-465d-b78b-838daff95520';
    const doctorId = '67dfe9a1-dd49-4b43-81fe-811bcb0eb3b6';
    // We need a patient ID. Let's find one.
    const patient = await prisma.patient.findFirst();
    if (!patient) {
        console.log('No patient found to test with.');
        return;
    }
    const patientId = patient.id;
    const date = '2026-02-09'; // Monday
    const startTime = '09:00';
    const endTime = '09:30';

    console.log(`Simulating Appointment Creation:
  Doctor: ${doctorId}
  Clinic: ${clinicId}
  Patient: ${patientId}
  Date: ${date} ${startTime}-${endTime}`);

    // 1. Is Slot Available?
    // We can't easily call the service method without bootstrapping NestJS app, 
    // but we can simulate the DB queries it does.

    // Check overlap
    const overlapping = await prisma.appointment.findFirst({
        where: {
            clinicId,
            doctorId,
            appointmentDate: new Date(date),
            status: { in: ['PENDING', 'CONFIRMED'] },
            AND: [
                { startTime: { lt: new Date(`1970-01-01T${endTime}:00.000Z`) } },
                { endTime: { gt: new Date(`1970-01-01T${startTime}:00.000Z`) } }
            ]
        }
    });

    if (overlapping) {
        console.log('❌ Slot overlap detected!');
    } else {
        console.log('✅ No overlap with existing appointments.');
    }

    // 2. Try creating the appointment via Prisma directly to see if DB constraints fail
    console.log('Attempting Prisma Create...');
    try {
        const apt = await prisma.appointment.create({
            data: {
                clinicId,
                doctorId,
                patientId,
                appointmentDate: new Date(date),
                startTime: new Date(`1970-01-01T${startTime}:00.000Z`),
                endTime: new Date(`1970-01-01T${endTime}:00.000Z`),
                status: 'CONFIRMED',
                notes: 'Debug Test Appointment'
            }
        });
        console.log('✅ Appointment created successfully ID:', apt.id);

        // Cleanup
        await prisma.appointment.delete({ where: { id: apt.id } });
        console.log('Cleaned up test appointment.');
    } catch (error) {
        console.error('❌ Failed to create appointment:', error);
    }

}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

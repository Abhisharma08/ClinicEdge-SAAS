
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Connecting...');

    // IDs from the frontend console log
    const clinicId = '0cd98a17-be27-465d-b78b-838daff95520';
    const doctorId = '67dfe9a1-dd49-4b43-81fe-811bcb0eb3b6';

    console.log(`Fixing schedule for:
  Clinic: ${clinicId}
  Doctor: ${doctorId}`);

    // Default Schedule (Mon-Fri 09:00-17:00, Sat 10:00-14:00)
    const defaultSchedule = {
        monday: { startTime: '09:00', endTime: '17:00', slotDuration: 30 },
        tuesday: { startTime: '09:00', endTime: '17:00', slotDuration: 30 },
        wednesday: { startTime: '09:00', endTime: '13:00', slotDuration: 30 },
        thursday: { startTime: '09:00', endTime: '17:00', slotDuration: 30 },
        friday: { startTime: '09:00', endTime: '17:00', slotDuration: 30 },
        saturday: { startTime: '10:00', endTime: '14:00', slotDuration: 30 }
    };

    const prismaAny = prisma as any;

    try {
        const updated = await prismaAny.doctorClinic.update({
            where: {
                doctorId_clinicId: { doctorId, clinicId }
            },
            data: {
                schedule: defaultSchedule
            }
        });
        console.log('✅ Schedule UPDATED successfully!');
        console.log(JSON.stringify(updated.schedule, null, 2));
    } catch (error) {
        console.error('Failed to update:', error);
        // Fallback: try updateMany if unique constraint is issue
        await prismaAny.doctorClinic.updateMany({
            where: { doctorId, clinicId },
            data: { schedule: defaultSchedule }
        });
        console.log('✅ Schedule UPDATED via updateMany!');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

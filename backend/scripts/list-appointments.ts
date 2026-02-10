
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Connecting...');

    // Doctor: Abhimanyu Sharma (from screenshot/logs)
    const doctorId = '67dfe9a1-dd49-4b43-81fe-811bcb0eb3b6';

    console.log(`Listing appointments for Doctor: ${doctorId}`);

    const appointments = await prisma.appointment.findMany({
        where: {
            doctorId: doctorId,
            deletedAt: null
        },
        include: {
            patient: true
        },
        orderBy: {
            appointmentDate: 'asc'
        }
    });

    console.log(`Found ${appointments.length} appointments.`);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    console.log('Server "Today" (Local setHours 0):', today.toString());
    console.log('Server "Today" (ISO):', today.toISOString());

    appointments.forEach(apt => {
        console.log(`
      ID: ${apt.id}
      Date: ${apt.appointmentDate.toISOString()}
      Start: ${apt.startTime.toISOString()}
      Status: ${apt.status}
      Patient: ${apt.patient.name}
      Is Upcoming? ${apt.appointmentDate >= today}
      `);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

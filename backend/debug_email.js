require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
    // Get the most recent appointment's ID
    const recentAppt = await p.appointment.findFirst({
        orderBy: { createdAt: 'desc' },
        select: {
            id: true, status: true, createdAt: true,
            patient: { select: { name: true, email: true, phone: true, whatsappConsent: true } },
            doctor: { select: { name: true } },
        },
    });
    console.log('\n=== MOST RECENT APPOINTMENT ===');
    console.log(JSON.stringify(recentAppt, null, 2));

    // Get ALL notifications for that appointment
    const notifs = await p.notification.findMany({
        where: { appointmentId: recentAppt.id },
        orderBy: { createdAt: 'asc' },
        select: { id: true, type: true, channel: true, status: true, errorMessage: true, createdAt: true, sentAt: true, payload: true },
    });
    console.log('\n=== NOTIFICATIONS FOR THIS APPOINTMENT ===');
    notifs.forEach(n => {
        const payload = n.payload || {};
        console.log(`  [${n.channel}] ${n.type} | status: ${n.status} | email: ${payload.patientEmail || 'N/A'} | error: ${n.errorMessage || 'none'} | created: ${n.createdAt}`);
    });

    // Count all EMAIL notifications ever
    const emailNotifs = await p.notification.findMany({
        where: { channel: 'EMAIL' },
        orderBy: { createdAt: 'desc' },
        select: { id: true, type: true, status: true, errorMessage: true, payload: true, createdAt: true },
    });
    console.log('\n=== ALL EMAIL NOTIFICATIONS EVER ===');
    emailNotifs.forEach(n => {
        const payload = n.payload || {};
        console.log(`  ${n.type} | ${n.status} | to: ${payload.patientEmail} | error: ${n.errorMessage || 'OK'} | ${n.createdAt}`);
    });
    console.log(`  Total: ${emailNotifs.length}`);
}

main().catch(e => console.error('ERROR:', e.message)).finally(() => p.$disconnect());

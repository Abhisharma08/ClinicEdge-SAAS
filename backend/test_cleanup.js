require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
    console.log('=== 1. Creating OLD Notification (2 hours ago) ===');
    const oldNotif = await p.notification.create({
        data: {
            clinicId: (await p.clinic.findFirst()).id,
            type: 'APPOINTMENT_CREATED',
            channel: 'DASHBOARD',
            status: 'PENDING',
            payload: { message: 'Existing old notification' },
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        }
    });
    console.log(`  Created: ${oldNotif.id} | ${oldNotif.createdAt}`);

    console.log('=== 2. Creating NEW Notification (Now) ===');
    const newNotif = await p.notification.create({
        data: {
            clinicId: oldNotif.clinicId,
            type: 'APPOINTMENT_CREATED',
            channel: 'DASHBOARD',
            status: 'PENDING',
            payload: { message: 'New notification' },
            createdAt: new Date(),
        }
    });
    console.log(`  Created: ${newNotif.id} | ${newNotif.createdAt}`);

    console.log('\n=== 3. Simulating Cleanup Service Logic ===');
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const deleted = await p.notification.deleteMany({
        where: {
            channel: 'DASHBOARD',
            createdAt: { lt: oneHourAgo }, // Delete if older than 1 hour
        }
    });
    console.log(`  Deleted count: ${deleted.count}`);

    console.log('\n=== 4. Verifying Results ===');
    const checkOld = await p.notification.findUnique({ where: { id: oldNotif.id } });
    const checkNew = await p.notification.findUnique({ where: { id: newNotif.id } });

    console.log(`  Old Notification exists? ${checkOld ? 'YES (FAIL)' : 'NO (PASS)'}`);
    console.log(`  New Notification exists? ${checkNew ? 'YES (PASS)' : 'NO (FAIL)'}`);

    // Cleanup the new one to keep DB clean
    if (checkNew) await p.notification.delete({ where: { id: newNotif.id } });
}

main().catch(console.error).finally(() => p.$disconnect());

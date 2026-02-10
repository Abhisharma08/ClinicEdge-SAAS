
const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3001/api/v1';
const ADMIN_EMAIL = 'admin@healthfirst.clinic';
const PASSWORD = 'Password@123';

async function main() {
    console.log('🚀 Starting Restore Doctor Debugging...');

    // 1. Login as Admin
    console.log('1. Logging in as Admin...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ADMIN_EMAIL, password: PASSWORD }),
    });

    if (!loginRes.ok) {
        console.error(`❌ Login Failed: ${loginRes.status} ${await loginRes.text()}`);
        return;
    }

    const data = await loginRes.json();
    const accessToken = data.accessToken;
    const user = data.user;

    console.log(`✅ Login Successful. Clinic: ${user.clinicId}`);
    const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
    };

    // 2. Create Dummy Doctor
    console.log('\n2. Creating Dummy Doctor to Archive...');
    const doctorEmail = `restore.doc.${Date.now()}@test.com`;
    const createPayload = {
        name: "Restore Candidate",
        email: doctorEmail,
        password: "Password@123",
        qualification: "MBBS",
        licenseNumber: "RESTORE123",
        phone: `888${Date.now().toString().slice(-7)}`
    };

    const createRes = await fetch(`${BASE_URL}/doctors`, {
        method: 'POST',
        headers,
        body: JSON.stringify(createPayload)
    });

    if (!createRes.ok) {
        console.error(`❌ Create 1 Failed: ${createRes.status}`);
        return;
    }
    const doctor = await createRes.json();
    console.log(`✅ Created Doctor: ${doctor.id}`);

    // 3. Archive (Delete) Doctor
    console.log(`\n3. Archiving Doctor...`);
    await fetch(`${BASE_URL}/doctors/${doctor.id}`, { method: 'DELETE', headers });
    console.log(`✅ Doctor Archived.`);

    // 4. Attempt Re-create (Restore)
    console.log(`\n4. Attempting Re-creation (Restore)...`);
    const restoreRes = await fetch(`${BASE_URL}/doctors`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            ...createPayload,
            name: "Restored Doctor Name" // Changing name to prove update
        })
    });

    if (!restoreRes.ok) {
        console.error(`❌ Restore Failed: ${restoreRes.status}`);
        console.error(`Response: ${await restoreRes.text()}`);
    } else {
        const restoredDoc = await restoreRes.json();
        console.log(`✅ Restore Successful: ${restoredDoc.id}`);
        console.log(`   New Name: ${restoredDoc.name}`);
        console.log(`   isActive: ${restoredDoc.isActive}`);
        console.log(`   deletedAt: ${restoredDoc.deletedAt}`);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

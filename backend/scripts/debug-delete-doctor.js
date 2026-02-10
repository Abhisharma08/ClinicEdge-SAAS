
const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3001/api/v1';
const ADMIN_EMAIL = 'admin@healthfirst.clinic';
const PASSWORD = 'Password@123';

async function main() {
    console.log('🚀 Starting Delete Doctor Debugging...');

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

    // 2. Create a Dummy Doctor
    console.log('\n2. Creating Dummy Doctor...');
    const doctorEmail = `temp.doc.${Date.now()}@test.com`;
    const createPayload = {
        name: "Temp Doctor",
        email: doctorEmail,
        password: "Password@123",
        qualification: "MBBS",
        licenseNumber: "TEMP123",
        phone: `999${Date.now().toString().slice(-7)}`
    };

    const createRes = await fetch(`${BASE_URL}/doctors`, {
        method: 'POST',
        headers,
        body: JSON.stringify(createPayload)
    });

    if (!createRes.ok) {
        console.error(`❌ Create Doctor Failed: ${createRes.status}`);
        console.error(`Response: ${await createRes.text()}`);
        return;
    }

    const doctor = await createRes.json();
    console.log(`✅ Doctor Created: ${doctor.id}`);

    // 3. Attempt Delete
    console.log(`\n3. Attempting Delete Doctor ${doctor.id}...`);

    const deleteRes = await fetch(`${BASE_URL}/doctors/${doctor.id}`, {
        method: 'DELETE',
        headers
    });

    if (!deleteRes.ok) {
        console.error(`❌ Delete Failed: ${deleteRes.status}`);
        console.error(`Response: ${await deleteRes.text()}`);
    } else {
        console.log('✅ Delete Successful');
    }

    // 4. Verify List
    console.log(`\n4. Verifying Doctor List...`);
    const listRes = await fetch(`${BASE_URL}/doctors?clinicId=${user.clinicId}`, {
        method: 'GET',
        headers
    });
    const listData = await listRes.json();
    const found = listData.items.find(d => d.id === doctor.id);
    if (found) {
        console.error('❌ FAIL: Deleted doctor still appears in list!', found);
        console.log('isActive:', found.isActive);
    } else {
        console.log('✅ PASS: Deleted doctor is gone from list.');
    }

    // 5. Verify DB State directly
    console.log(`\n5. Verifying Database State...`);
    const dbDoctor = await prisma.doctor.findUnique({ where: { id: doctor.id } });
    if (dbDoctor && dbDoctor.deletedAt) {
        console.log(`✅ PASS: Doctor archived in DB. deletedAt: ${dbDoctor.deletedAt}`);
    } else {
        console.error('❌ FAIL: Doctor NOT archived properly in DB.', dbDoctor);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

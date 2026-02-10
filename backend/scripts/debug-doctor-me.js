
const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3001/api/v1';

// We need a doctor email. I'll use the one from restore test "restore.doc..." or similar
// Or I can create a new doctor quickly.
const DOCTOR_EMAIL = `debug.me.doctor.${Date.now()}@test.com`;
const PASSWORD = 'Password@123';

async function main() {
    console.log('🚀 Starting Doctor Me Debugging...');

    // 1. Login as Admin to create a doctor
    console.log('1. Logging in as Admin...');
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@healthfirst.clinic', password: 'Password@123' }),
    });

    if (!adminLoginRes.ok) {
        throw new Error(`Admin login failed: ${adminLoginRes.status}`);
    }
    const adminData = await adminLoginRes.json();
    const adminToken = adminData.accessToken;

    // 2. Create a Doctor
    console.log('2. Creating Doctor...');
    const createRes = await fetch(`${BASE_URL}/doctors`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: "Test Doctor For Me",
            email: DOCTOR_EMAIL,
            password: PASSWORD,
            qualification: "MD",
            licenseNumber: "ME123",
            phone: `777${Date.now().toString().slice(-7)}`
        })
    });

    if (!createRes.ok) throw new Error(`Create doctor failed: ${createRes.status} ${await createRes.text()}`);
    console.log(`✅ Doctor created: ${DOCTOR_EMAIL}`);

    // 3. Login as Doctor
    console.log('3. Logging in as Doctor...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: DOCTOR_EMAIL, password: PASSWORD }),
    });

    if (!loginRes.ok) {
        console.error(`❌ Doctor Login Failed: ${loginRes.status} ${await loginRes.text()}`);
        return;
    }

    const data = await loginRes.json();
    const accessToken = data.accessToken;
    const user = data.user;

    console.log(`✅ Doctor Login Successful. Role: ${user.role}`);

    // 4. Call GET /doctors/profile/me
    console.log(`\n4. Calling GET /doctors/profile/me ...`);
    const meRes = await fetch(`${BASE_URL}/doctors/profile/me`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    });

    if (!meRes.ok) {
        console.error(`❌ GET /doctors/profile/me Failed: ${meRes.status}`);
        console.error(`Response: ${await meRes.text()}`);
    } else {
        const profile = await meRes.json();
        console.log('✅ GET /doctors/profile/me Successful');
        console.log('   ID:', profile.id);
        console.log('   Name:', profile.name);
        console.log('   Email:', profile.user.email);

        if (profile.user.email === DOCTOR_EMAIL) {
            console.log('✅ PASS: Profile matches logged in user.');
        } else {
            console.error('❌ FAIL: Email mismatch');
        }
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

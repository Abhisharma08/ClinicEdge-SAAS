
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3001/api/v1';
const ADMIN_EMAIL = 'admin@healthfirst.clinic';
const PASSWORD = 'Password@123';

async function main() {
    console.log('🚀 Starting Booking Debugging...');

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

    const { accessToken, user } = await loginRes.json();
    console.log(`✅ Login Successful. Clinic: ${user.clinicId}`);
    const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
    };

    // 2. Get Prerequisites (Patient, Doctor)
    const doctor = await prisma.doctor.findFirst({ where: { clinicId: user.clinicId } });
    const patient = await prisma.patient.findFirst({ where: { patientClinics: { some: { clinicId: user.clinicId } } } });

    if (!doctor || !patient) {
        console.error('❌ Missing doctor or patient for test.');
        return;
    }

    // 3. Attempt Booking
    // Pick a date 2 days from now to avoid "past date" errors and likely ensure availability
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 2);
    const dateStr = targetDate.toISOString().split('T')[0];
    const startTime = "11:00";
    const endTime = "11:30";

    console.log(`\n3. Attempting Booking for ${dateStr} at ${startTime}...`);

    const payload = {
        clinicId: user.clinicId,
        doctorId: doctor.id,
        patientId: patient.id,
        appointmentDate: dateStr,
        startTime,
        endTime,
        notes: "Debug Booking"
    };

    const bookRes = await fetch(`${BASE_URL}/appointments`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
    });

    if (!bookRes.ok) {
        console.error(`❌ Booking Failed: ${bookRes.status}`);
        console.error(`Response: ${await bookRes.text()}`);
    } else {
        console.log('✅ Booking Successful');
        console.log(await bookRes.json());
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

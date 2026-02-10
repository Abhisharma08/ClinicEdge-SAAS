
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3001/api/v1';
const EMAIL = 'admin@healthfirst.clinic';
const PASSWORD = 'Password@123';

async function main() {
    console.log('🚀 Starting Dashboard Data Verification...');

    // 1. Login
    console.log('1. Logging in...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    });

    if (!loginRes.ok) {
        throw new Error(`Login failed: ${loginRes.status} ${await loginRes.text()}`);
    }

    const { accessToken, user } = await loginRes.json();
    console.log(`✅ Login Successful. Clinic ID: ${user.clinicId}`);
    const headers = { 'Authorization': `Bearer ${accessToken}` };

    // 2. Check Database Directly
    console.log('\n2. Checking Database (Prisma)...');
    const dbPatients = await prisma.patient.count({ where: { patientClinics: { some: { clinicId: user.clinicId } } } }); // Many-to-many check
    // Try simple check if schema differs
    const dbPatientsRaw = await prisma.patient.count();

    // Check appointments
    const dbAppointments = await prisma.appointment.count({ where: { clinicId: user.clinicId } });
    const dbPending = await prisma.appointment.count({ where: { clinicId: user.clinicId, status: 'PENDING' } });

    console.log(`[DB] Total Patients (All): ${dbPatientsRaw}`);
    console.log(`[DB] Patients Linked to Clinic: ${dbPatients}`);
    console.log(`[DB] Appointments for Clinic: ${dbAppointments}`);
    console.log(`[DB] Pending Appointments: ${dbPending}`);

    // 3. Check APIs
    console.log('\n3. Checking APIs...');
    const patientsFetch = await fetch(`${BASE_URL}/patients`, { headers });
    if (!patientsFetch.ok) {
        console.error(`[API] /patients failed: ${patientsFetch.status} ${await patientsFetch.text()}`);
    } else {
        const patientsRes = await patientsFetch.json();
        console.log(`[API] /patients total: ${patientsRes.meta?.total ?? 'N/A'}`);
    }

    const pendingFetch = await fetch(`${BASE_URL}/appointments?status=PENDING`, { headers });
    if (!pendingFetch.ok) {
        console.error(`[API] /appointments failed: ${pendingFetch.status} ${await pendingFetch.text()}`);
    } else {
        const pendingRes = await pendingFetch.json();
        console.log(`[API] /appointments?status=PENDING total: ${pendingRes.meta?.total ?? 'N/A'}`);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

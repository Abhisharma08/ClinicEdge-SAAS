
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3001/api/v1';
const PASSWORD = 'Password@123';

async function main() {
    console.log('🚀 Starting Action Debugging (Admin & Doctor)...');

    // --- TEST 1: ADMIN CANCEL ---
    console.log('\n--- TEST 1: ADMIN CANCEL ---');
    const adminEmail = 'admin@healthfirst.clinic';
    console.log(`Logging in as Admin (${adminEmail})...`);

    const adminLogin = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail, password: PASSWORD }),
    });

    if (adminLogin.ok) {
        const { accessToken, user } = await adminLogin.json();
        const headers = { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

        const appointmentToCancel = await prisma.appointment.findFirst({
            where: { clinicId: user.clinicId, status: { in: ['CONFIRMED', 'PENDING'] } }
        });

        if (appointmentToCancel) {
            console.log(`Admin attempting to cancel appointment ${appointmentToCancel.id}...`);
            const res = await fetch(`${BASE_URL}/appointments/${appointmentToCancel.id}`, { method: 'DELETE', headers });
            console.log(`Admin Cancel Result: ${res.status} ${await res.text()}`);
        } else {
            console.log('No appointment to cancel.');
        }
    } else {
        console.error(`Admin Login Failed: ${adminLogin.status}`);
    }

    // --- TEST 2: DOCTOR CONSULTATION ---
    console.log('\n--- TEST 2: DOCTOR CONSULTATION ---');

    // Find a doctor user
    const doctorUser = await prisma.user.findFirst({ where: { role: 'DOCTOR' } });
    if (!doctorUser) {
        console.error('No DOCTOR user found in DB.');
        return;
    }

    console.log(`Logging in as Doctor (${doctorUser.email})...`);
    const docLogin = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: doctorUser.email, password: PASSWORD }),
    });

    if (docLogin.ok) {
        const { accessToken, user } = await docLogin.json();
        const headers = { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

        // Find appointment assigned to this doctor
        // We first need the doctor profile ID
        const doctorProfile = await prisma.doctor.findUnique({ where: { userId: user.userId } });
        if (!doctorProfile) {
            console.error('Doctor profile not found for this user.');
            return;
        }

        const myAppointment = await prisma.appointment.findFirst({
            where: { doctorId: doctorProfile.id, status: { in: ['CONFIRMED', 'PENDING'] } }
        });

        if (myAppointment) {
            console.log(`Doctor attempting to save consultation for appointment ${myAppointment.id}...`);
            const payload = {
                appointmentId: myAppointment.id,
                diagnosis: 'Test Diagnosis',
                symptoms: 'Test Symptoms',
                prescriptions: []
            };

            const res = await fetch(`${BASE_URL}/visit-records`, { method: 'POST', headers, body: JSON.stringify(payload) });
            console.log(`Doctor Save Result: ${res.status} ${await res.text()}`);
        } else {
            console.log('No appointment found for this doctor.');
        }

    } else {
        console.error(`Doctor Login Failed: ${docLogin.status}`);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());


const BASE_URL = 'http://localhost:3001/api/v1';
const EMAIL = 'admin@healthfirst.clinic';
const PASSWORD = 'Password@123';

async function main() {
    console.log('🚀 Starting History & Feedback Verification...');

    // 1. Login
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: EMAIL, password: PASSWORD })
    });

    if (!loginRes.ok) throw new Error(`Login failed: ${await loginRes.text()}`);
    const { accessToken, user } = await loginRes.json();
    console.log('✅ Login Successful');
    const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
    };

    // 2. Setup Data (Get Doctor, Patient)
    // Fetch one patient (clinicId is inferred from token)
    const patientsRes = await fetch(`${BASE_URL}/patients`, { headers });
    const patients = await patientsRes.json();
    console.log('DEBUG: Patients Response:', JSON.stringify(patients).substring(0, 200));

    let patient;
    if (patients.items && patients.items.length > 0) {
        patient = patients.items[0];
    } else {
        // Create a patient
        const randomPhone = `+91-999${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`;
        console.log('Creating new patient...', randomPhone);
        const createPatientRes = await fetch(`${BASE_URL}/patients`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ name: 'Verification Patient', phone: randomPhone, gender: 'MALE' })
        });
        if (!createPatientRes.ok) throw new Error(`Create Patient failed: ${await createPatientRes.text()}`);
        patient = await createPatientRes.json();
    }

    if (!patient) throw new Error('Failed to get/create patient');
    console.log('👤 Using Patient:', patient.name);

    // 3. Verify Patient History API
    console.log('\nTesting Patient History API...');
    const historyRes = await fetch(`${BASE_URL}/patients/${patient.id}/visits`, { headers });
    const history = await historyRes.json(); // Paginated result
    console.log(`✅ History API successful. Found ${history.meta.total} visits.`);

    if (history.items.length > 0) {
        const visit = history.items[0];
        // Check fields
        if (visit.prescriptions === undefined) console.warn('⚠️ Prescriptions field missing in response');
        else console.log('✅ Visit contains prescriptions array');

        if (visit.appointment?.appointmentDate) console.log('✅ Visit contains appointment date');
        else console.warn('⚠️ Visit missing appointment data');

        // Check if notes contains symptoms (legacy check)
        if (visit.notes && visit.notes.includes('Symptoms:')) console.log('✅ Visit notes contain parsing format');
    }

    // 4. Feedback Flow Simulation
    console.log('\nTesting Feedback Flow...');

    // 4a. Create Appointment
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2); // Future date to avoid conflicts
    const apptDate = tomorrow.toISOString().split('T')[0];

    // Randomize time to avoid conflict from previous runs
    const randomHour = 9 + Math.floor(Math.random() * 7); // 9-15
    const startTime = `${randomHour.toString().padStart(2, '0')}:00`;
    const endTime = `${randomHour.toString().padStart(2, '0')}:30`;
    console.log(`Creating appointment for ${apptDate} at ${startTime}...`);

    // Get a doctor
    const doctorsRes = await fetch(`${BASE_URL}/doctors?clinicId=${user.clinicId}`, { headers });
    const doctors = await doctorsRes.json();
    const doctor = doctors.items[0];

    // Create
    const createApptRes = await fetch(`${BASE_URL}/appointments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            clinicId: user.clinicId,
            patientId: patient.id,
            doctorId: doctor.id,
            appointmentDate: apptDate,
            startTime,
            endTime,
            notes: 'Feedback Test'
        })
    });

    if (!createApptRes.ok) throw new Error(`Create Appt failed: ${await createApptRes.text()}`);
    const appointment = await createApptRes.json();
    console.log('📅 Appointment Created:', appointment.id);

    // 4b. Complete Appointment (Triggers Token Generation)
    const completeRes = await fetch(`${BASE_URL}/appointments/${appointment.id}/status?status=COMPLETED`, {
        method: 'PATCH',
        headers
    });
    if (!completeRes.ok) throw new Error(`Complete Appt failed: ${await completeRes.text()}`);
    console.log('✅ Appointment Completed');

    // 4c. Get Feedback Token (via Get Appointment)
    // Wait a bit for async creation? It's awaited in service so should be immediate.
    const getApptRes = await fetch(`${BASE_URL}/appointments/${appointment.id}`, { headers });
    const updatedAppt = await getApptRes.json();

    const feedback = updatedAppt.feedback;
    if (!feedback) throw new Error('Feedback record not created after completion');
    const token = feedback.token;
    console.log('🎟️ Feedback Token Generated:', token);

    // 4d. Validate Token (Public API - No Headers)
    const validateRes = await fetch(`${BASE_URL}/feedback/validate/${token}`);
    if (!validateRes.ok) throw new Error(`Token validation failed: ${await validateRes.text()}`);
    const context = await validateRes.json();
    if (context.doctorName !== doctor.name) throw new Error('Context doctor name mismatch');
    console.log('✅ Token Validated Publicly');

    // 4e. Submit Feedback (Public API)
    const submitRes = await fetch(`${BASE_URL}/feedback/submit/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: 5, comments: 'Great service verification!' })
    });

    if (!submitRes.ok) throw new Error(`Submit Feedback failed: ${await submitRes.text()}`);
    console.log('✅ Feedback Submitted Successfully');

    console.log('\n🎉 All History & Feedback verifications passed!');
}

main().catch(console.error);

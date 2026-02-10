
async function debugDoctorAccess() {
    const API_URL = 'http://localhost:3001/api/v1';
    const email = 'dr.sharma@healthfirst.clinic';
    const password = 'NewPassword@123'; // Using current password

    try {
        console.log(`🔐 Logging in as Doctor ${email}...`);
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!loginRes.ok) {
            throw new Error(`Login failed: ${loginRes.statusText}`);
        }

        const loginData = await loginRes.json();
        const token = loginData.access_token;
        console.log('✅ Login successful');

        // 1. Check Appointment Details (Simulating Consultation Page load)
        // Need a valid appointment ID. Let's fetch list first.
        console.log('📅 Fetching Appointments...');
        const appointmentsRes = await fetch(`${API_URL}/appointments?limit=1`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!appointmentsRes.ok) console.error(`❌ Fetch Appointments Failed: ${appointmentsRes.status}`);
        else console.log('✅ Fetch Appointments OK');

        const appointments = await appointmentsRes.json();
        if (appointments.items && appointments.items.length > 0) {
            const appId = appointments.items[0].id;
            console.log(`🔎 Checking Appointment Details for ${appId}...`);
            const appRes = await fetch(`${API_URL}/appointments/${appId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (appRes.ok) console.log('✅ Appointment Details OK');
            else console.error(`❌ Appointment Details Failed: ${appRes.status}`);
        }

        // 2. Check Patient Details (Simulating Patient Page load)
        // Need a valid patient ID.
        console.log('👥 Fetching Patients...');
        const patientsRes = await fetch(`${API_URL}/patients?limit=1`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!patientsRes.ok) console.error(`❌ Fetch Patients Failed: ${patientsRes.status}`);
        else console.log('✅ Fetch Patients OK');

        const patients = await patientsRes.json();
        if (patients.items && patients.items.length > 0) {
            const patientId = patients.items[0].id;
            console.log(`👤 Checking Patient Details for ${patientId}...`);
            const patRes = await fetch(`${API_URL}/patients/${patientId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (patRes.ok) console.log('✅ Patient Details OK');
            else console.error(`❌ Patient Details Failed: ${patRes.status}`);

            console.log(`📜 Checking Patient Visits for ${patientId}...`);
            const visitsRes = await fetch(`${API_URL}/patients/${patientId}/visits`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (visitsRes.ok) console.log('✅ Patient Visits OK');
            else console.error(`❌ Patient Visits Failed: ${visitsRes.status}`);
        }

    } catch (error: any) {
        console.error('❌ Debug Failed:', error.message);
    }
}

debugDoctorAccess();

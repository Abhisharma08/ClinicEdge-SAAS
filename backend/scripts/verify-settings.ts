
const BASE_URL = 'http://localhost:3001/api/v1';
const EMAIL = 'admin@healthfirst.clinic';
const PASSWORD = 'Password@123';

async function main() {
    console.log('🚀 Starting Settings Verification...');

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
    const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
    };

    // 2. Fetch Clinic Settings
    console.log('\n2. Fetching Clinic Details...');
    const clinicRes = await fetch(`${BASE_URL}/clinics/${user.clinicId}`, { headers });
    const clinic = await clinicRes.json();
    console.log('Current Settings:', JSON.stringify(clinic.settings, null, 2));

    // 3. Update Settings
    console.log('\n3. Updating Settings...');
    const newSettings = {
        ...clinic.settings,
        testUpdate: new Date().toISOString(),
        slotDuration: 45, // Changing from default 30
    };

    const updateRes = await fetch(`${BASE_URL}/clinics/${user.clinicId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
            settings: newSettings,
        }),
    });

    if (!updateRes.ok) {
        throw new Error(`Update failed: ${updateRes.status} ${await updateRes.text()}`);
    }
    console.log('✅ Update request successful');

    // 4. Verify Update
    console.log('\n4. Verifying Persistence...');
    const verifyRes = await fetch(`${BASE_URL}/clinics/${user.clinicId}`, { headers });
    const updatedClinic = await verifyRes.json();
    const updatedSettings = updatedClinic.settings;

    console.log('Updated Settings:', JSON.stringify(updatedSettings, null, 2));

    if (updatedSettings.slotDuration === 45 && updatedSettings.testUpdate) {
        console.log('✅ Settings successfully updated and persisted!');
    } else {
        console.error('❌ Settings mismatch!');
    }
}

main().catch(console.error);

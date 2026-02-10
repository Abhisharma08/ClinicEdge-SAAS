
// Standalone script to test API
// Usage: npx ts-node scripts/debug-create-clinic.ts

async function debugCreateClinic() {
    const API_URL = 'http://localhost:3001/api/v1';

    console.log('1. Attempting Login as Super Admin...');
    try {
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@cliniccrm.com',
                password: 'Password@123'
            })
        });

        if (!loginRes.ok) {
            console.error('Login Failed:', loginRes.status, await loginRes.text());
            return;
        }

        const loginData = await loginRes.json();
        console.log('Login Successful!');
        console.log('Token:', loginData.accessToken ? loginData.accessToken.substring(0, 20) + '...' : 'MISSING');
        console.log('User Role:', loginData.user.role);

        if (!loginData.accessToken) {
            console.error('No access token received!');
            return;
        }

        console.log('\n2. Attempting to Create Clinic...');
        const token = loginData.accessToken;

        const clinicData = {
            name: "Debug Clinic " + Date.now(),
            address: "123 Debug St",
            phone: "+919999999999",
            email: `debug${Date.now()}@clinic.com`,
            settings: {
                timezone: 'Asia/Kolkata',
                slotDuration: 30,
                bookingAdvanceDays: 30,
                cancelBeforeHours: 4
            }
        };

        const createRes = await fetch(`${API_URL}/clinics`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(clinicData)
        });

        if (!createRes.ok) {
            console.error('Create Clinic Failed Status:', createRes.status);
            console.error('Response:', await createRes.text());
            return;
        }

        const clinic = await createRes.json();
        console.log('Clinic Created Successfully!');
        console.log('Clinic ID:', clinic.id);

    } catch (error) {
        console.error('Script Error:', error);
    }
}

debugCreateClinic();

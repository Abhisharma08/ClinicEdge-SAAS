
async function debugPdf() {
    const API_URL = 'http://localhost:3001/api/v1';
    const email = 'admin@healthfirst.clinic';
    const password = 'Password@123';

    try {
        console.log(`🔐 Logging in as Doctor ${email}...`);
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!loginRes.ok) {
            console.error('Login Error Status:', loginRes.status);
            console.error('Login Error Body:', await loginRes.text());
            throw new Error(`Login failed`);
        }
        const { access_token } = await loginRes.json();
        console.log('✅ Login successful');

        // 1. Get a completed appointment to find a visit record
        const aptRes = await fetch(`${API_URL}/appointments?status=COMPLETED&limit=1`, {
            headers: { Authorization: `Bearer ${access_token}` }
        });
        const aptData = await aptRes.json();

        if (!aptData.items || aptData.items.length === 0) {
            console.log('⚠️ No completed appointments found to test PDF. Please complete a consultation first.');
            return;
        }

        const apt = aptData.items[0];
        console.log(`🔎 Found Appointment ${apt.id}`);

        // Get details to find visitRecordId (as list might not include it)
        const detailRes = await fetch(`${API_URL}/appointments/${apt.id}`, {
            headers: { Authorization: `Bearer ${access_token}` }
        });
        const detail = await detailRes.json();
        const visitRecordId = detail.visitRecord?.id;

        if (!visitRecordId) {
            console.log('⚠️ Appointment has no visit record.');
            return;
        }

        console.log(`📄 Testing PDF for Visit Record ${visitRecordId}...`);
        const pdfRes = await fetch(`${API_URL}/visit-records/${visitRecordId}/pdf`, {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        if (pdfRes.ok) {
            console.log('✅ PDF Generated Successfully');
            const blob = await pdfRes.blob();
            console.log(`📦 PDF Size: ${blob.size} bytes`);
        } else {
            console.error(`❌ PDF Generation Failed: ${pdfRes.status} ${pdfRes.statusText}`);
            console.error(await pdfRes.text());
        }

    } catch (error: any) {
        console.error('❌ Debug Failed:', error.message);
    }
}

debugPdf();

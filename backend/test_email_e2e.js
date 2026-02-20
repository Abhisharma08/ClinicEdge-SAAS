/**
 * End-to-end email test: sends a real test email via the SMTP config
 * and verifies instant delivery.
 */
require('dotenv').config();
const nodemailer = require('nodemailer');

async function main() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT);
    const secure = port === 465;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM;

    console.log('=== SMTP CONFIG ===');
    console.log(`  Host: ${host}`);
    console.log(`  Port: ${port}`);
    console.log(`  Secure: ${secure}`);
    console.log(`  User: ${user}`);
    console.log(`  From: ${from}`);

    if (!host || !user || !pass) {
        console.error('ERROR: SMTP credentials missing in .env');
        return;
    }

    const transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });

    // Step 1: Verify connection
    console.log('\n=== STEP 1: Verify SMTP connection ===');
    try {
        await transporter.verify();
        console.log('  ✅ SMTP connection OK');
    } catch (e) {
        console.error('  ❌ SMTP connection failed:', e.message);
        return;
    }

    // Step 2: Send test email
    console.log('\n=== STEP 2: Send test email ===');
    const testTo = 'contentify01@gmail.com';
    try {
        const info = await transporter.sendMail({
            from,
            to: testTo,
            subject: 'ClinicEdge - Email Test (Production Check)',
            html: `
                <div style="font-family:Arial;padding:20px;background:#f9fafb;">
                    <div style="max-width:500px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
                        <div style="background:linear-gradient(135deg,#0D9488,#0F766E);padding:24px;text-align:center;">
                            <h1 style="color:white;margin:0;font-size:22px;">ClinicEdge Email Test</h1>
                        </div>
                        <div style="padding:24px;">
                            <p style="color:#374151;font-size:15px;">✅ This confirms that the ClinicEdge email notification system is <strong>working correctly</strong>.</p>
                            <p style="color:#6B7280;font-size:13px;">Sent at: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
                            <hr style="border:none;border-top:1px solid #E5E7EB;margin:16px 0;">
                            <p style="color:#9CA3AF;font-size:12px;text-align:center;">This is an automated test. No action required.</p>
                        </div>
                    </div>
                </div>
            `,
        });
        console.log(`  ✅ Email sent to ${testTo}`);
        console.log(`  Message ID: ${info.messageId}`);
        console.log(`  Response: ${info.response}`);
    } catch (e) {
        console.error(`  ❌ Send failed: ${e.message}`);
    }

    console.log('\n=== DONE ===');
    console.log('Check the inbox (and spam folder!) of', testTo);
}

main();

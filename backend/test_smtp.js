require('dotenv').config();
const nodemailer = require('nodemailer');

async function main() {
    console.log('Testing SMTP Connection...');
    console.log('Host:', process.env.SMTP_HOST);
    console.log('Port:', process.env.SMTP_PORT);
    console.log('User:', process.env.SMTP_USER);

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: Number(process.env.SMTP_PORT) === 465, // True for 465 SSL
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    try {
        await transporter.verify();
        console.log('✅ SMTP Connection Successful!');

        // Send test email
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: process.env.SMTP_USER, // Send to self to test
            subject: 'Test Email from Clinic Edgle',
            text: 'If you see this, email notifications are working correctly!',
        });
        console.log('✅ Test email sent: ' + info.messageId);
    } catch (error) {
        console.error('❌ SMTP Error:', error);
    }
}

main();

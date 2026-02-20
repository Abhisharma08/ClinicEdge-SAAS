/**
 * Test script to send all 5 email templates
 */
require('dotenv').config();
const nodemailer = require('nodemailer');

// We can't import TS directly, so let's inline a quick version of the templates
// to test the rendering. In the actual app, the TS templates are used.

const BRAND = {
    name: 'ClinicEdge',
    primaryColor: '#0D9488',
    primaryDark: '#0F766E',
    accentColor: '#F0FDFA',
    textDark: '#1F2937',
    textMuted: '#6B7280',
    borderColor: '#E5E7EB',
    bgColor: '#F9FAFB',
    white: '#FFFFFF',
    successGreen: '#059669',
    warningAmber: '#D97706',
};

function baseLayout(title, content) {
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${title}</title></head>
<body style="margin:0;padding:0;background-color:${BRAND.bgColor};font-family:'Segoe UI',Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.bgColor};">
<tr><td align="center" style="padding:24px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:${BRAND.white};border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
<tr><td style="background:linear-gradient(135deg,${BRAND.primaryColor},${BRAND.primaryDark});padding:28px 32px;text-align:center;">
<span style="font-size:26px;font-weight:700;color:${BRAND.white};letter-spacing:-0.5px;">🏥 ${BRAND.name}</span></td></tr>
<tr><td style="padding:32px;">${content}</td></tr>
<tr><td style="padding:20px 32px;background-color:${BRAND.bgColor};border-top:1px solid ${BRAND.borderColor};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="font-size:12px;color:${BRAND.textMuted};line-height:1.6;">
This is an automated message from ${BRAND.name}.<br>Please do not reply to this email.<br>
<span style="color:${BRAND.primaryColor};">© ${new Date().getFullYear()} ${BRAND.name}</span></td></tr></table></td></tr>
</table></td></tr></table></body></html>`;
}

function infoRow(icon, label, value) {
    return `<tr><td style="padding:10px 16px;border-bottom:1px solid ${BRAND.borderColor};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td width="32" style="font-size:18px;vertical-align:middle;">${icon}</td>
<td style="font-size:13px;color:${BRAND.textMuted};vertical-align:middle;padding-right:8px;">${label}</td>
<td align="right" style="font-size:14px;font-weight:600;color:${BRAND.textDark};vertical-align:middle;">${value}</td>
</tr></table></td></tr>`;
}

function detailsCard(rows) {
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.accentColor};border-radius:8px;border:1px solid ${BRAND.borderColor};margin:16px 0;">${rows}</table>`;
}

function ctaButton(text, url, color) {
    color = color || BRAND.primaryColor;
    return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto;">
<tr><td align="center" style="background-color:${color};border-radius:8px;">
<a href="${url}" target="_blank" style="display:inline-block;padding:14px 32px;color:${BRAND.white};text-decoration:none;font-size:15px;font-weight:600;letter-spacing:0.3px;">${text}</a>
</td></tr></table>`;
}

// Test data
const p = {
    patientName: 'Rahul Sharma',
    doctorName: 'Priya Patel',
    clinicName: 'Smile Dental Care',
    clinicAddress: '123 MG Road, Delhi',
    date: '2026-02-17',
    time: '10:30',
    feedbackUrl: 'https://clinicedgle.com/feedback/abc123',
};

function appointmentCreatedEmail() {
    const content = `
        <h2 style="margin:0 0 8px;font-size:22px;color:${BRAND.textDark};">Appointment Booked ✓</h2>
        <p style="margin:0 0 20px;font-size:15px;color:${BRAND.textMuted};">Dear <strong>${p.patientName}</strong>, your appointment has been successfully booked.</p>
        ${detailsCard(`${infoRow('👨‍⚕️', 'Doctor', `Dr. ${p.doctorName}`)}${infoRow('🏥', 'Clinic', p.clinicName)}${infoRow('📅', 'Date', p.date)}${infoRow('🕐', 'Time', p.time)}${infoRow('📍', 'Address', p.clinicAddress)}`)}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
        <tr><td style="background-color:#FEF3C7;border-left:4px solid ${BRAND.warningAmber};padding:12px 16px;border-radius:0 6px 6px 0;">
        <p style="margin:0;font-size:13px;color:#92400E;"><strong>⏳ Pending Confirmation</strong><br>Your appointment is awaiting confirmation from the clinic.</p></td></tr></table>
        <p style="margin:24px 0 0;font-size:13px;color:${BRAND.textMuted};text-align:center;">Please arrive 10 minutes before your scheduled time.</p>`;
    return baseLayout('Appointment Booked', content);
}

function feedbackEmail() {
    const content = `
    <div style="text-align:center;margin-bottom:20px;">
        <div style="display:inline-block;width:56px;height:56px;border-radius:50%;background-color:#EDE9FE;line-height:56px;font-size:28px;text-align:center;">💬</div>
    </div>
    <h2 style="margin:0 0 8px;font-size:22px;color:${BRAND.textDark};text-align:center;">How Was Your Visit?</h2>
    <p style="margin:0 0 20px;font-size:15px;color:${BRAND.textMuted};text-align:center;">Dear <strong>${p.patientName}</strong>, thank you for visiting <strong>${p.clinicName}</strong> with <strong>Dr. ${p.doctorName}</strong>.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 16px;">
    <tr><td style="font-size:32px;padding:0 4px;">⭐</td><td style="font-size:32px;padding:0 4px;">⭐</td><td style="font-size:32px;padding:0 4px;">⭐</td><td style="font-size:32px;padding:0 4px;">⭐</td><td style="font-size:32px;padding:0 4px;">⭐</td></tr></table>
    ${ctaButton('Share Your Feedback →', p.feedbackUrl)}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
    <tr><td style="background-color:#F3F4F6;padding:12px 16px;border-radius:6px;">
    <p style="margin:0;font-size:12px;color:${BRAND.textMuted};text-align:center;">🔒 Your feedback is confidential. This link expires in 24 hours.</p></td></tr></table>`;
    return baseLayout('Share Your Feedback', content);
}

async function main() {
    console.log('Sending test emails with new professional templates...');

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    const to = process.env.SMTP_USER;

    try {
        // Test 1: Appointment Booked
        let info = await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to,
            subject: 'Appointment Booking Confirmation',
            html: appointmentCreatedEmail(),
        });
        console.log('✅ Appointment Booked email sent:', info.messageId);

        // Test 2: Feedback Request
        info = await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to,
            subject: 'How was your visit?',
            html: feedbackEmail(),
        });
        console.log('✅ Feedback Request email sent:', info.messageId);

        console.log('\\n🎉 All test emails sent! Check your inbox.');
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

main();

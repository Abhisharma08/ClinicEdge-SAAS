/**
 * Professional HTML Email Templates for ClinicEdge
 * Table-based layouts for maximum email client compatibility
 */

const BRAND = {
    name: 'ClinicEdge',
    primaryColor: '#0D9488',    // Teal-600
    primaryDark: '#0F766E',     // Teal-700
    accentColor: '#F0FDFA',     // Teal-50
    textDark: '#1F2937',        // Gray-800
    textMuted: '#6B7280',       // Gray-500
    borderColor: '#E5E7EB',     // Gray-200
    bgColor: '#F9FAFB',        // Gray-50
    white: '#FFFFFF',
    successGreen: '#059669',
    warningAmber: '#D97706',
};

/** Wraps content in a responsive email shell with header + footer */
function baseLayout(title: string, content: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <!--[if mso]>
    <style>table,td{font-family:Arial,Helvetica,sans-serif!important}</style>
    <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${BRAND.bgColor};font-family:'Segoe UI',Arial,Helvetica,sans-serif;">
    <!-- Wrapper -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.bgColor};">
        <tr>
            <td align="center" style="padding:24px 16px;">
                <!-- Container -->
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:${BRAND.white};border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

                    <!-- Header -->
                    <tr>
                        <td style="background:linear-gradient(135deg,${BRAND.primaryColor},${BRAND.primaryDark});padding:28px 32px;text-align:center;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center">
                                        <span style="font-size:26px;font-weight:700;color:${BRAND.white};letter-spacing:-0.5px;">
                                            🏥 ${BRAND.name}
                                        </span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding:32px;">
                            ${content}
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding:20px 32px;background-color:${BRAND.bgColor};border-top:1px solid ${BRAND.borderColor};">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="font-size:12px;color:${BRAND.textMuted};line-height:1.6;">
                                        This is an automated message from ${BRAND.name}.<br>
                                        Please do not reply to this email.<br>
                                        <span style="color:${BRAND.primaryColor};">© ${new Date().getFullYear()} ${BRAND.name}</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

/** Primary CTA button */
function ctaButton(text: string, url: string, color: string = BRAND.primaryColor): string {
    return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto;">
        <tr>
            <td align="center" style="background-color:${color};border-radius:8px;">
                <a href="${url}" target="_blank"
                   style="display:inline-block;padding:14px 32px;color:${BRAND.white};text-decoration:none;font-size:15px;font-weight:600;letter-spacing:0.3px;">
                    ${text}
                </a>
            </td>
        </tr>
    </table>`;
}

/** Info card row (icon + label + value) */
function infoRow(icon: string, label: string, value: string): string {
    return `
    <tr>
        <td style="padding:10px 16px;border-bottom:1px solid ${BRAND.borderColor};">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td width="32" style="font-size:18px;vertical-align:middle;">${icon}</td>
                    <td style="font-size:13px;color:${BRAND.textMuted};vertical-align:middle;padding-right:8px;">${label}</td>
                    <td align="right" style="font-size:14px;font-weight:600;color:${BRAND.textDark};vertical-align:middle;">${value}</td>
                </tr>
            </table>
        </td>
    </tr>`;
}

/** Details card wrapper */
function detailsCard(rows: string): string {
    return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.accentColor};border-radius:8px;border:1px solid ${BRAND.borderColor};margin:16px 0;">
        ${rows}
    </table>`;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  PUBLIC TEMPLATE FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface AppointmentEmailPayload {
    patientName: string;
    doctorName: string;
    clinicName: string;
    clinicAddress?: string;
    date: string;
    time: string;
    feedbackUrl?: string;
}

/**
 * Appointment Booked — sent when a new appointment is created
 */
export function appointmentCreatedEmail(p: AppointmentEmailPayload): string {
    const content = `
        <h2 style="margin:0 0 8px;font-size:22px;color:${BRAND.textDark};">Appointment Booked ✓</h2>
        <p style="margin:0 0 20px;font-size:15px;color:${BRAND.textMuted};">
            Dear <strong>${p.patientName}</strong>, your appointment has been successfully booked.
        </p>

        ${detailsCard(`
            ${infoRow('👨‍⚕️', 'Doctor', `Dr. ${p.doctorName}`)}
            ${infoRow('🏥', 'Clinic', p.clinicName)}
            ${infoRow('📅', 'Date', p.date)}
            ${infoRow('🕐', 'Time', p.time)}
            ${p.clinicAddress ? infoRow('📍', 'Address', p.clinicAddress) : ''}
        `)}

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
            <tr>
                <td style="background-color:#FEF3C7;border-left:4px solid ${BRAND.warningAmber};padding:12px 16px;border-radius:0 6px 6px 0;">
                    <p style="margin:0;font-size:13px;color:#92400E;">
                        <strong>⏳ Pending Confirmation</strong><br>
                        Your appointment is awaiting confirmation from the clinic. You will receive another email once confirmed.
                    </p>
                </td>
            </tr>
        </table>

        <p style="margin:24px 0 0;font-size:13px;color:${BRAND.textMuted};text-align:center;">
            Please arrive 10 minutes before your scheduled time.
        </p>
    `;
    return baseLayout('Appointment Booked', content);
}

/**
 * Appointment Confirmed — sent when clinic confirms the appointment
 */
export function appointmentConfirmedEmail(p: AppointmentEmailPayload): string {
    const content = `
        <div style="text-align:center;margin-bottom:20px;">
            <div style="display:inline-block;width:56px;height:56px;border-radius:50%;background-color:#D1FAE5;line-height:56px;font-size:28px;text-align:center;">✅</div>
        </div>

        <h2 style="margin:0 0 8px;font-size:22px;color:${BRAND.textDark};text-align:center;">Appointment Confirmed!</h2>
        <p style="margin:0 0 20px;font-size:15px;color:${BRAND.textMuted};text-align:center;">
            Great news, <strong>${p.patientName}</strong>! Your appointment has been confirmed.
        </p>

        ${detailsCard(`
            ${infoRow('👨‍⚕️', 'Doctor', `Dr. ${p.doctorName}`)}
            ${infoRow('🏥', 'Clinic', p.clinicName)}
            ${infoRow('📅', 'Date', p.date)}
            ${infoRow('🕐', 'Time', p.time)}
            ${p.clinicAddress ? infoRow('📍', 'Address', p.clinicAddress) : ''}
        `)}

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
            <tr>
                <td style="background-color:#D1FAE5;border-left:4px solid ${BRAND.successGreen};padding:12px 16px;border-radius:0 6px 6px 0;">
                    <p style="margin:0;font-size:13px;color:#065F46;">
                        <strong>📋 Reminders</strong><br>
                        • Please carry any relevant medical records or reports<br>
                        • Arrive 10 minutes before your scheduled time<br>
                        • Contact the clinic if you need to reschedule
                    </p>
                </td>
            </tr>
        </table>
    `;
    return baseLayout('Appointment Confirmed', content);
}

/**
 * 24-Hour Reminder — sent 24 hours before the appointment
 */
export function appointmentReminder24hEmail(p: AppointmentEmailPayload): string {
    const content = `
        <div style="text-align:center;margin-bottom:20px;">
            <div style="display:inline-block;width:56px;height:56px;border-radius:50%;background-color:#FEF3C7;line-height:56px;font-size:28px;text-align:center;">🔔</div>
        </div>

        <h2 style="margin:0 0 8px;font-size:22px;color:${BRAND.textDark};text-align:center;">Appointment Tomorrow</h2>
        <p style="margin:0 0 20px;font-size:15px;color:${BRAND.textMuted};text-align:center;">
            Hi <strong>${p.patientName}</strong>, this is a friendly reminder that your appointment is <strong>tomorrow</strong>.
        </p>

        ${detailsCard(`
            ${infoRow('👨‍⚕️', 'Doctor', `Dr. ${p.doctorName}`)}
            ${infoRow('🏥', 'Clinic', p.clinicName)}
            ${infoRow('📅', 'Date', p.date)}
            ${infoRow('🕐', 'Time', p.time)}
            ${p.clinicAddress ? infoRow('📍', 'Address', p.clinicAddress) : ''}
        `)}

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
            <tr>
                <td style="background-color:#EFF6FF;border-left:4px solid #3B82F6;padding:12px 16px;border-radius:0 6px 6px 0;">
                    <p style="margin:0;font-size:13px;color:#1E40AF;">
                        <strong>💡 Quick Checklist</strong><br>
                        • Medical records / previous prescriptions<br>
                        • Valid ID proof<br>
                        • List of current medications<br>
                        • Arrive 10 minutes early
                    </p>
                </td>
            </tr>
        </table>
    `;
    return baseLayout('Appointment Tomorrow', content);
}

/**
 * 2-Hour Reminder — sent 2 hours before the appointment
 */
export function appointmentReminder2hEmail(p: AppointmentEmailPayload): string {
    const content = `
        <div style="text-align:center;margin-bottom:20px;">
            <div style="display:inline-block;width:56px;height:56px;border-radius:50%;background-color:#FEE2E2;line-height:56px;font-size:28px;text-align:center;">⏰</div>
        </div>

        <h2 style="margin:0 0 8px;font-size:22px;color:${BRAND.textDark};text-align:center;">Your Appointment Is In 2 Hours</h2>
        <p style="margin:0 0 20px;font-size:15px;color:${BRAND.textMuted};text-align:center;">
            Hi <strong>${p.patientName}</strong>, please start heading to the clinic soon.
        </p>

        ${detailsCard(`
            ${infoRow('👨‍⚕️', 'Doctor', `Dr. ${p.doctorName}`)}
            ${infoRow('🏥', 'Clinic', p.clinicName)}
            ${infoRow('🕐', 'Time', p.time)}
            ${p.clinicAddress ? infoRow('📍', 'Address', p.clinicAddress) : ''}
        `)}

        <p style="margin:20px 0 0;font-size:14px;color:${BRAND.textDark};text-align:center;font-weight:600;">
            We look forward to seeing you shortly! 🙌
        </p>
    `;
    return baseLayout('Appointment In 2 Hours', content);
}

/**
 * Feedback Request — sent after appointment completion
 */
export function feedbackRequestEmail(p: AppointmentEmailPayload): string {
    const content = `
        <div style="text-align:center;margin-bottom:20px;">
            <div style="display:inline-block;width:56px;height:56px;border-radius:50%;background-color:#EDE9FE;line-height:56px;font-size:28px;text-align:center;">💬</div>
        </div>

        <h2 style="margin:0 0 8px;font-size:22px;color:${BRAND.textDark};text-align:center;">How Was Your Visit?</h2>
        <p style="margin:0 0 20px;font-size:15px;color:${BRAND.textMuted};text-align:center;">
            Dear <strong>${p.patientName}</strong>, thank you for visiting <strong>${p.clinicName}</strong>
            with <strong>Dr. ${p.doctorName}</strong>. We'd love to hear about your experience.
        </p>

        <!-- Star rating visual -->
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 16px;">
            <tr>
                <td style="font-size:32px;padding:0 4px;">⭐</td>
                <td style="font-size:32px;padding:0 4px;">⭐</td>
                <td style="font-size:32px;padding:0 4px;">⭐</td>
                <td style="font-size:32px;padding:0 4px;">⭐</td>
                <td style="font-size:32px;padding:0 4px;">⭐</td>
            </tr>
        </table>

        <p style="margin:0 0 8px;font-size:14px;color:${BRAND.textMuted};text-align:center;">
            Your feedback helps us improve our services
        </p>

        ${p.feedbackUrl ? ctaButton('Share Your Feedback →', p.feedbackUrl) : ''}

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
            <tr>
                <td style="background-color:#F3F4F6;padding:12px 16px;border-radius:6px;">
                    <p style="margin:0;font-size:12px;color:${BRAND.textMuted};text-align:center;">
                        🔒 Your feedback is confidential and helps us serve you better.<br>
                        This link expires in 24 hours.
                    </p>
                </td>
            </tr>
        </table>
    `;
    return baseLayout('Share Your Feedback', content);
}

/**
 * Doctor New Booking — sent to the doctor when a patient books an appointment
 */
export function doctorNewBookingEmail(p: AppointmentEmailPayload): string {
    const content = `
        <h2 style="margin:0 0 8px;font-size:22px;color:${BRAND.textDark};">New Appointment Booked</h2>
        <p style="margin:0 0 20px;font-size:15px;color:${BRAND.textMuted};">
            Dear <strong>Dr. ${p.doctorName}</strong>, a new appointment has been booked with you.
        </p>

        ${detailsCard(`
            ${infoRow('👤', 'Patient', p.patientName)}
            ${infoRow('🏥', 'Clinic', p.clinicName)}
            ${infoRow('📅', 'Date', p.date)}
            ${infoRow('🕐', 'Time', p.time)}
        `)}

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
            <tr>
                <td style="background-color:#EFF6FF;border-left:4px solid #3B82F6;padding:12px 16px;border-radius:0 6px 6px 0;">
                    <p style="margin:0;font-size:13px;color:#1E40AF;">
                        <strong>📋 Note</strong><br>
                        Please review your schedule and prepare for this appointment. Log in to the dashboard for full details.
                    </p>
                </td>
            </tr>
        </table>
    `;
    return baseLayout('New Appointment Booked', content);
}

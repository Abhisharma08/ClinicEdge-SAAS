import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: Number(process.env.SMTP_PORT) || 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }

    async sendEmail(to: string, subject: string, html: string) {
        try {
            const info = await this.transporter.sendMail({
                from: process.env.SMTP_FROM || '"Clinic Edgle" <noreply@clinicedgle.com>',
                to,
                subject,
                html,
            });

            this.logger.log(`Email sent: ${info.messageId}`);
            return info;
        } catch (error) {
            this.logger.error('Failed to send email', error);
            throw error;
        }
    }
}

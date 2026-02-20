import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private transporter: nodemailer.Transporter;

    constructor() {
        const port = Number(process.env.SMTP_PORT) || 587;
        const secure = port === 465; // Port 465 uses implicit TLS

        this.logger.log(
            `Initializing SMTP: host=${process.env.SMTP_HOST}, port=${port}, secure=${secure}, user=${process.env.SMTP_USER || 'NOT SET'}`,
        );

        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port,
            secure,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }

    async sendEmail(to: string, subject: string, html: string) {
        try {
            this.logger.log(`Sending email to: ${to} | Subject: ${subject}`);

            const info = await this.transporter.sendMail({
                from: process.env.SMTP_FROM || '"ClinicEdge" <noreply@clinicedge.com>',
                to,
                subject,
                html,
            });

            this.logger.log(`Email sent successfully: ${info.messageId} → ${to}`);
            return info;
        } catch (error) {
            this.logger.error(`Failed to send email to ${to}:`, error.message);
            throw error;
        }
    }
}

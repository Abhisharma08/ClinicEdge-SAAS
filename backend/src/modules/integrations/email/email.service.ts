import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export interface SmtpConfig {
    host: string;
    port: number;
    user: string;
    pass: string;
    from?: string;
}

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private defaultTransporter: nodemailer.Transporter;
    private clinicTransporters: Map<string, nodemailer.Transporter> = new Map();

    constructor() {
        const port = Number(process.env.SMTP_PORT) || 587;
        const secure = port === 465;

        this.logger.log(
            `Initializing default SMTP: host=${process.env.SMTP_HOST}, port=${port}, secure=${secure}, user=${process.env.SMTP_USER || 'NOT SET'}`,
        );

        this.defaultTransporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port,
            secure,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }

    /**
     * Create or get a cached transporter for a clinic's SMTP config
     */
    private getTransporter(smtpConfig?: SmtpConfig): nodemailer.Transporter {
        if (!smtpConfig || !smtpConfig.host || !smtpConfig.user) {
            return this.defaultTransporter;
        }

        const cacheKey = `${smtpConfig.host}:${smtpConfig.port}:${smtpConfig.user}`;

        if (!this.clinicTransporters.has(cacheKey)) {
            const port = smtpConfig.port || 587;
            const secure = port === 465;

            this.logger.log(`Creating clinic SMTP transporter: host=${smtpConfig.host}, port=${port}, user=${smtpConfig.user}`);

            this.clinicTransporters.set(cacheKey, nodemailer.createTransport({
                host: smtpConfig.host,
                port,
                secure,
                auth: {
                    user: smtpConfig.user,
                    pass: smtpConfig.pass,
                },
            }));
        }

        return this.clinicTransporters.get(cacheKey)!;
    }

    async sendEmail(to: string, subject: string, html: string, smtpConfig?: SmtpConfig) {
        try {
            this.logger.log(`Sending email to: ${to} | Subject: ${subject}`);

            const transporter = this.getTransporter(smtpConfig);
            const from = smtpConfig?.from || process.env.SMTP_FROM || '"ClinicEdge" <noreply@clinicedge.com>';

            const info = await transporter.sendMail({
                from,
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

import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { InteraktService } from '../integrations/interakt/interakt.service';
import { EmailService } from '../integrations/email/email.service';
import { NotificationType, NotificationChannel, NotificationStatus } from '@prisma/client';
import { generateSecureToken } from '../../common/utils/encryption.util';
import {
    appointmentCreatedEmail,
    appointmentConfirmedEmail,
    appointmentReminder24hEmail,
    appointmentReminder2hEmail,
    feedbackRequestEmail,
    doctorNewBookingEmail,
    AppointmentEmailPayload,
} from '../integrations/email/email-templates';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(
        private prisma: PrismaService,
        private redisService: RedisService,
        @Inject(forwardRef(() => InteraktService))
        private interaktService: InteraktService,
        private emailService: EmailService,
    ) { }

    /**
     * Check if clinic has notifications enabled (defaults to true)
     */
    private async isNotificationsEnabled(clinicId: string): Promise<boolean> {
        try {
            const clinic = await this.prisma.clinic.findUnique({
                where: { id: clinicId },
                select: { settings: true },
            });
            const settings = (clinic?.settings as any) || {};
            // Default to true if not explicitly set
            return settings.notificationsEnabled !== false;
        } catch {
            return true; // fail-open: send notifications if we can't read settings
        }
    }

    /**
     * Schedule all notifications for a new appointment
     */
    async scheduleAppointmentNotifications(appointment: any) {
        const appointmentDate = new Date(appointment.appointmentDate);
        const startTime = new Date(appointment.startTime);

        // Combine date and time
        const appointmentDateTime = new Date(
            appointmentDate.getFullYear(),
            appointmentDate.getMonth(),
            appointmentDate.getDate(),
            startTime.getHours(),
            startTime.getMinutes(),
        );

        const commonPayload = {
            patientName: appointment.patient?.name,
            patientPhone: appointment.patient?.phone,
            patientEmail: appointment.patient?.email,
            doctorName: appointment.doctor?.name,
            clinicName: appointment.clinic?.name,
            clinicAddress: appointment.clinic?.address,
            date: appointmentDate.toISOString().split('T')[0],
            time: `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`,
        };

        // Check admin notification toggle
        const enabled = await this.isNotificationsEnabled(appointment.clinicId);

        if (enabled) {
            // Create notification: Appointment Created (WhatsApp)
            if (appointment.patient?.whatsappConsent) {
                await this.createNotification({
                    clinicId: appointment.clinicId,
                    appointmentId: appointment.id,
                    type: NotificationType.APPOINTMENT_CREATED,
                    channel: NotificationChannel.WHATSAPP,
                    scheduledAt: new Date(),
                    payload: commonPayload,
                });
            }

            // Create notification: Appointment Created (Email to patient)
            if (appointment.patient?.email) {
                await this.createNotification({
                    clinicId: appointment.clinicId,
                    appointmentId: appointment.id,
                    type: NotificationType.APPOINTMENT_CREATED,
                    channel: NotificationChannel.EMAIL,
                    scheduledAt: new Date(),
                    payload: commonPayload,
                });
            }

            // Send booking confirmation email to the DOCTOR
            try {
                const doctor = await this.prisma.doctor.findUnique({
                    where: { id: appointment.doctorId },
                    select: { user: { select: { email: true } } },
                });
                if (doctor?.user?.email) {
                    await this.createNotification({
                        clinicId: appointment.clinicId,
                        appointmentId: appointment.id,
                        type: NotificationType.APPOINTMENT_CREATED,
                        channel: NotificationChannel.EMAIL,
                        scheduledAt: new Date(),
                        payload: {
                            ...commonPayload,
                            recipientEmail: doctor.user.email,
                            recipientType: 'DOCTOR',
                        },
                    });
                }
            } catch (error) {
                this.logger.warn(`Failed to send doctor booking email: ${error.message}`);
            }

            // Schedule 24h reminder (WhatsApp)
            const reminder24h = new Date(appointmentDateTime.getTime() - 24 * 60 * 60 * 1000);
            if (reminder24h > new Date() && appointment.patient?.whatsappConsent) {
                await this.createNotification({
                    clinicId: appointment.clinicId,
                    appointmentId: appointment.id,
                    type: NotificationType.APPOINTMENT_REMINDER_24H,
                    channel: NotificationChannel.WHATSAPP,
                    scheduledAt: reminder24h,
                    payload: commonPayload,
                });
            }

            // Schedule 2h reminder
            const reminder2h = new Date(appointmentDateTime.getTime() - 2 * 60 * 60 * 1000);
            if (reminder2h > new Date() && appointment.patient?.whatsappConsent) {
                await this.createNotification({
                    clinicId: appointment.clinicId,
                    appointmentId: appointment.id,
                    type: NotificationType.APPOINTMENT_REMINDER_2H,
                    channel: NotificationChannel.WHATSAPP,
                    scheduledAt: reminder2h,
                    payload: commonPayload,
                });
            }
        } else {
            this.logger.log(`Notifications disabled for clinic ${appointment.clinicId}, skipping external notifications`);
        }

        // Dashboard notifications are ALWAYS created regardless of toggle
        await this.createNotification({
            clinicId: appointment.clinicId,
            appointmentId: appointment.id,
            type: NotificationType.APPOINTMENT_CREATED,
            channel: NotificationChannel.DASHBOARD,
            scheduledAt: new Date(),
            payload: {
                message: `New appointment booked: ${appointment.patient?.name} with Dr. ${appointment.doctor?.name}`,
            },
        });

        this.logger.log(`Scheduled notifications for appointment ${appointment.id}`);
    }

    /**
     * Send appointment confirmation notification
     */
    async sendAppointmentConfirmed(appointment: any) {
        const enabled = await this.isNotificationsEnabled(appointment.clinicId);
        if (!enabled) {
            this.logger.log(`Notifications disabled for clinic ${appointment.clinicId}, skipping confirmation`);
            return;
        }

        const payload = {
            patientPhone: appointment.patient?.phone,
            patientName: appointment.patient?.name,
            patientEmail: appointment.patient?.email,
            doctorName: appointment.doctor?.name,
            clinicName: appointment.clinic?.name,
        };

        if (appointment.patient?.whatsappConsent) {
            await this.createNotification({
                clinicId: appointment.clinicId,
                appointmentId: appointment.id,
                type: NotificationType.APPOINTMENT_CONFIRMED,
                channel: NotificationChannel.WHATSAPP,
                scheduledAt: new Date(),
                payload,
            });
        }

        if (appointment.patient?.email) {
            await this.createNotification({
                clinicId: appointment.clinicId,
                appointmentId: appointment.id,
                type: NotificationType.APPOINTMENT_CONFIRMED,
                channel: NotificationChannel.EMAIL,
                scheduledAt: new Date(),
                payload,
            });
        }
    }

    /**
     * Send feedback request after appointment completion
     */
    async sendFeedbackRequest(appointment: any) {
        const enabled = await this.isNotificationsEnabled(appointment.clinicId);
        if (!enabled) {
            this.logger.log(`Notifications disabled for clinic ${appointment.clinicId}, skipping feedback request`);
            return;
        }

        // Generate feedback token
        const feedbackToken = generateSecureToken(32);
        const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Create feedback record with token
        await this.prisma.feedback.create({
            data: {
                appointmentId: appointment.id,
                clinicId: appointment.clinicId,
                patientId: appointment.patientId,
                rating: 0, // Will be updated when feedback is submitted
                token: feedbackToken,
                tokenExpiresAt,
            },
        });

        const feedbackUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/feedback/${feedbackToken}`;
        const payload = {
            patientPhone: appointment.patient?.phone,
            patientName: appointment.patient?.name,
            patientEmail: appointment.patient?.email,
            doctorName: appointment.doctor?.name,
            clinicName: appointment.clinic?.name,
            feedbackUrl,
        };

        if (appointment.patient?.whatsappConsent) {
            await this.createNotification({
                clinicId: appointment.clinicId,
                appointmentId: appointment.id,
                type: NotificationType.FEEDBACK_REQUEST,
                channel: NotificationChannel.WHATSAPP,
                scheduledAt: new Date(),
                payload,
            });
        }

        if (appointment.patient?.email) {
            await this.createNotification({
                clinicId: appointment.clinicId,
                appointmentId: appointment.id,
                type: NotificationType.FEEDBACK_REQUEST,
                channel: NotificationChannel.EMAIL,
                scheduledAt: new Date(),
                payload,
            });
        }

        this.logger.log(`Feedback request sent for appointment ${appointment.id}`);
    }

    /**
     * Create a notification record
     */
    private async createNotification(data: {
        clinicId: string;
        appointmentId: string;
        type: NotificationType;
        channel: NotificationChannel;
        scheduledAt: Date;
        payload: any;
        userId?: string;
    }) {
        const notification = await this.prisma.notification.create({
            data: {
                clinicId: data.clinicId,
                appointmentId: data.appointmentId,
                userId: data.userId,
                type: data.type,
                channel: data.channel,
                status: NotificationStatus.PENDING,
                scheduledAt: data.scheduledAt,
                payload: data.payload,
            },
        });

        // If scheduled for now, send immediately
        if (data.scheduledAt <= new Date()) {
            await this.processNotification(notification);
        }

        return notification;
    }

    /**
     * Process and send a notification
     */
    async processNotification(notification: any) {
        try {
            if (notification.channel === NotificationChannel.WHATSAPP) {
                await this.sendWhatsAppNotification(notification);
            } else if (notification.channel === NotificationChannel.EMAIL) {
                await this.sendEmailNotification(notification);
            } else if (notification.channel === NotificationChannel.DASHBOARD) {
                // Dashboard notifications are just marked as sent
                await this.updateNotificationStatus(notification.id, NotificationStatus.SENT);
            }
        } catch (error) {
            this.logger.error(`Failed to process notification ${notification.id}:`, error);
            await this.updateNotificationStatus(
                notification.id,
                NotificationStatus.FAILED,
                error.message,
            );
        }
    }

    /**
     * Send WhatsApp notification via Interakt
     */
    private async sendWhatsAppNotification(notification: any) {
        const payload = notification.payload;

        if (!payload.patientPhone) {
            throw new Error('Patient phone number is required');
        }

        try {
            const result = await this.interaktService.sendTemplateMessage(
                payload.patientPhone,
                this.getTemplateName(notification.type),
                this.getTemplateParams(notification.type, payload),
            );

            await this.prisma.notification.update({
                where: { id: notification.id },
                data: {
                    status: NotificationStatus.SENT,
                    externalId: result.id,
                    sentAt: new Date(),
                },
            });
            this.logger.log(`WhatsApp notification sent: ${notification.id}`);
        } catch (err) {
            // If WhatsApp fails, maybe try to schedule Email fallback if not already scheduled?
            // For now just log error
            throw err;
        }
    }

    /**
     * Send Email notification
     */
    private async sendEmailNotification(notification: any) {
        const payload = notification.payload;

        // Use recipientEmail if set (for doctor emails), otherwise fall back to patientEmail
        const recipientEmail = payload.recipientEmail || payload.patientEmail;
        if (!recipientEmail) {
            throw new Error('Recipient email is required');
        }

        const subject = this.getEmailSubject(notification.type, payload.recipientType);
        const html = this.getEmailHtml(notification.type, payload);

        await this.emailService.sendEmail(recipientEmail, subject, html);

        await this.prisma.notification.update({
            where: { id: notification.id },
            data: {
                status: NotificationStatus.SENT,
                sentAt: new Date(),
            },
        });

        this.logger.log(`Email notification sent: ${notification.id}`);
    }

    private getEmailSubject(type: NotificationType, recipientType?: string): string {
        switch (type) {
            case NotificationType.APPOINTMENT_CREATED:
                return recipientType === 'DOCTOR' ? 'New Appointment Booked With You' : 'Appointment Booking Confirmation';
            case NotificationType.APPOINTMENT_CONFIRMED:
                return 'Appointment Confirmed';
            case NotificationType.APPOINTMENT_REMINDER_24H:
                return 'Appointment Reminder (Tomorrow)';
            case NotificationType.APPOINTMENT_REMINDER_2H:
                return 'Appointment Reminder (Upcoming)';
            case NotificationType.FEEDBACK_REQUEST:
                return 'How was your visit?';
            default:
                return 'Notification';
        }
    }

    private getEmailHtml(type: NotificationType, payload: any): string {
        const templatePayload: AppointmentEmailPayload = {
            patientName: payload.patientName || 'Patient',
            doctorName: payload.doctorName || 'Doctor',
            clinicName: payload.clinicName || 'Clinic',
            clinicAddress: payload.clinicAddress,
            date: payload.date || '',
            time: payload.time || '',
            feedbackUrl: payload.feedbackUrl,
        };

        switch (type) {
            case NotificationType.APPOINTMENT_CREATED:
                return payload.recipientType === 'DOCTOR'
                    ? doctorNewBookingEmail(templatePayload)
                    : appointmentCreatedEmail(templatePayload);
            case NotificationType.APPOINTMENT_CONFIRMED:
                return appointmentConfirmedEmail(templatePayload);
            case NotificationType.APPOINTMENT_REMINDER_24H:
                return appointmentReminder24hEmail(templatePayload);
            case NotificationType.APPOINTMENT_REMINDER_2H:
                return appointmentReminder2hEmail(templatePayload);
            case NotificationType.FEEDBACK_REQUEST:
                return feedbackRequestEmail(templatePayload);
            default:
                return appointmentCreatedEmail(templatePayload);
        }
    }

    private getTemplateName(type: NotificationType): string {
        const templates: Record<NotificationType, string> = {
            APPOINTMENT_CREATED: 'appointment_booking_confirmation',
            APPOINTMENT_CONFIRMED: 'appointment_confirmed',
            APPOINTMENT_REMINDER_24H: 'appointment_reminder_24h',
            APPOINTMENT_REMINDER_2H: 'appointment_reminder_2h',
            APPOINTMENT_COMPLETED: 'appointment_completed',
            FEEDBACK_REQUEST: 'feedback_request',
        };
        return templates[type];
    }

    private getTemplateParams(type: NotificationType, payload: any): string[] {
        switch (type) {
            case NotificationType.APPOINTMENT_CREATED:
            case NotificationType.APPOINTMENT_CONFIRMED:
                return [payload.patientName, payload.doctorName, payload.date, payload.time];
            case NotificationType.APPOINTMENT_REMINDER_24H:
            case NotificationType.APPOINTMENT_REMINDER_2H:
                return [payload.patientName, payload.doctorName, payload.time];
            case NotificationType.FEEDBACK_REQUEST:
                return [payload.patientName, payload.feedbackUrl];
            default:
                return [];
        }
    }

    private async updateNotificationStatus(
        id: string,
        status: NotificationStatus,
        errorMessage?: string,
    ) {
        await this.prisma.notification.update({
            where: { id },
            data: {
                status,
                errorMessage,
                ...(status === NotificationStatus.SENT && { sentAt: new Date() }),
            },
        });
    }

    /**
     * Get dashboard notifications for a user
     */
    async getDashboardNotifications(clinicId: string, userId?: string) {
        return this.prisma.notification.findMany({
            where: {
                clinicId,
                channel: NotificationChannel.DASHBOARD,
                OR: [
                    { userId: userId },      // Specific to this user
                    { userId: null }         // Global for the clinic (Admins)
                ]
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }

    /**
     * Mark notification as read
     */
    async markAsRead(id: string) {
        return this.prisma.notification.update({
            where: { id },
            data: { status: NotificationStatus.READ },
        });
    }

    /**
     * Mark all unread dashboard notifications as read for a clinic/user
     */
    async markAllAsRead(clinicId: string, userId?: string) {
        const result = await this.prisma.notification.updateMany({
            where: {
                clinicId,
                channel: NotificationChannel.DASHBOARD,
                status: { not: NotificationStatus.READ },
                OR: [
                    { userId: userId },
                    { userId: null },
                ],
            },
            data: { status: NotificationStatus.READ },
        });
        return { updated: result.count };
    }
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotificationStatus } from '@prisma/client';

interface InteraktResponse {
    id: string;
    status: string;
}

@Injectable()
export class InteraktService {
    private readonly logger = new Logger(InteraktService.name);
    private readonly apiKey: string;
    private readonly baseUrl: string;
    private readonly maxRetries = 3;

    constructor(
        private configService: ConfigService,
        private prisma: PrismaService,
    ) {
        this.apiKey = this.configService.get<string>('interakt.apiKey') || '';
        this.baseUrl = this.configService.get<string>('interakt.baseUrl') || 'https://api.interakt.ai/v1';
    }

    /**
     * Send a template message via Interakt WhatsApp API
     */
    async sendTemplateMessage(
        phoneNumber: string,
        templateName: string,
        params: string[],
    ): Promise<InteraktResponse> {
        // Normalize phone number (remove + and spaces)
        const normalizedPhone = this.normalizePhoneNumber(phoneNumber);

        const payload = {
            countryCode: '+91',
            phoneNumber: normalizedPhone,
            type: 'Template',
            template: {
                name: templateName,
                languageCode: 'en',
                bodyValues: params,
            },
        };

        return this.sendWithRetry(payload);
    }

    /**
     * Send message with retry logic
     */
    private async sendWithRetry(
        payload: any,
        attempt: number = 1,
    ): Promise<InteraktResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/public/message/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Basic ${this.apiKey}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Interakt API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();

            this.logger.log(`Message sent to ${payload.phoneNumber}: ${data.id || data.result}`);

            return {
                id: data.id || data.result?.message_id || 'unknown',
                status: 'sent',
            };
        } catch (error) {
            this.logger.error(`Interakt send failed (attempt ${attempt}):`, error.message);

            if (attempt < this.maxRetries) {
                // Exponential backoff
                await this.delay(Math.pow(2, attempt) * 1000);
                return this.sendWithRetry(payload, attempt + 1);
            }

            throw error;
        }
    }

    /**
     * Process delivery status webhook
     */
    async handleDeliveryStatus(webhookData: any) {
        const { message_id, status, error } = webhookData;

        if (!message_id) {
            this.logger.warn('Received webhook without message_id');
            return;
        }

        // Find notification by external ID
        const notification = await this.prisma.notification.findFirst({
            where: { externalId: message_id },
        });

        if (!notification) {
            this.logger.warn(`Notification not found for message_id: ${message_id}`);
            return;
        }

        // Map Interakt status to our status
        let notificationStatus: NotificationStatus;
        switch (status?.toLowerCase()) {
            case 'delivered':
                notificationStatus = NotificationStatus.DELIVERED;
                break;
            case 'read':
                notificationStatus = NotificationStatus.READ;
                break;
            case 'failed':
                notificationStatus = NotificationStatus.FAILED;
                break;
            default:
                notificationStatus = NotificationStatus.SENT;
        }

        await this.prisma.notification.update({
            where: { id: notification.id },
            data: {
                status: notificationStatus,
                errorMessage: error?.message,
            },
        });

        this.logger.log(`Updated notification ${notification.id} status to ${notificationStatus}`);
    }

    /**
     * Log message for audit
     */
    async logMessage(
        notificationId: string,
        phoneNumber: string,
        templateName: string,
        status: string,
        externalId?: string,
        error?: string,
    ) {
        // This could write to a separate message_logs table if needed
        this.logger.log(
            `Message Log: ${notificationId} | ${phoneNumber} | ${templateName} | ${status} | ${externalId || 'N/A'}`,
        );
    }

    private normalizePhoneNumber(phone: string): string {
        // Remove +, spaces, and country code if present
        let normalized = phone.replace(/[\s+\-]/g, '');

        // Remove country code if starts with 91
        if (normalized.startsWith('91') && normalized.length > 10) {
            normalized = normalized.substring(2);
        }

        return normalized;
    }

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

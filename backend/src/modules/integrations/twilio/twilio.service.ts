import { Injectable, Logger } from '@nestjs/common';

export interface TwilioConfig {
    accountSid: string;
    authToken: string;
    fromNumber: string;
}

@Injectable()
export class TwilioService {
    private readonly logger = new Logger(TwilioService.name);

    /**
     * Send an SMS using Twilio REST API (no SDK dependency)
     */
    async sendSms(to: string, body: string, config: TwilioConfig): Promise<{ sid: string; status: string }> {
        if (!config.accountSid || !config.authToken || !config.fromNumber) {
            throw new Error('Twilio credentials not configured');
        }

        const normalizedTo = this.normalizePhoneNumber(to);

        const url = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`;

        const auth = Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64');

        const params = new URLSearchParams({
            To: normalizedTo,
            From: config.fromNumber,
            Body: body,
        });

        try {
            this.logger.log(`Sending SMS to ${normalizedTo}`);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: params.toString(),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(`Twilio API error: ${data.message || data.code || response.status}`);
            }

            this.logger.log(`SMS sent successfully: SID=${data.sid} → ${normalizedTo}`);

            return {
                sid: data.sid,
                status: data.status,
            };
        } catch (error) {
            this.logger.error(`Failed to send SMS to ${normalizedTo}: ${error.message}`);
            throw error;
        }
    }

    private normalizePhoneNumber(phone: string): string {
        let normalized = phone.replace(/[\s\-()]/g, '');

        // Add +91 country code if not present
        if (!normalized.startsWith('+')) {
            if (normalized.startsWith('91') && normalized.length > 10) {
                normalized = '+' + normalized;
            } else {
                normalized = '+91' + normalized;
            }
        }

        return normalized;
    }
}

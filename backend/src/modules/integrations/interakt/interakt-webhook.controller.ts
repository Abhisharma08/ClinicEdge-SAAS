import { Controller, Post, Body, Headers, HttpCode, HttpStatus, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { InteraktService } from './interakt.service';
import { Public } from '../../../common/decorators';
import * as crypto from 'crypto';

@ApiTags('webhooks')
@Controller('webhooks/interakt')
export class InteraktWebhookController {
    private readonly logger = new Logger(InteraktWebhookController.name);

    constructor(
        private readonly interaktService: InteraktService,
        private readonly configService: ConfigService,
    ) { }

    @Post('delivery-status')
    @Public()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Handle Interakt delivery status webhook' })
    async handleDeliveryStatus(
        @Body() body: any,
        @Headers('x-interakt-signature') signature: string,
    ) {
        if (!signature) {
            this.logger.warn('Webhook received without signature');
            throw new UnauthorizedException('Missing signature');
        }

        const webhookSecret = this.configService.get<string>('interakt.webhookSecret');
        if (webhookSecret) {
            const hmac = crypto.createHmac('sha256', webhookSecret);
            // Must use raw body for accurate HMAC in production, 
            // but for JSON body, stringify can work if keys match exactly.
            const calculatedSignature = hmac.update(JSON.stringify(body)).digest('hex');

            if (calculatedSignature !== signature) {
                this.logger.warn(`Invalid signature. Expected: ${calculatedSignature}, Received: ${signature}`);
                throw new UnauthorizedException('Invalid signature');
            }
        } else {
            this.logger.warn('INTERAKT_WEBHOOK_SECRET is not configured. Webhook validation skipped.');
        }

        this.logger.log(`Received secure Interakt webhook: ${body.message_id || 'unknown'}`);

        // Process the webhook
        try {
            await this.interaktService.handleDeliveryStatus(body);
            return { success: true };
        } catch (error) {
            this.logger.error('Webhook processing failed:', error);
            return { success: false, error: error.message };
        }
    }

    @Post('message-status')
    @Public()
    @HttpCode(HttpStatus.OK)
    @ApiExcludeEndpoint()
    async handleMessageStatus(@Body() body: any) {
        // Alternative webhook endpoint for message status
        return this.handleDeliveryStatus(body, '');
    }
}

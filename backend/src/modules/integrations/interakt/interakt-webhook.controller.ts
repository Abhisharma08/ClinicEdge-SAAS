import { Controller, Post, Body, Headers, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { InteraktService } from './interakt.service';
import { Public } from '../../../common/decorators';

@ApiTags('webhooks')
@Controller('webhooks/interakt')
export class InteraktWebhookController {
    private readonly logger = new Logger(InteraktWebhookController.name);

    constructor(private readonly interaktService: InteraktService) { }

    @Post('delivery-status')
    @Public()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Handle Interakt delivery status webhook' })
    async handleDeliveryStatus(
        @Body() body: any,
        @Headers('x-interakt-signature') signature: string,
    ) {
        this.logger.log(`Received Interakt webhook: ${JSON.stringify(body)}`);

        // TODO: Verify webhook signature in production
        // For now, just process the webhook
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

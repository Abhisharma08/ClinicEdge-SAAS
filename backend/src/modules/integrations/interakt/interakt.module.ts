import { Module } from '@nestjs/common';
import { InteraktService } from './interakt.service';
import { InteraktWebhookController } from './interakt-webhook.controller';

@Module({
    controllers: [InteraktWebhookController],
    providers: [InteraktService],
    exports: [InteraktService],
})
export class InteraktModule { }

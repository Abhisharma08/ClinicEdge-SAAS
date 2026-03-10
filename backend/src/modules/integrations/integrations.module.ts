import { Module } from '@nestjs/common';
import { InteraktModule } from './interakt/interakt.module';
import { EmailService } from './email/email.service';
import { TwilioModule } from './twilio/twilio.module';

@Module({
    imports: [InteraktModule, TwilioModule],
    providers: [EmailService],
    exports: [InteraktModule, TwilioModule, EmailService],
})
export class IntegrationsModule { }

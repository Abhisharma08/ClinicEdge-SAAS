import { Module } from '@nestjs/common';
import { InteraktModule } from './interakt/interakt.module';
import { EmailService } from './email/email.service';

@Module({
    imports: [InteraktModule],
    providers: [EmailService],
    exports: [InteraktModule, EmailService],
})
export class IntegrationsModule { }

import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InteraktService } from '../integrations/interakt/interakt.service';

export interface SendCampaignDto {
    patientIds: string[];
    templateName: string;
    params: string[];
}

export interface CampaignResult {
    patientId: string;
    patientName: string;
    phone: string;
    status: 'sent' | 'failed' | 'skipped';
    error?: string;
}

@Injectable()
export class CampaignsService {
    private readonly logger = new Logger(CampaignsService.name);

    constructor(
        private prisma: PrismaService,
        private interaktService: InteraktService,
    ) { }

    async sendCampaign(
        dto: SendCampaignDto,
        clinicId: string,
    ): Promise<{ total: number; sent: number; failed: number; skipped: number; results: CampaignResult[] }> {
        // Fetch patients that belong to this clinic
        const patients = await this.prisma.patient.findMany({
            where: {
                id: { in: dto.patientIds },
                patientClinics: { some: { clinicId } },
            },
            select: {
                id: true,
                name: true,
                phone: true,
                whatsappConsent: true,
            },
        });

        const results: CampaignResult[] = [];
        let sent = 0;
        let failed = 0;
        let skipped = 0;

        for (const patient of patients) {
            // Skip patients without phone or consent
            if (!patient.phone || !patient.whatsappConsent) {
                results.push({
                    patientId: patient.id,
                    patientName: patient.name,
                    phone: patient.phone || 'N/A',
                    status: 'skipped',
                    error: !patient.phone ? 'No phone number' : 'No WhatsApp consent',
                });
                skipped++;
                continue;
            }

            try {
                await this.interaktService.sendTemplateMessage(
                    patient.phone,
                    dto.templateName,
                    dto.params,
                );

                results.push({
                    patientId: patient.id,
                    patientName: patient.name,
                    phone: patient.phone,
                    status: 'sent',
                });
                sent++;
            } catch (error) {
                results.push({
                    patientId: patient.id,
                    patientName: patient.name,
                    phone: patient.phone,
                    status: 'failed',
                    error: error.message,
                });
                failed++;
            }

            // Small delay between sends to avoid API throttling
            await this.delay(100);
        }

        this.logger.log(
            `Campaign "${dto.templateName}" completed: ${sent} sent, ${failed} failed, ${skipped} skipped out of ${patients.length} patients`,
        );

        return { total: patients.length, sent, failed, skipped, results };
    }

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

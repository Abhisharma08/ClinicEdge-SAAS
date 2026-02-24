import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PublicService {
    constructor(private prisma: PrismaService) { }

    async getStats() {
        const [clinicsCount, doctorsCount, appointmentsCount] = await Promise.all([
            this.prisma.clinic.count({ where: { isActive: true } }),
            this.prisma.doctor.count({ where: { isActive: true } }),
            this.prisma.appointment.count()
        ]);

        return {
            clinics: clinicsCount > 10 ? clinicsCount : 10, // Maintain logic of '10+' if low
            doctors: doctorsCount > 50 ? doctorsCount : 50,
            appointments: appointmentsCount > 5000 ? appointmentsCount : 5000,
            averageRating: 4.8 // Kept static for now as reviews might be complex to aggregate publicly without PII
        };
    }
}

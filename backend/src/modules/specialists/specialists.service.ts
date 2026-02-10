import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SpecialistsService {
    constructor(private prisma: PrismaService) { }

    async findByClinic(clinicId: string) {
        return this.prisma.specialist.findMany({
            where: { clinicId, isActive: true },
            orderBy: { name: 'asc' },
        });
    }

    async findById(id: string) {
        const specialist = await this.prisma.specialist.findUnique({
            where: { id },
            include: {
                doctorSpecialists: {
                    include: { doctor: { select: { id: true, name: true } } },
                },
            },
        });

        if (!specialist) {
            throw new NotFoundException('Specialist not found');
        }

        return {
            ...specialist,
            doctors: specialist.doctorSpecialists.map((ds) => ds.doctor),
        };
    }

    async create(clinicId: string, name: string, description?: string) {
        return this.prisma.specialist.create({
            data: { clinicId, name, description },
        });
    }

    async update(id: string, name?: string, description?: string) {
        return this.prisma.specialist.update({
            where: { id },
            data: { ...(name && { name }), ...(description && { description }) },
        });
    }

    async remove(id: string) {
        return this.prisma.specialist.update({
            where: { id },
            data: { isActive: false },
        });
    }
}

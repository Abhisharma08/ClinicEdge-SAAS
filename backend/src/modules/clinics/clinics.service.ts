import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto, createPaginatedResult } from '../../common/dto';
import { CreateClinicDto, UpdateClinicDto } from './dto';

@Injectable()
export class ClinicsService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreateClinicDto) {
        return this.prisma.clinic.create({
            data: {
                name: dto.name,
                address: dto.address,
                phone: dto.phone,
                email: dto.email,
                googleReviewUrl: dto.googleReviewUrl,
                settings: dto.settings || {
                    timezone: 'Asia/Kolkata',
                    slotDuration: 30,
                    bookingAdvanceDays: 30,
                    cancelBeforeHours: 4,
                },
            },
        });
    }

    async findAll(pagination: PaginationDto, search?: string) {
        const where = {
            deletedAt: null,
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' as const } },
                    { email: { contains: search, mode: 'insensitive' as const } },
                ],
            }),
        };

        const [clinics, total] = await Promise.all([
            this.prisma.clinic.findMany({
                where,
                skip: pagination.skip,
                take: pagination.take,
                orderBy: { name: 'asc' },
            }),
            this.prisma.clinic.count({ where }),
        ]);

        return createPaginatedResult(clinics, total, pagination);
    }

    async findById(id: string) {
        const clinic = await this.prisma.clinic.findUnique({
            where: { id },
            include: {
                specialists: { where: { isActive: true } },
                _count: {
                    select: {
                        appointments: true,
                        doctorClinics: true,
                        patientClinics: true,
                    },
                },
            },
        });

        if (!clinic) {
            throw new NotFoundException('Clinic not found');
        }

        return clinic;
    }

    async update(id: string, dto: UpdateClinicDto) {
        await this.findById(id);

        return this.prisma.clinic.update({
            where: { id },
            data: dto,
        });
    }

    async softDelete(id: string) {
        await this.findById(id);

        return this.prisma.clinic.update({
            where: { id },
            data: { deletedAt: new Date(), isActive: false },
        });
    }

    async getPublicInfo(id: string) {
        const clinic = await this.prisma.clinic.findUnique({
            where: { id, isActive: true },
            select: {
                id: true,
                name: true,
                address: true,
                phone: true,
                specialists: {
                    where: { isActive: true },
                    select: { id: true, name: true, description: true },
                },
            },
        });

        if (!clinic) {
            throw new NotFoundException('Clinic not found');
        }

        return clinic;
    }
}

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

    async updateStatus(id: string, isActive: boolean) {
        await this.findById(id);

        return this.prisma.clinic.update({
            where: { id },
            data: { isActive },
        });
    }

    async exportData(id: string) {
        const clinicData = await this.prisma.clinic.findUnique({
            where: { id },
            include: {
                users: true,
                doctorClinics: { include: { doctor: true } },
                specialists: true,
                patientClinics: { include: { patient: true } },
                appointments: { include: { visitRecord: true, feedback: true } },
                notifications: true,
                auditLogs: true,
            },
        });

        if (!clinicData) {
            throw new NotFoundException('Clinic not found');
        }

        return clinicData;
    }

    async hardDelete(id: string) {
        await this.findById(id);

        return this.prisma.$transaction(async (tx) => {
            // Unbind relations with no cascade
            await tx.auditLog.deleteMany({ where: { clinicId: id } });
            await tx.notification.deleteMany({ where: { clinicId: id } });
            await tx.feedback.deleteMany({ where: { clinicId: id } });

            // Delete VisitRecords associated with this clinic
            await tx.visitRecord.deleteMany({ where: { clinicId: id } });

            await tx.appointment.deleteMany({ where: { clinicId: id } });
            await tx.patientClinic.deleteMany({ where: { clinicId: id } });
            await tx.doctorClinic.deleteMany({ where: { clinicId: id } });

            // Fetch complex relations to handle constraints
            const specialists = await tx.specialist.findMany({ where: { clinicId: id }, select: { id: true } });
            const specialistIds = specialists.map(s => s.id);

            const clinicUsers = await tx.user.findMany({ where: { clinicId: id }, select: { id: true } });
            const clinicUserIds = clinicUsers.map(u => u.id);

            const doctors = await tx.doctor.findMany({ where: { userId: { in: clinicUserIds } }, select: { id: true } });
            const doctorIds = doctors.map(d => d.id);

            const patients = await tx.patient.findMany({ where: { userId: { in: clinicUserIds } }, select: { id: true } });
            const patientIds = patients.map(p => p.id);

            // Prune DoctorSpecialist links
            const dsOr: any[] = [];
            if (specialistIds.length > 0) dsOr.push({ specialistId: { in: specialistIds } });
            if (doctorIds.length > 0) dsOr.push({ doctorId: { in: doctorIds } });
            if (dsOr.length > 0) {
                await tx.doctorSpecialist.deleteMany({ where: { OR: dsOr } });
            }

            // Prune external Doctor dependencies before deleting their global profile
            if (doctorIds.length > 0) {
                await tx.doctorClinic.deleteMany({ where: { doctorId: { in: doctorIds } } });
                await tx.visitRecord.deleteMany({ where: { doctorId: { in: doctorIds } } });
                await tx.appointment.deleteMany({ where: { doctorId: { in: doctorIds } } });
            }

            // Prune external Patient dependencies before deleting their global profile
            if (patientIds.length > 0) {
                await tx.patientClinic.deleteMany({ where: { patientId: { in: patientIds } } });
                await tx.feedback.deleteMany({ where: { patientId: { in: patientIds } } });
                await tx.visitRecord.deleteMany({ where: { patientId: { in: patientIds } } });
                await tx.appointment.deleteMany({ where: { patientId: { in: patientIds } } });
            }

            // Now delete global profiles tied to clinic-bound users
            if (clinicUserIds.length > 0) {
                await tx.notification.deleteMany({ where: { userId: { in: clinicUserIds } } });
                await tx.auditLog.deleteMany({ where: { userId: { in: clinicUserIds } } });
                await tx.doctor.deleteMany({ where: { userId: { in: clinicUserIds } } });
                await tx.patient.deleteMany({ where: { userId: { in: clinicUserIds } } });
            }

            // Now delete the Specialists
            await tx.specialist.deleteMany({ where: { clinicId: id } });

            // Finally delete the users and the actual clinic
            await tx.user.deleteMany({ where: { clinicId: id } });
            return tx.clinic.delete({ where: { id } });
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

    async getSettings(id: string) {
        const clinic = await this.prisma.clinic.findUnique({
            where: { id },
            select: { settings: true },
        });

        if (!clinic) {
            throw new NotFoundException('Clinic not found');
        }

        const defaults = {
            timezone: 'Asia/Kolkata',
            slotDuration: 30,
            bookingAdvanceDays: 30,
            cancelBeforeHours: 4,
            notificationsEnabled: true,
        };

        return { ...defaults, ...(clinic.settings as any || {}) };
    }

    async updateSettings(id: string, settings: Record<string, any>) {
        const clinic = await this.prisma.clinic.findUnique({
            where: { id },
            select: { settings: true },
        });

        if (!clinic) {
            throw new NotFoundException('Clinic not found');
        }

        const merged = { ...(clinic.settings as any || {}), ...settings };

        return this.prisma.clinic.update({
            where: { id },
            data: { settings: merged },
            select: { settings: true },
        });
    }
}

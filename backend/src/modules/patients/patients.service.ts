import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { CreatePatientDto, UpdatePatientDto } from './dto';
import { PaginationDto, createPaginatedResult } from '../../common/dto';
import { encrypt, decrypt } from '../../common/utils/encryption.util';

@Injectable()
export class PatientsService {
    private readonly encryptionKey: string;

    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
    ) {
        this.encryptionKey = this.configService.get<string>('encryption.key') || 'default-32-character-key-here!!';
    }

    async create(dto: CreatePatientDto, clinicId: string) {
        // Check for existing patient by phone
        const existing = await this.prisma.patient.findUnique({
            where: { phone: dto.phone },
        });

        if (existing) {
            // Link existing patient to this clinic
            await this.linkToClinic(existing.id, clinicId);
            return existing;
        }

        // Create new patient
        const patient = await this.prisma.patient.create({
            data: {
                name: dto.name,
                phone: dto.phone,
                phoneEncrypted: encrypt(dto.phone, this.encryptionKey),
                dob: dto.dob ? new Date(dto.dob) : null,
                dobEncrypted: dto.dob ? encrypt(dto.dob, this.encryptionKey) : null,
                gender: dto.gender,
                whatsappConsent: dto.whatsappConsent || false,
                consentAt: dto.whatsappConsent ? new Date() : null,
            },
        });

        // Link to clinic
        await this.linkToClinic(patient.id, clinicId);

        return patient;
    }

    async findByClinic(clinicId: string, pagination: PaginationDto, search?: string) {
        // Get patient IDs linked to this clinic
        const patientClinics = await this.prisma.patientClinic.findMany({
            where: { clinicId },
            select: { patientId: true },
        });

        const patientIds = patientClinics.map((pc) => pc.patientId);

        const where = {
            id: { in: patientIds },
            deletedAt: null,
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' as const } },
                    { phone: { contains: search } },
                ],
            }),
        };

        const [patients, total] = await Promise.all([
            this.prisma.patient.findMany({
                where,
                skip: pagination.skip,
                take: pagination.take,
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    dob: true,
                    gender: true,
                    whatsappConsent: true,
                    createdAt: true,
                },
                orderBy: { name: 'asc' },
            }),
            this.prisma.patient.count({ where }),
        ]);

        return createPaginatedResult(patients, total, pagination);
    }

    async findById(id: string) {
        const patient = await this.prisma.patient.findUnique({
            where: { id },
            include: {
                patientClinics: {
                    include: { clinic: { select: { name: true } } },
                },
                appointments: {
                    take: 5,
                    orderBy: { appointmentDate: 'desc' },
                    include: {
                        doctor: { select: { name: true } },
                        clinic: { select: { name: true } },
                    },
                },
            },
        });

        if (!patient) {
            throw new NotFoundException('Patient not found');
        }

        return patient;
    }

    async update(id: string, dto: UpdatePatientDto) {
        await this.findById(id);

        return this.prisma.patient.update({
            where: { id },
            data: {
                name: dto.name,
                dob: dto.dob ? new Date(dto.dob) : undefined,
                gender: dto.gender,
                whatsappConsent: dto.whatsappConsent,
                consentAt: dto.whatsappConsent ? new Date() : undefined,
            },
        });
    }

    async getVisitHistory(patientId: string, clinicId: string, pagination: PaginationDto) {
        const where = { patientId, clinicId };

        const [records, total] = await Promise.all([
            this.prisma.visitRecord.findMany({
                where,
                skip: pagination.skip,
                take: pagination.take,
                include: {
                    doctor: { select: { name: true } },
                    prescriptions: true,
                    attachments: true,
                    appointment: { select: { appointmentDate: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.visitRecord.count({ where }),
        ]);

        return createPaginatedResult(records, total, pagination);
    }

    async linkToClinic(patientId: string, clinicId: string) {
        const existing = await this.prisma.patientClinic.findUnique({
            where: { patientId_clinicId: { patientId, clinicId } },
        });

        if (!existing) {
            await this.prisma.patientClinic.create({
                data: { patientId, clinicId },
            });
        } else {
            await this.prisma.patientClinic.update({
                where: { patientId_clinicId: { patientId, clinicId } },
                data: { lastVisit: new Date() },
            });
        }
    }

    async delete(id: string) {
        return this.prisma.patient.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
}

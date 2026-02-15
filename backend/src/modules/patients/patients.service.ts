import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { CreatePatientDto, UpdatePatientDto } from './dto';
import { PaginationDto, createPaginatedResult } from '../../common/dto';
import { encrypt, decrypt } from '../../common/utils/encryption.util';

@Injectable()
export class PatientsService {
    private readonly logger = new Logger(PatientsService.name);
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
            // Check if patient was soft-deleted and reactivate
            if (existing.deletedAt) {
                await this.prisma.patient.update({
                    where: { id: existing.id },
                    data: {
                        deletedAt: null,
                        isActive: true,
                        // Optionally update name if provided, to respect new registration details
                        ...(dto.name && { name: dto.name }),
                        ...(dto.firstName && { firstName: dto.firstName }),
                        ...(dto.lastName && { lastName: dto.lastName })
                    },
                });
            }

            // Link existing patient to this clinic
            await this.linkToClinic(existing.id, clinicId);
            return existing;
        }

        // Auto-generate `name` from firstName + lastName if not provided
        const fullName = dto.name || `${dto.firstName} ${dto.lastName}`.trim();

        // Create new patient
        const patient = await this.prisma.patient.create({
            data: {
                name: fullName,
                firstName: dto.firstName,
                lastName: dto.lastName,
                phone: dto.phone,
                phoneEncrypted: encrypt(dto.phone, this.encryptionKey),
                dob: dto.dob ? new Date(dto.dob) : null,
                dobEncrypted: dto.dob ? encrypt(dto.dob, this.encryptionKey) : null,
                gender: dto.gender,
                email: dto.email,
                bloodGroup: dto.bloodGroup,
                allergies: dto.allergies,
                medicalHistory: dto.medicalHistory,
                // Address
                addressLine1: dto.addressLine1,
                addressLine2: dto.addressLine2,
                city: dto.city,
                state: dto.state,
                postalCode: dto.postalCode,
                country: dto.country || 'India',
                // Emergency contact
                emergencyName: dto.emergencyName,
                emergencyRelationship: dto.emergencyRelationship,
                emergencyPhone: dto.emergencyPhone,
                // Nominee
                nomineeName: dto.nomineeName,
                nomineeRelationship: dto.nomineeRelationship,
                nomineePhone: dto.nomineePhone,
                // Consent
                whatsappConsent: dto.whatsappConsent || false,
                consentAt: dto.whatsappConsent ? new Date() : null,
                dpdpConsent: dto.dpdpConsent || false,
                dpdpConsentAt: dto.dpdpConsent ? new Date() : null,
            },
        });

        // Link to clinic
        await this.linkToClinic(patient.id, clinicId);

        return patient;
    }

    async findByClinic(
        clinicId: string,
        pagination: PaginationDto,
        search?: string,
        fromDate?: string,
        toDate?: string,
        gender?: string,
        bloodGroup?: string,
        sortBy?: string,
        sortOrder?: 'asc' | 'desc',
    ) {
        const where: any = {
            deletedAt: null,
            patientClinics: { some: { clinicId } },
        };

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' as const } },
                { firstName: { contains: search, mode: 'insensitive' as const } },
                { lastName: { contains: search, mode: 'insensitive' as const } },
                { phone: { contains: search } },
                { email: { contains: search, mode: 'insensitive' as const } },
            ];
        }

        // Date filters — filter by patient createdAt
        if (fromDate || toDate) {
            where.createdAt = {};
            if (fromDate) where.createdAt.gte = new Date(fromDate);
            if (toDate) {
                const end = new Date(toDate);
                end.setHours(23, 59, 59, 999);
                where.createdAt.lte = end;
            }
        }

        // Gender filter
        if (gender && ['MALE', 'FEMALE', 'OTHER'].includes(gender.toUpperCase())) {
            where.gender = gender.toUpperCase();
        }

        // Blood Group filter
        if (bloodGroup) {
            where.bloodGroup = bloodGroup;
        }

        // Sorting
        const allowedSortFields = ['firstName', 'lastName', 'createdAt', 'dob', 'city', 'gender', 'phone'];
        const orderField = sortBy && allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
        const orderDirection = sortOrder === 'asc' ? 'asc' : 'desc';

        const [patients, total] = await Promise.all([
            this.prisma.patient.findMany({
                where,
                skip: pagination.skip,
                take: pagination.take,
                select: {
                    id: true,
                    name: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    dob: true,
                    gender: true,
                    email: true,
                    city: true,
                    state: true,
                    bloodGroup: true,
                    whatsappConsent: true,
                    dpdpConsent: true,
                    createdAt: true,
                },
                orderBy: { [orderField]: orderDirection },
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
                    take: 10,
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

        const data: any = { ...dto };

        // Auto-update `name` if firstName or lastName changed
        if (dto.firstName || dto.lastName) {
            const existing = await this.prisma.patient.findUnique({ where: { id }, select: { firstName: true, lastName: true } });
            const fn = dto.firstName ?? existing?.firstName ?? '';
            const ln = dto.lastName ?? existing?.lastName ?? '';
            data.name = `${fn} ${ln}`.trim();
        }

        if (dto.dob) {
            data.dob = new Date(dto.dob);
            data.dobEncrypted = encrypt(dto.dob, this.encryptionKey);
        }

        if (dto.whatsappConsent !== undefined) {
            data.consentAt = dto.whatsappConsent ? new Date() : null;
        }

        if (dto.dpdpConsent !== undefined) {
            data.dpdpConsentAt = dto.dpdpConsent ? new Date() : null;
        }

        return this.prisma.patient.update({ where: { id }, data });
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

    /**
     * Export all patients for a clinic (for CSV/XLSX export)
     */
    async exportAll(clinicId: string) {
        return this.prisma.patient.findMany({
            where: {
                deletedAt: null,
                patientClinics: { some: { clinicId } },
            },
            select: {
                firstName: true,
                lastName: true,
                name: true,
                phone: true,
                dob: true,
                gender: true,
                email: true,
                bloodGroup: true,
                allergies: true,
                medicalHistory: true,
                addressLine1: true,
                addressLine2: true,
                city: true,
                state: true,
                postalCode: true,
                country: true,
                emergencyName: true,
                emergencyRelationship: true,
                emergencyPhone: true,
                nomineeName: true,
                nomineeRelationship: true,
                nomineePhone: true,
                dpdpConsent: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
}

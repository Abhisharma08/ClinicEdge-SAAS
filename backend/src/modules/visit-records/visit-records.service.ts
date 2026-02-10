import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateVisitRecordDto, CreatePrescriptionDto } from './dto';
import { PdfService } from '../pdf/pdf.service';

import { UserRole } from '@prisma/client';

@Injectable()
export class VisitRecordsService {
    constructor(
        private prisma: PrismaService,
        private storageService: StorageService,
        private pdfService: PdfService,
    ) { }

    async generatePdf(id: string): Promise<Buffer> {
        const record = await this.findById(id);
        return this.pdfService.generatePrescription(record);
    }

    async create(dto: CreateVisitRecordDto, doctorId: string, clinicId: string) {
        // Verify appointment exists and belongs to this doctor/clinic
        const appointment = await this.prisma.appointment.findUnique({
            where: { id: dto.appointmentId },
        });

        if (!appointment) {
            throw new NotFoundException('Appointment not found');
        }

        if (appointment.doctorId !== doctorId || appointment.clinicId !== clinicId) {
            throw new ForbiddenException('You can only create records for your own appointments');
        }

        try {
            // Check if record already exists (idempotency)
            const existingRecord = await this.prisma.visitRecord.findUnique({
                where: { appointmentId: dto.appointmentId },
                include: { prescriptions: true }
            });

            if (existingRecord) {
                // Update existing record
                return await this.prisma.visitRecord.update({
                    where: { id: existingRecord.id },
                    data: {
                        symptoms: dto.symptoms,
                        diagnosis: dto.diagnosis,
                        notes: dto.notes,
                        followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : null,
                        prescriptions: {
                            deleteMany: {}, // Remove incomplete/old prescriptions
                            create: dto.prescriptions?.map((p) => ({
                                medication: p.medication,
                                dosage: p.dosage,
                                frequency: p.frequency,
                                duration: p.duration,
                                instructions: p.instructions,
                            })) || [],
                        },
                    },
                    include: {
                        prescriptions: true,
                        attachments: true,
                    },
                });
            }

            return await this.prisma.visitRecord.create({
                data: {
                    appointmentId: dto.appointmentId,
                    patientId: appointment.patientId,
                    doctorId,
                    clinicId,
                    symptoms: dto.symptoms,
                    diagnosis: dto.diagnosis,
                    notes: dto.notes,
                    followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : null,
                    prescriptions: {
                        create: dto.prescriptions?.map((p) => ({
                            medication: p.medication,
                            dosage: p.dosage,
                            frequency: p.frequency,
                            duration: p.duration,
                            instructions: p.instructions,
                        })) || [],
                    },
                },
                include: {
                    prescriptions: true,
                    attachments: true,
                },
            });
        } catch (error) {
            console.error('FAILED TO CREATE VISIT RECORD:', error);
            throw error;
        }
    }

    async findById(id: string) {
        const record = await this.prisma.visitRecord.findUnique({
            where: { id },
            include: {
                patient: { select: { id: true, name: true, dob: true, gender: true } },
                doctor: { select: { id: true, name: true, qualification: true } },
                clinic: { select: { name: true, address: true, phone: true, email: true } },
                appointment: { select: { appointmentDate: true, startTime: true } },
                prescriptions: true,
                attachments: true,
            },
        });

        if (!record) {
            throw new NotFoundException('Visit record not found');
        }

        return record;
    }

    async update(id: string, dto: Partial<CreateVisitRecordDto>, doctorId: string) {
        const record = await this.findById(id);

        // Only the creating doctor can update
        if (record.doctorId !== doctorId) {
            throw new ForbiddenException('You can only update your own records');
        }

        return this.prisma.visitRecord.update({
            where: { id },
            data: {
                symptoms: dto.symptoms,
                diagnosis: dto.diagnosis,
                notes: dto.notes,
                followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : undefined,
            },
            include: {
                prescriptions: true,
                attachments: true,
            },
        });
    }

    async addPrescription(visitRecordId: string, dto: CreatePrescriptionDto, doctorId: string) {
        const record = await this.findById(visitRecordId);

        if (record.doctorId !== doctorId) {
            throw new ForbiddenException('You can only add prescriptions to your own records');
        }

        return this.prisma.prescription.create({
            data: {
                visitRecordId,
                ...dto,
            },
        });
    }

    async addAttachment(visitRecordId: string, file: Express.Multer.File, doctorId: string) {
        const record = await this.findById(visitRecordId);

        if (record.doctorId !== doctorId) {
            throw new ForbiddenException('You can only add attachments to your own records');
        }

        // Upload to MinIO
        const fileUrl = await this.storageService.uploadFile(
            file,
            `visit-records/${visitRecordId}`,
        );

        return this.prisma.attachment.create({
            data: {
                visitRecordId,
                fileName: file.originalname,
                fileType: file.mimetype,
                fileUrl,
                fileSize: file.size,
            },
        });
    }

    async getByPatient(patientId: string, clinicId: string, userRole: UserRole, userId?: string) {
        const where: any = { patientId, clinicId };

        // Doctors can only see their own records
        if (userRole === UserRole.DOCTOR) {
            const doctor = await this.prisma.doctor.findUnique({
                where: { userId },
            });
            if (doctor) {
                where.doctorId = doctor.id;
            }
        }

        return this.prisma.visitRecord.findMany({
            where,
            include: {
                doctor: { select: { name: true } },
                prescriptions: true,
                appointment: { select: { appointmentDate: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
}

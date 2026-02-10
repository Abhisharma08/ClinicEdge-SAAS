import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { PaginationDto, createPaginatedResult } from '../../common/dto';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import { CreateDoctorDto, UpdateDoctorDto } from './dto';

@Injectable()
export class DoctorsService {
    private readonly logger = new Logger(DoctorsService.name);

    constructor(
        private prisma: PrismaService,
        private redisService: RedisService,
    ) { }

    async findByClinic(clinicId: string, pagination: PaginationDto, specialistId?: string, search?: string) {
        // Cache Key
        const page = pagination.page || 1;
        const limit = pagination.take || 20;
        const cacheKey = `doctors:search:${clinicId}:${specialistId || 'all'}:${search || 'all'}:${page}:${limit}`;

        // Check cache
        const cached = await this.redisService.get(cacheKey);
        if (cached) {
            this.logger.log(`Serving doctors from cache: ${cacheKey}`);
            return JSON.parse(cached);
        }

        // Build where clause
        const where: any = {
            clinicId,
            doctor: {
                isActive: true,
                deletedAt: null,
            }
        };

        if (specialistId) {
            where.doctor.doctorSpecialists = {
                some: { specialistId }
            };
        }

        if (search) {
            where.doctor.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [doctorClinics, total] = await Promise.all([
            this.prisma.doctorClinic.findMany({
                where,
                include: {
                    doctor: {
                        include: {
                            doctorSpecialists: {
                                include: { specialist: true },
                            },
                        },
                    },
                },
                skip: pagination.skip || 0,
                take: pagination.take || 20,
            }),
            this.prisma.doctorClinic.count({ where }),
        ]);

        const doctors = doctorClinics.map((dc) => ({
            ...dc.doctor,
            schedule: dc.schedule,
            specialists: dc.doctor.doctorSpecialists.map((ds) => ds.specialist),
            // Remove sensitive fields if any? Doctor doesn't have secure fields usually exposed here.
        }));

        const result = createPaginatedResult(doctors, total, pagination);

        // Cache result (5 minutes)
        await this.redisService.set(cacheKey, JSON.stringify(result), 300);

        return result;
    }

    private async invalidateClinicCache(clinicId: string) {
        await this.redisService.delPattern(`doctors:search:${clinicId}:*`);
        this.logger.log(`Invalidated cache for clinic ${clinicId}`);
    }

    async findById(id: string) {
        // ... (existing findById implementation) ...
        const doctor = await this.prisma.doctor.findUnique({
            where: { id },
            include: {
                user: { select: { email: true } },
                doctorClinics: {
                    include: { clinic: { select: { id: true, name: true } } },
                },
                doctorSpecialists: {
                    include: { specialist: { select: { id: true, name: true } } },
                },
            },
        });

        if (!doctor) {
            throw new NotFoundException('Doctor not found');
        }

        return {
            ...doctor,
            clinics: doctor.doctorClinics.map((dc) => ({
                ...dc.clinic,
                schedule: dc.schedule,
            })),
            specialists: doctor.doctorSpecialists.map((ds) => ds.specialist),
        };
    }

    async findByUserId(userId: string) {
        const doctor = await this.prisma.doctor.findUnique({
            where: { userId },
            include: {
                user: { select: { email: true } },
                doctorClinics: {
                    include: { clinic: { select: { id: true, name: true } } },
                },
                doctorSpecialists: {
                    include: { specialist: { select: { id: true, name: true } } },
                },
            },
        });

        if (!doctor) {
            throw new NotFoundException('Doctor profile not found');
        }

        return {
            ...doctor,
            clinics: doctor.doctorClinics.map((dc) => ({
                ...dc.clinic,
                schedule: dc.schedule,
            })),
            specialists: doctor.doctorSpecialists.map((ds) => ds.specialist),
        };
    }

    async getSchedule(doctorId: string, clinicId: string) {
        const doctorClinic = await this.prisma.doctorClinic.findUnique({
            where: {
                doctorId_clinicId: {
                    doctorId,
                    clinicId,
                },
            },
        });

        if (!doctorClinic) {
            throw new NotFoundException('Schedule not found for this doctor at the specified clinic');
        }

        return doctorClinic.schedule;
    }

    async updateSchedule(doctorId: string, clinicId: string, schedule: any) {
        const updated = await this.prisma.doctorClinic.update({
            where: {
                doctorId_clinicId: {
                    doctorId,
                    clinicId,
                },
            },
            data: {
                schedule,
            },
        });

        await this.invalidateClinicCache(clinicId);
        return updated.schedule;
    }

    async getAppointments(doctorId: string, date?: string, upcoming?: boolean, pagination?: PaginationDto) {
        const where: any = {
            doctorId,
        };

        if (date) {
            const searchDate = new Date(date);
            const startOfDay = new Date(searchDate.setHours(0, 0, 0, 0));
            const endOfDay = new Date(searchDate.setHours(23, 59, 59, 999));

            where.appointmentDate = {
                gte: startOfDay,
                lte: endOfDay,
            };
        } else if (upcoming) {
            where.appointmentDate = {
                gte: new Date(),
            };
        }

        const page = pagination?.page ? Number(pagination.page) : 1;
        const limit = pagination?.take ? Number(pagination.take) : 20;
        const skip = (page - 1) * limit;

        const [appointments, total] = await Promise.all([
            this.prisma.appointment.findMany({
                where,
                include: {
                    patient: true,
                    clinic: { select: { name: true } },
                },
                orderBy: { appointmentDate: 'asc' },
                skip,
                take: limit,
            }),
            this.prisma.appointment.count({ where }),
        ]);

        return createPaginatedResult(appointments, total, { page, take: limit, skip });
    }

    async create(dto: CreateDoctorDto, clinicId: string) {
        // ... (existing create logic) ...
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
            include: { doctor: true } // Include doctor to check status
        });

        let result;

        if (existingUser) {
            // ... existing user logic ...
            if (existingUser.isActive) {
                throw new ConflictException('Email already registered');
            }
            const hashedPassword = await bcrypt.hash(dto.password, 10);
            result = await this.prisma.$transaction(async (tx) => {
                // ... logic ...
                // 1. Reactivate user
                await tx.user.update({
                    where: { id: existingUser.id },
                    data: {
                        isActive: true,
                        passwordHash: hashedPassword,
                        clinicId
                    }
                });

                // 2. Reactivate/Update Doctor Profile
                let doctor = existingUser.doctor;
                if (doctor) {
                    doctor = await tx.doctor.update({
                        where: { id: doctor.id },
                        data: {
                            isActive: true,
                            deletedAt: null,
                            name: dto.name,
                            qualification: dto.qualification,
                            licenseNumber: dto.licenseNumber,
                            phone: dto.phone,
                        }
                    });
                } else {
                    doctor = await tx.doctor.create({
                        data: {
                            userId: existingUser.id,
                            name: dto.name,
                            qualification: dto.qualification,
                            licenseNumber: dto.licenseNumber,
                            phone: dto.phone,
                        }
                    });
                }

                // 3. Ensure DoctorClinic relation exists
                await tx.doctorClinic.upsert({
                    where: { doctorId_clinicId: { doctorId: doctor.id, clinicId } },
                    create: {
                        doctorId: doctor.id,
                        clinicId,
                        schedule: {
                            monday: { startTime: '09:00', endTime: '17:00', slotDuration: 30 },
                            tuesday: { startTime: '09:00', endTime: '17:00', slotDuration: 30 },
                            wednesday: { startTime: '09:00', endTime: '17:00', slotDuration: 30 },
                            thursday: { startTime: '09:00', endTime: '17:00', slotDuration: 30 },
                            friday: { startTime: '09:00', endTime: '17:00', slotDuration: 30 },
                            saturday: { startTime: '09:00', endTime: '13:00', slotDuration: 30 },
                        },
                    },
                    update: {}
                });

                // 4. Update Specialist
                if (dto.specialistId) {
                    await tx.doctorSpecialist.deleteMany({ where: { doctorId: doctor.id } });
                    await tx.doctorSpecialist.create({
                        data: {
                            doctorId: doctor.id,
                            specialistId: dto.specialistId,
                        },
                    });
                }

                return doctor;
            });
        } else {
            // ... new user logic ...
            const hashedPassword = await bcrypt.hash(dto.password, 10);

            result = await this.prisma.$transaction(async (tx) => {
                const user = await tx.user.create({
                    data: {
                        email: dto.email,
                        passwordHash: hashedPassword,
                        role: UserRole.DOCTOR,
                        clinicId,
                        isActive: true,
                    },
                });

                const doctor = await tx.doctor.create({
                    data: {
                        userId: user.id,
                        name: dto.name,
                        qualification: dto.qualification,
                        licenseNumber: dto.licenseNumber,
                        phone: dto.phone,
                    },
                });

                await tx.doctorClinic.create({
                    data: {
                        doctorId: doctor.id,
                        clinicId,
                        schedule: {
                            monday: { startTime: '09:00', endTime: '17:00', slotDuration: 30 },
                            tuesday: { startTime: '09:00', endTime: '17:00', slotDuration: 30 },
                            wednesday: { startTime: '09:00', endTime: '17:00', slotDuration: 30 },
                            thursday: { startTime: '09:00', endTime: '17:00', slotDuration: 30 },
                            friday: { startTime: '09:00', endTime: '17:00', slotDuration: 30 },
                            saturday: { startTime: '09:00', endTime: '13:00', slotDuration: 30 },
                        },
                    },
                });

                if (dto.specialistId) {
                    await tx.doctorSpecialist.create({
                        data: {
                            doctorId: doctor.id,
                            specialistId: dto.specialistId,
                        },
                    });
                }

                return doctor;
            });
        }

        await this.invalidateClinicCache(clinicId);
        return result;
    }

    async update(id: string, dto: UpdateDoctorDto) {
        const updated = await this.prisma.doctor.update({
            where: { id },
            data: dto,
            include: { doctorClinics: true } // Need clinicId to invalidate
        });

        // Invalidate for all clinics this doctor belongs to
        for (const dc of updated.doctorClinics) {
            await this.invalidateClinicCache(dc.clinicId);
        }

        return updated;
    }

    async delete(id: string) {
        // Soft delete by setting isActive = false
        const doctor = await this.prisma.doctor.findUnique({
            where: { id },
            include: { user: true, doctorClinics: true }
        });

        if (!doctor) {
            throw new NotFoundException('Doctor not found');
        }

        const result = await this.prisma.$transaction([
            this.prisma.doctor.update({
                where: { id },
                data: {
                    isActive: false,
                    deletedAt: new Date(),
                },
            }),
            this.prisma.user.update({
                where: { id: doctor.userId },
                data: { isActive: false },
            }),
        ]);

        // Invalidate for all clinics this doctor belongs to
        for (const dc of doctor.doctorClinics) {
            await this.invalidateClinicCache(dc.clinicId);
        }

        return result;
    }
}

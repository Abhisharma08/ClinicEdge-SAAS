import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ConflictException,
    InternalServerErrorException,
    HttpException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SlotsService } from './slots.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateAppointmentDto, UpdateAppointmentDto } from './dto';
import { PublicBookAppointmentDto } from './dto/public-book-appointment.dto';
import { PatientsService } from '../patients/patients.service';
import { PaginationDto, createPaginatedResult } from '../../common/dto';
import { AppointmentStatus, NotificationType } from '@prisma/client';
import { parseTime, isFutureDate, hoursBetween } from '../../common/utils/date.util';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AppointmentsService {
    private readonly logger = new Logger(AppointmentsService.name);

    constructor(
        private prisma: PrismaService,
        private slotsService: SlotsService,
        private notificationsService: NotificationsService,
        private patientsService: PatientsService,
    ) { }

    /**
     * Create a new appointment with idempotency and concurrent booking protection
     */
    async create(dto: CreateAppointmentDto, userId?: string) {
        try {
            // Check for idempotency
            if (dto.idempotencyKey) {
                const existing = await this.prisma.appointment.findUnique({
                    where: { idempotencyKey: dto.idempotencyKey },
                });
                if (existing) {
                    this.logger.log(`Idempotent request: returning existing appointment ${existing.id}`);
                    return existing;
                }
            }

            const appointmentDate = new Date(dto.appointmentDate);

            // Validate future date
            if (!isFutureDate(appointmentDate)) {
                throw new BadRequestException('Appointment date must be in the future');
            }

            // Acquire distributed lock for this slot
            const lockId = await this.slotsService.acquireSlotLock(
                dto.clinicId,
                dto.doctorId,
                dto.appointmentDate,
                dto.startTime,
            );

            if (!lockId) {
                throw new ConflictException('This slot is currently being booked. Please try again.');
            }

            try {
                // Check if user is Admin to bypass strict slot grid
                let isStrict = true;
                if (userId) {
                    const user = await this.prisma.user.findUnique({ where: { id: userId } });
                    if (user && (user.role === 'CLINIC_ADMIN' || user.role === 'SUPER_ADMIN')) {
                        isStrict = false;
                    }
                }

                // Double-check slot availability
                const isAvailable = await this.slotsService.isSlotAvailable(
                    dto.clinicId,
                    dto.doctorId,
                    appointmentDate,
                    dto.startTime,
                    dto.endTime,
                    isStrict
                );

                if (!isAvailable) {
                    throw new ConflictException('This slot is no longer available or outside working hours');
                }

                // Create appointment
                const appointment = await this.prisma.appointment.create({
                    data: {
                        clinicId: dto.clinicId,
                        patientId: dto.patientId,
                        doctorId: dto.doctorId,
                        specialistId: dto.specialistId,
                        appointmentDate,
                        startTime: parseTime(dto.startTime),
                        endTime: parseTime(dto.endTime),
                        status: AppointmentStatus.PENDING,
                        notes: dto.notes,
                        idempotencyKey: dto.idempotencyKey || uuidv4(),
                    },
                    include: {
                        patient: { select: { name: true, phone: true } },
                        doctor: { select: { name: true } },
                        clinic: { select: { name: true } },
                    },
                });

                // Invalidate slot cache
                await this.slotsService.invalidateCache(
                    dto.clinicId,
                    dto.doctorId,
                    dto.appointmentDate,
                );

                // Schedule notifications (Non-blocking)
                try {
                    await this.notificationsService.scheduleAppointmentNotifications(appointment);
                } catch (error) {
                    this.logger.error(`Failed to schedule notifications for appointment ${appointment.id}`, error);
                    // Don't fail the request if notifications fail
                }

                this.logger.log(`Appointment created: ${appointment.id}`);

                return appointment;
            } finally {
                // Always release the lock
                if (lockId) {
                    await this.slotsService.releaseSlotLock(
                        dto.clinicId,
                        dto.doctorId,
                        dto.appointmentDate,
                        dto.startTime,
                        lockId,
                    );
                }
            }
        } catch (error) {
            if (error instanceof HttpException) throw error;

            const errorMessage = typeof error.message === 'string'
                ? error.message
                : 'An unexpected error occurred during appointment creation';

            this.logger.error(`Create appointment failed: ${errorMessage}`, error.stack);
            throw new InternalServerErrorException(errorMessage);
        }
    }

    async createPublic(dto: PublicBookAppointmentDto) {
        let patient = await this.prisma.patient.findUnique({
            where: { phone: dto.patientInfo.phone },
        });

        if (patient) {
            // Ensure linked to clinic
            await this.patientsService.linkToClinic(patient.id, dto.clinicId);
        } else {
            // Create new patient
            patient = await this.patientsService.create({
                name: dto.patientInfo.name,
                phone: dto.patientInfo.phone,
                whatsappConsent: true,
                gender: 'OTHER', // Default
            } as any, dto.clinicId);
        }

        const appointmentDto: CreateAppointmentDto = {
            clinicId: dto.clinicId,
            doctorId: dto.doctorId,
            specialistId: dto.specialistId,
            patientId: patient.id,
            appointmentDate: dto.appointmentDate,
            startTime: dto.startTime,
            endTime: dto.endTime,
            notes: dto.patientInfo.notes,
        };

        return this.create(appointmentDto);
    }

    async findAll(
        clinicId: string,
        pagination: PaginationDto,
        filters?: {
            status?: AppointmentStatus;
            doctorId?: string;
            patientId?: string;
            date?: string;
        },
    ) {
        const where = {
            clinicId,
            deletedAt: null,
            ...(filters?.status && { status: filters.status }),
            ...(filters?.doctorId && { doctorId: filters.doctorId }),
            ...(filters?.patientId && { patientId: filters.patientId }),
            ...(filters?.date && { appointmentDate: new Date(filters.date) }),
        };

        const [appointments, total] = await Promise.all([
            this.prisma.appointment.findMany({
                where,
                skip: pagination.skip || 0,
                take: pagination.take || 20,
                include: {
                    patient: { select: { id: true, name: true, phone: true } },
                    doctor: { select: { id: true, name: true } },
                    specialist: { select: { id: true, name: true } },
                },
                orderBy: [{ appointmentDate: 'asc' }, { startTime: 'asc' }],
            }),
            this.prisma.appointment.count({ where }),
        ]);

        return createPaginatedResult(appointments, total, pagination);
    }

    async findById(id: string) {
        const appointment = await this.prisma.appointment.findUnique({
            where: { id },
            include: {
                patient: true,
                doctor: true,
                specialist: true,
                clinic: true,
                visitRecord: {
                    include: {
                        prescriptions: true,
                        attachments: true,
                    },
                },
                feedback: true,
            },
        });

        if (!appointment) {
            throw new NotFoundException('Appointment not found');
        }

        return appointment;
    }

    async findByPatient(patientId: string, pagination: PaginationDto) {
        const where = { patientId, deletedAt: null };

        const [appointments, total] = await Promise.all([
            this.prisma.appointment.findMany({
                where,
                skip: pagination.skip,
                take: pagination.take,
                include: {
                    doctor: { select: { name: true } },
                    clinic: { select: { name: true, address: true } },
                    specialist: { select: { name: true } },
                },
                orderBy: { appointmentDate: 'desc' },
            }),
            this.prisma.appointment.count({ where }),
        ]);

        return createPaginatedResult(appointments, total, pagination);
    }

    async updateStatus(id: string, status: AppointmentStatus, userId: string) {
        const appointment = await this.findById(id);

        // Validate status transitions
        this.validateStatusTransition(appointment.status, status);

        const updated = await this.prisma.appointment.update({
            where: { id },
            data: { status },
            include: {
                patient: { select: { name: true, phone: true } },
                doctor: { select: { name: true } },
                clinic: { select: { name: true, googleReviewUrl: true } },
            },
        });

        // Trigger appropriate notifications based on status change
        if (status === AppointmentStatus.CONFIRMED) {
            await this.notificationsService.sendAppointmentConfirmed(updated);
        } else if (status === AppointmentStatus.COMPLETED) {
            await this.notificationsService.sendFeedbackRequest(updated);
        }

        this.logger.log(`Appointment ${id} status updated to ${status}`);

        return updated;
    }

    async cancel(id: string, userId: string) {
        const appointment = await this.findById(id);

        // Check if appointment can be cancelled
        const hoursUntilAppointment = hoursBetween(
            new Date(),
            appointment.appointmentDate,
        );

        // Get clinic settings for cancellation policy
        const clinic = await this.prisma.clinic.findUnique({
            where: { id: appointment.clinicId },
        });

        const cancelBeforeHours = (clinic?.settings as any)?.cancelBeforeHours || 4;

        // Allow Admins to bypass this check
        const requestUser = await this.prisma.user.findUnique({ where: { id: userId } });
        const isAdmin = requestUser?.role === 'CLINIC_ADMIN' || requestUser?.role === 'SUPER_ADMIN';

        if (!isAdmin && hoursUntilAppointment < cancelBeforeHours) {
            throw new BadRequestException(
                `Appointments must be cancelled at least ${cancelBeforeHours} hours in advance`,
            );
        }

        const updated = await this.prisma.appointment.update({
            where: { id },
            data: { status: AppointmentStatus.CANCELLED },
        });

        // Invalidate slot cache to make slot available again
        await this.slotsService.invalidateCache(
            appointment.clinicId,
            appointment.doctorId,
            appointment.appointmentDate.toISOString().split('T')[0],
        );

        return updated;
    }

    async update(id: string, dto: UpdateAppointmentDto) {
        const appointment = await this.findById(id);

        let appointmentDate = appointment.appointmentDate;
        let startTime = appointment.startTime;
        let endTime = appointment.endTime;
        let doctorId = appointment.doctorId;
        let clinicId = appointment.clinicId;

        // Check if rescheduling is needed by comparing with existing values
        const currentApptDate = appointment.appointmentDate.toISOString().split('T')[0];
        const currentStartTime = appointment.startTime.toISOString().substring(11, 16);

        // Normalize DTO values
        const newDate = dto.appointmentDate ? dto.appointmentDate : currentApptDate;
        const newStartTime = dto.startTime ? dto.startTime : currentStartTime;
        const newDoctorId = dto.doctorId ? dto.doctorId : appointment.doctorId;

        // Strict comparison
        const isDateChanged = newDate !== currentApptDate;
        const isTimeChanged = newStartTime !== currentStartTime;
        const isDoctorChanged = newDoctorId !== appointment.doctorId;

        const isRescheduling = isDateChanged || isTimeChanged || isDoctorChanged;

        if (isRescheduling) {
            if (dto.appointmentDate) appointmentDate = new Date(dto.appointmentDate);
            if (dto.startTime) startTime = parseTime(dto.startTime);
            if (dto.endTime) endTime = parseTime(dto.endTime); // Assuming endTime update if startTime updates
            if (dto.doctorId) doctorId = dto.doctorId;
            if (dto.clinicId) clinicId = dto.clinicId;

            // Validate future date
            if (!isFutureDate(appointmentDate)) {
                throw new BadRequestException('Appointment date must be in the future');
            }

            // Check availability
            const isAvailable = await this.slotsService.isSlotAvailable(
                clinicId,
                doctorId,
                appointmentDate,
                dto.startTime || currentStartTime,
                dto.endTime || appointment.endTime.toISOString().substring(11, 16)
            );

            if (!isAvailable) {
                throw new ConflictException('This slot is no longer available');
            }
        }

        const updated = await this.prisma.appointment.update({
            where: { id },
            data: {
                ...dto,
                appointmentDate: dto.appointmentDate ? new Date(dto.appointmentDate) : undefined,
                startTime: dto.startTime ? parseTime(dto.startTime) : undefined,
                endTime: dto.endTime ? parseTime(dto.endTime) : undefined,
            },
            include: {
                patient: { select: { name: true, phone: true } },
                doctor: { select: { name: true } },
                clinic: { select: { name: true } },
            },
        });

        if (isRescheduling) {
            await this.slotsService.invalidateCache(appointment.clinicId, appointment.doctorId, appointment.appointmentDate.toISOString().split('T')[0]);
            await this.slotsService.invalidateCache(updated.clinicId, updated.doctorId, updated.appointmentDate.toISOString().split('T')[0]);
        }

        return updated;
    }

    async getAvailableSlots(clinicId: string, doctorId: string, date: string) {
        const appointmentDate = new Date(date);
        return this.slotsService.getAvailableSlots(clinicId, doctorId, appointmentDate);
    }

    private validateStatusTransition(
        currentStatus: AppointmentStatus,
        newStatus: AppointmentStatus,
    ) {
        const validTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
            PENDING: [AppointmentStatus.CONFIRMED, AppointmentStatus.CANCELLED],
            CONFIRMED: [
                AppointmentStatus.COMPLETED,
                AppointmentStatus.CANCELLED,
                AppointmentStatus.NO_SHOW,
            ],
            COMPLETED: [],
            CANCELLED: [],
            NO_SHOW: [],
        };

        if (!validTransitions[currentStatus].includes(newStatus)) {
            throw new BadRequestException(
                `Cannot transition from ${currentStatus} to ${newStatus}`,
            );
        }
    }
}

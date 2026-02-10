import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import {
    generateTimeSlots,
    getDayName,
    parseTime,
    formatTime,
    timeRangesOverlap,
} from '../../common/utils/date.util';

export interface TimeSlot {
    start: string;
    end: string;
    available: boolean;
}

interface DoctorSchedule {
    [day: string]: {
        startTime: string;
        endTime: string;
        slotDuration: number;
    };
}

@Injectable()
export class SlotsService {
    private readonly logger = new Logger(SlotsService.name);
    private readonly CACHE_TTL = 300; // 5 minutes

    constructor(
        private prisma: PrismaService,
        private redisService: RedisService,
    ) { }

    /**
     * Get available slots for a doctor on a specific date
     * 
     * Algorithm:
     * 1. Check Redis cache for pre-computed slots
     * 2. If not cached, get doctor's schedule for the clinic
     * 3. Generate all possible slots based on schedule
     * 4. Fetch existing appointments for the date
     * 5. Mark booked slots as unavailable
     * 6. Cache result and return
     */
    async getAvailableSlots(
        clinicId: string,
        doctorId: string,
        date: Date,
    ): Promise<TimeSlot[]> {
        const dateStr = date.toISOString().split('T')[0];
        const cacheKey = `slots:${clinicId}:${doctorId}:${dateStr}`;

        // Check cache first
        const cached = await this.redisService.getCachedSlots(cacheKey);
        if (cached) {
            this.logger.debug(`Cache hit for ${cacheKey}`);
            return cached as any;
        }

        // Get doctor details and schedule
        const doctor = await this.prisma.doctor.findUnique({
            where: { id: doctorId },
            select: { isActive: true }
        });

        if (!doctor || !doctor.isActive) {
            return [];
        }

        // Get doctor's schedule for this clinic
        const doctorClinic = await this.prisma.doctorClinic.findUnique({
            where: {
                doctorId_clinicId: { doctorId, clinicId },
            },
        });

        if (!doctorClinic) {
            return [];
        }

        const schedule = doctorClinic.schedule as DoctorSchedule;
        const dayName = getDayName(date).toLowerCase();
        const daySchedule = schedule[dayName];

        // Doctor doesn't work on this day
        if (!daySchedule) {
            return [];
        }

        // Generate all possible slots
        const allSlots = generateTimeSlots(
            daySchedule.startTime,
            daySchedule.endTime,
            daySchedule.slotDuration,
        );

        // Get booked appointments for this date
        const bookedAppointments = await this.prisma.appointment.findMany({
            where: {
                clinicId,
                doctorId,
                appointmentDate: date,
                status: { in: ['PENDING', 'CONFIRMED'] },
                deletedAt: null,
            },
            select: {
                startTime: true,
                endTime: true,
            },
        });

        // Mark slots as available or booked
        const slots: TimeSlot[] = allSlots.map((slot) => {
            const slotStart = parseTime(slot.start);
            const slotEnd = parseTime(slot.end);

            const isBooked = bookedAppointments.some((apt) => {
                const aptStart = new Date(apt.startTime);
                const aptEnd = new Date(apt.endTime);
                return timeRangesOverlap(slotStart, slotEnd, aptStart, aptEnd);
            });

            return {
                start: slot.start,
                end: slot.end,
                available: !isBooked,
            };
        });

        // Check if date is today - filter out past slots
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (date.getTime() === today.getTime()) {
            const currentTime = formatTime(now);
            return slots.map((slot) => ({
                ...slot,
                available: slot.available && slot.start > currentTime,
            }));
        }

        // Cache the result
        await this.redisService.setCachedSlots(
            cacheKey,
            slots as any,
            this.CACHE_TTL,
        );

        return slots;
    }

    /**
     * Check if a specific slot is available
     * Uses Redis lock to prevent double-booking
     */
    async isSlotAvailable(
        clinicId: string,
        doctorId: string,
        date: Date,
        startTime: string,
        endTime: string,
        strict: boolean = true,
    ): Promise<boolean> {
        // If strict (Patient/Public), check against generated slots
        if (strict) {
            const slots = await this.getAvailableSlots(clinicId, doctorId, date);
            return slots.some(
                (slot) =>
                    slot.start === startTime &&
                    slot.end === endTime &&
                    slot.available,
            );
        }

        // If not strict (Admin), just check for overlaps effectively
        const dateStr = date.toISOString().split('T')[0];

        // We need to check if ANY appointment overlaps with this range
        const overlappingAppointment = await this.prisma.appointment.findFirst({
            where: {
                clinicId,
                doctorId,
                appointmentDate: date,
                status: { in: ['PENDING', 'CONFIRMED'] },
                deletedAt: null,
                OR: [
                    {
                        // New start is within existing
                        startTime: { lt: parseTime(endTime) },
                        endTime: { gt: parseTime(startTime) }
                    }
                ]
            }
        });

        // Also check if doctor works on this day at all (optional, but good safety)
        // For now, let's assume Admin knows what they are doing and override schedule limits too? 
        // Or keep schedule limits but allow custom times within it?
        // Let's enforce schedule limits but custom times.

        const doctorClinic = await this.prisma.doctorClinic.findUnique({
            where: { doctorId_clinicId: { doctorId, clinicId } },
        });

        if (!doctorClinic) return false;

        const schedule = doctorClinic.schedule as DoctorSchedule;
        const dayName = getDayName(date).toLowerCase();
        const daySchedule = schedule[dayName];
        if (!daySchedule) return false;

        // Check if within working hours
        if (startTime < daySchedule.startTime || endTime > daySchedule.endTime) {
            return false;
        }

        return !overlappingAppointment;
    }

    /**
     * Acquire a lock for booking a slot
     * Returns lock ID if successful, null if slot is already being booked
     */
    async acquireSlotLock(
        clinicId: string,
        doctorId: string,
        date: string,
        startTime: string,
    ): Promise<string | null> {
        const lockKey = `lock:slot:${clinicId}:${doctorId}:${date}:${startTime}`;
        return this.redisService.acquireLock(lockKey, 10000); // 10 second timeout
    }

    /**
     * Release the slot lock after booking
     */
    async releaseSlotLock(
        clinicId: string,
        doctorId: string,
        date: string,
        startTime: string,
        lockId: string,
    ): Promise<void> {
        const lockKey = `lock:slot:${clinicId}:${doctorId}:${date}:${startTime}`;
        await this.redisService.releaseLock(lockKey, lockId);
    }

    /**
     * Invalidate cached slots after booking
     */
    async invalidateCache(
        clinicId: string,
        doctorId: string,
        date: string,
    ): Promise<void> {
        await this.redisService.invalidateSlotCache(clinicId, doctorId, date);
    }
}

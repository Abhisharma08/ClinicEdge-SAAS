import { ConfigService } from '@nestjs/config';

/**
 * Date/Time utilities for IST timezone handling
 */

const IST_OFFSET = 5.5 * 60 * 60 * 1000; // 5:30 hours in ms

/**
 * Get current time in IST
 */
export function getCurrentIST(): Date {
    const now = new Date();
    return new Date(now.getTime() + IST_OFFSET + now.getTimezoneOffset() * 60 * 1000);
}

/**
 * Convert UTC date to IST
 */
export function toIST(date: Date): Date {
    return new Date(date.getTime() + IST_OFFSET + date.getTimezoneOffset() * 60 * 1000);
}

/**
 * Convert IST to UTC
 */
export function toUTC(istDate: Date): Date {
    const offset = istDate.getTimezoneOffset() * 60 * 1000;
    return new Date(istDate.getTime() - IST_OFFSET - offset);
}

/**
 * Format date as YYYY-MM-DD
 */
export function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
}

/**
 * Format time as HH:MM
 */
export function formatTime(date: Date): string {
    return date.toTimeString().slice(0, 5);
}

/**
 * Parse time string (HH:MM) to Date object (on 1970-01-01)
 */
export function parseTime(timeString: string): Date {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date(1970, 0, 1, hours, minutes);
    return date;
}

/**
 * Get day name from date
 */
export function getDayName(date: Date): string {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
}

/**
 * Add minutes to time
 */
export function addMinutes(time: Date, minutes: number): Date {
    return new Date(time.getTime() + minutes * 60 * 1000);
}

/**
 * Check if two time ranges overlap
 */
export function timeRangesOverlap(
    start1: Date,
    end1: Date,
    start2: Date,
    end2: Date,
): boolean {
    return start1 < end2 && start2 < end1;
}

/**
 * Generate time slots between start and end with given duration
 */
export function generateTimeSlots(
    startTime: string,
    endTime: string,
    slotDurationMinutes: number,
): Array<{ start: string; end: string }> {
    const slots: Array<{ start: string; end: string }> = [];

    let current = parseTime(startTime);
    const end = parseTime(endTime);

    while (addMinutes(current, slotDurationMinutes) <= end) {
        const slotEnd = addMinutes(current, slotDurationMinutes);
        slots.push({
            start: formatTime(current),
            end: formatTime(slotEnd),
        });
        current = slotEnd;
    }

    return slots;
}

/**
 * Check if date is in the future (IST)
 */
export function isFutureDate(date: Date): boolean {
    const now = getCurrentIST();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    // Normalize input date to start of day for comparison
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return checkDate.getTime() >= today.getTime();
}

/**
 * Get number of hours between two dates
 */
export function hoursBetween(date1: Date, date2: Date): number {
    return Math.abs(date2.getTime() - date1.getTime()) / (1000 * 60 * 60);
}

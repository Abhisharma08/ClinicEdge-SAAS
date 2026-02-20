import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from './notifications.service';
import { NotificationChannel, NotificationStatus } from '@prisma/client';

@Injectable()
export class NotificationSchedulerService {
    private readonly logger = new Logger(NotificationSchedulerService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly notificationsService: NotificationsService,
    ) { }

    /**
     * Process pending scheduled notifications (24h/2h reminders).
     * Runs every 5 minutes.
     */
    @Cron('0 */5 * * * *')
    async processPendingNotifications() {
        const now = new Date();

        const pending = await this.prisma.notification.findMany({
            where: {
                status: NotificationStatus.PENDING,
                channel: { not: NotificationChannel.DASHBOARD },
                scheduledAt: { lte: now },
            },
            take: 50, // Process in batches
            orderBy: { scheduledAt: 'asc' },
        });

        if (pending.length === 0) return;

        this.logger.log(`Processing ${pending.length} pending scheduled notifications`);

        for (const notification of pending) {
            try {
                await this.notificationsService.processNotification(notification);
            } catch (error) {
                this.logger.error(
                    `Failed to process notification ${notification.id}: ${error.message}`,
                );
            }
        }
    }
}

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationChannel } from '@prisma/client';

@Injectable()
export class NotificationCleanupService {
    private readonly logger = new Logger(NotificationCleanupService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Delete dashboard notifications older than 1 hour.
     * Runs every 10 minutes.
     */
    @Cron('0 */10 * * * *')
    async handleCleanup() {
        this.logger.log('Running notification cleanup job...');

        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        try {
            const result = await this.prisma.notification.deleteMany({
                where: {
                    channel: NotificationChannel.DASHBOARD,
                    createdAt: {
                        lt: oneHourAgo,
                    },
                },
            });

            if (result.count > 0) {
                this.logger.log(`Deleted ${result.count} old dashboard notifications`);
            }
        } catch (error) {
            this.logger.error('Failed to cleanup notifications', error);
        }
    }
}

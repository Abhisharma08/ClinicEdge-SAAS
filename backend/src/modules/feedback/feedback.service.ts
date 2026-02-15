import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ConflictException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SubmitFeedbackDto } from './dto/submit-feedback.dto';
import { PaginationDto, createPaginatedResult } from '../../common/dto';

export interface FeedbackResult {
    submitted: boolean;
    redirectToGoogle: boolean;
    googleReviewUrl?: string;
    message: string;
}

@Injectable()
export class FeedbackService {
    private readonly logger = new Logger(FeedbackService.name);
    private readonly HIGH_RATING_THRESHOLD = 4; // 4 and 5 stars redirect to Google

    constructor(private prisma: PrismaService) { }

    /**
     * Validate feedback token and return feedback record
     */
    async validateToken(token: string) {
        const feedback = await this.prisma.feedback.findUnique({
            where: { token },
            include: {
                appointment: {
                    include: {
                        doctor: { select: { name: true } },
                        patient: { select: { name: true } },
                    },
                },
                clinic: { select: { name: true, googleReviewUrl: true } },
            },
        });

        if (!feedback) {
            throw new NotFoundException('Invalid feedback link');
        }

        if (feedback.tokenExpiresAt < new Date()) {
            throw new BadRequestException('This feedback link has expired');
        }

        if (feedback.submittedAt) {
            throw new ConflictException('Feedback has already been submitted');
        }

        return {
            id: feedback.id,
            clinicName: feedback.clinic.name,
            doctorName: feedback.appointment.doctor.name,
            patientName: feedback.appointment.patient.name,
            appointmentDate: feedback.appointment.appointmentDate,
        };
    }

    /**
     * Submit feedback with smart routing
     * 
     * Logic:
     * - Rating 4-5: Mark as redirected, return Google Review URL
     * - Rating 1-3: Store internally, notify clinic admin, don't expose to Google
     */
    async submitFeedback(token: string, dto: SubmitFeedbackDto): Promise<FeedbackResult> {
        const feedback = await this.prisma.feedback.findUnique({
            where: { token },
            include: {
                clinic: { select: { id: true, googleReviewUrl: true, name: true } },
                appointment: { select: { status: true } },
            },
        });

        if (!feedback) {
            throw new NotFoundException('Invalid feedback link');
        }

        if (feedback.tokenExpiresAt < new Date()) {
            throw new BadRequestException('This feedback link has expired');
        }

        if (feedback.submittedAt) {
            throw new ConflictException('Feedback has already been submitted');
        }

        // Verify appointment was completed
        if (feedback.appointment.status !== 'COMPLETED') {
            throw new BadRequestException('Feedback can only be submitted for completed appointments');
        }

        const isHighRating = dto.rating >= this.HIGH_RATING_THRESHOLD;

        // Update feedback record
        await this.prisma.feedback.update({
            where: { id: feedback.id },
            data: {
                rating: dto.rating,
                comments: dto.comments,
                isInternal: !isHighRating,
                redirectedToGoogle: isHighRating,
                submittedAt: new Date(),
            },
        });

        this.logger.log(
            `Feedback submitted: ${feedback.id} | Rating: ${dto.rating} | Redirect: ${isHighRating}`,
        );

        // For low ratings, create a notification for clinic admin
        if (!isHighRating) {
            await this.notifyClinicAdmin(feedback.clinic.id, dto.rating, dto.comments);
        }

        return {
            submitted: true,
            redirectToGoogle: isHighRating,
            googleReviewUrl: isHighRating ? (feedback.clinic.googleReviewUrl ?? undefined) : undefined,
            message: isHighRating
                ? 'Thank you for your feedback! Please share your experience on Google.'
                : 'Thank you for your feedback. We will use it to improve our services.',
        };
    }

    /**
     * Get feedback for a clinic (admin view)
     */
    async getClinicFeedback(
        clinicId: string,
        pagination: PaginationDto,
        filters?: { minRating?: number; maxRating?: number; isInternal?: boolean },
    ) {
        const where = {
            clinicId,
            submittedAt: { not: null },
            ...(filters?.minRating && { rating: { gte: filters.minRating } }),
            ...(filters?.maxRating && { rating: { lte: filters.maxRating } }),
            ...(filters?.isInternal !== undefined && { isInternal: filters.isInternal }),
        };

        const [items, total] = await Promise.all([
            this.prisma.feedback.findMany({
                where,
                skip: pagination.skip,
                take: pagination.take,
                include: {
                    patient: { select: { name: true } },
                    appointment: {
                        select: {
                            appointmentDate: true,
                            doctor: { select: { name: true } },
                        },
                    },
                },
                orderBy: { submittedAt: 'desc' },
            }),
            this.prisma.feedback.count({ where }),
        ]);

        return createPaginatedResult(items, total, pagination);
    }

    /**
     * Get feedback analytics for a clinic — uses database aggregation
     */
    async getAnalytics(clinicId: string) {
        const baseWhere = { clinicId, submittedAt: { not: null } };

        const [stats, distribution, googleRedirects] = await Promise.all([
            this.prisma.feedback.aggregate({
                where: baseWhere,
                _avg: { rating: true },
                _count: { _all: true },
            }),
            this.prisma.feedback.groupBy({
                by: ['rating'],
                where: baseWhere,
                _count: { _all: true },
            }),
            this.prisma.feedback.count({
                where: { ...baseWhere, redirectedToGoogle: true },
            }),
        ]);

        const total = stats._count._all;
        if (total === 0) {
            return {
                totalFeedback: 0,
                averageRating: 0,
                ratingDistribution: {},
                googleRedirects: 0,
                internalFeedback: 0,
            };
        }

        const ratingDistribution = distribution.reduce(
            (acc, d) => {
                acc[d.rating] = d._count._all;
                return acc;
            },
            {} as Record<number, number>,
        );

        return {
            totalFeedback: total,
            averageRating: Math.round((stats._avg.rating || 0) * 10) / 10,
            ratingDistribution,
            googleRedirects,
            internalFeedback: total - googleRedirects,
        };
    }

    /**
     * Notify clinic admin about low rating
     */
    private async notifyClinicAdmin(
        clinicId: string,
        rating: number,
        comments?: string,
    ) {
        await this.prisma.notification.create({
            data: {
                clinicId,
                type: 'APPOINTMENT_COMPLETED', // Using existing type for dashboard notification
                channel: 'DASHBOARD',
                status: 'PENDING',
                payload: {
                    type: 'LOW_RATING_ALERT',
                    rating,
                    comments,
                    message: `Low rating received: ${rating} stars. ${comments ? `Comment: "${comments}"` : 'No comment provided.'}`,
                },
            },
        });

        this.logger.log(`Low rating notification created for clinic ${clinicId}`);
    }
}

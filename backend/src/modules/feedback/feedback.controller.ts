import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { SubmitFeedbackDto } from './dto/submit-feedback.dto';
import { Roles, CurrentUser, CurrentUserData, Public } from '../../common/decorators';
import { UserRole } from '@prisma/client';
import { PaginationDto } from '../../common/dto';

@ApiTags('feedback')
@Controller('feedback')
export class FeedbackController {
    constructor(private readonly feedbackService: FeedbackService) { }

    @Get('validate/:token')
    @Public()
    @ApiOperation({ summary: 'Validate feedback token (public)' })
    async validateToken(@Param('token') token: string) {
        return this.feedbackService.validateToken(token);
    }

    @Post()
    @Public()
    @ApiOperation({ summary: 'Submit feedback (public via body)' })
    async create(@Body() dto: CreateFeedbackDto) {
        return this.feedbackService.submitFeedback(dto.token, dto);
    }

    @Post('submit/:token')
    @Public()
    @ApiOperation({ summary: 'Submit feedback (public)' })
    async submitFeedback(
        @Param('token') token: string,
        @Body() dto: SubmitFeedbackDto,
    ) {
        return this.feedbackService.submitFeedback(token, dto);
    }

    @Get()
    @Roles(UserRole.CLINIC_ADMIN)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Get clinic feedback (admin)' })
    @ApiQuery({ name: 'minRating', required: false })
    @ApiQuery({ name: 'maxRating', required: false })
    @ApiQuery({ name: 'isInternal', required: false })
    async getClinicFeedback(
        @CurrentUser() user: CurrentUserData,
        @Query() pagination: PaginationDto,
        @Query('minRating') minRating?: number,
        @Query('maxRating') maxRating?: number,
        @Query('isInternal') isInternal?: boolean,
    ) {
        if (!user.clinicId) {
            throw new ForbiddenException('User must be associated with a clinic');
        }
        return this.feedbackService.getClinicFeedback(user.clinicId, pagination, {
            minRating,
            maxRating,
            isInternal,
        });
    }

    @Get('analytics')
    @Roles(UserRole.CLINIC_ADMIN)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Get feedback analytics' })
    async getAnalytics(@CurrentUser() user: CurrentUserData) {
        if (!user.clinicId) {
            throw new ForbiddenException('User must be associated with a clinic');
        }
        return this.feedbackService.getAnalytics(user.clinicId);
    }
}

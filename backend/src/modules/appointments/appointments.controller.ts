import {
    Controller,
    Get,
    Post,
    Put,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    HttpCode,
    HttpStatus,
    ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto, UpdateAppointmentDto } from './dto';
import { PublicBookAppointmentDto } from './dto/public-book-appointment.dto';
import { Roles, CurrentUser, CurrentUserData, Public } from '../../common/decorators';
import { UserRole, AppointmentStatus } from '@prisma/client';
import { PaginationDto } from '../../common/dto';

@ApiTags('appointments')
@Controller('appointments')
@ApiBearerAuth('JWT-auth')
export class AppointmentsController {
    constructor(private readonly appointmentsService: AppointmentsService) { }

    @Post()
    @Roles(UserRole.CLINIC_ADMIN, UserRole.PATIENT, UserRole.DOCTOR)
    @ApiOperation({ summary: 'Create new appointment' })
    async create(
        @Body() dto: CreateAppointmentDto,
        @CurrentUser() user: CurrentUserData,
    ) {
        try {
            console.log('Creating appointment with DTO:', JSON.stringify(dto, null, 2));
            console.log('User:', JSON.stringify(user, null, 2));
            return await this.appointmentsService.create(dto, user.userId);
        } catch (error) {
            console.error('FAILED TO CREATE APPOINTMENT:', error);
            throw error;
        }
    }

    @Post('public')
    @Public()
    @ApiOperation({ summary: 'Public appointment booking' })
    async createPublic(@Body() dto: PublicBookAppointmentDto) {
        return this.appointmentsService.createPublic(dto);
    }

    @Get()
    @Roles(UserRole.CLINIC_ADMIN, UserRole.DOCTOR)
    @ApiOperation({ summary: 'List appointments (clinic-scoped)' })
    @ApiQuery({ name: 'status', enum: AppointmentStatus, required: false })
    @ApiQuery({ name: 'doctorId', required: false })
    @ApiQuery({ name: 'patientId', required: false })
    @ApiQuery({ name: 'date', required: false })
    async findAll(
        @CurrentUser() user: CurrentUserData,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 20,
        @Query('status') status?: AppointmentStatus,
        @Query('doctorId') doctorId?: string,
        @Query('patientId') patientId?: string,
        @Query('date') date?: string,
    ) {
        if (!user.clinicId) {
            throw new ForbiddenException('User must be associated with a clinic');
        }
        const pagination = new PaginationDto();
        pagination.page = Number(page) || 1;
        pagination.limit = Number(limit) || 20;
        return this.appointmentsService.findAll(user.clinicId, pagination, {
            status,
            doctorId,
            patientId,
            date,
        });
    }

    @Get('my')
    @Roles(UserRole.PATIENT)
    @ApiOperation({ summary: 'Get my appointments (patient)' })
    async getMyAppointments(
        @CurrentUser() user: CurrentUserData,
        @Query() pagination: PaginationDto,
    ) {
        // Get patient ID from user
        const patient = await this.appointmentsService['prisma'].patient.findUnique({
            where: { userId: user.userId },
        });
        if (!patient) {
            return { items: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false } };
        }
        return this.appointmentsService.findByPatient(patient.id, pagination);
    }

    @Get('slots')
    @Public()
    @ApiOperation({ summary: 'Get available slots for a doctor on a date' })
    @ApiQuery({ name: 'clinicId', required: true })
    @ApiQuery({ name: 'doctorId', required: true })
    @ApiQuery({ name: 'date', required: true, description: 'YYYY-MM-DD format' })
    async getAvailableSlots(
        @Query('clinicId') clinicId: string,
        @Query('doctorId') doctorId: string,
        @Query('date') date: string,
    ) {
        return this.appointmentsService.getAvailableSlots(clinicId, doctorId, date);
    }

    @Get('public/:id')
    @Public()
    @ApiOperation({ summary: 'Get public appointment details for feedback' })
    async getPublicDetails(@Param('id') id: string) {
        const appointment = await this.appointmentsService.findById(id);
        return {
            id: appointment.id,
            doctor: {
                name: appointment.doctor.name,
                specialization: appointment.specialist?.name,
            },
            clinic: {
                name: appointment.clinic.name,
            },
            appointmentDate: appointment.appointmentDate,
        };
    }

    @Get(':id')
    @Roles(UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.PATIENT)
    @ApiOperation({ summary: 'Get appointment details' })
    async findOne(@Param('id') id: string) {
        return this.appointmentsService.findById(id);
    }

    @Patch(':id/status')
    @Roles(UserRole.CLINIC_ADMIN, UserRole.DOCTOR)
    @ApiOperation({ summary: 'Update appointment status' })
    @ApiQuery({ name: 'status', enum: AppointmentStatus })
    async updateStatus(
        @Param('id') id: string,
        @Query('status') status: AppointmentStatus,
        @CurrentUser() user: CurrentUserData,
    ) {
        return this.appointmentsService.updateStatus(id, status, user.userId);
    }

    @Put(':id')
    @Roles(UserRole.CLINIC_ADMIN, UserRole.DOCTOR)
    @ApiOperation({ summary: 'Update appointment details (reschedule)' })
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateAppointmentDto,
        @CurrentUser() user: CurrentUserData,
    ) {
        if (!user.clinicId) {
            throw new ForbiddenException('User must be associated with a clinic');
        }
        return this.appointmentsService.update(id, dto);
    }

    @Delete(':id')
    @Roles(UserRole.CLINIC_ADMIN, UserRole.PATIENT)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Cancel appointment' })
    async cancel(
        @Param('id') id: string,
        @CurrentUser() user: CurrentUserData,
    ) {
        return this.appointmentsService.cancel(id, user.userId);
    }
}

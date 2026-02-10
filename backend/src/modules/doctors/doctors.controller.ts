import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DoctorsService } from './doctors.service';
import { CreateDoctorDto, UpdateDoctorDto, ListDoctorsDto, GetAppointmentsDto } from './dto';
import { Roles, CurrentUser, CurrentUserData, Public } from '../../common/decorators';
import { UserRole } from '@prisma/client';
import { PaginationDto } from '../../common/dto';

@ApiTags('doctors')
@Controller('doctors')
export class DoctorsController {
    constructor(private readonly doctorsService: DoctorsService) { }

    @Post()
    @Roles(UserRole.CLINIC_ADMIN)
    @ApiOperation({ summary: 'Create new doctor' })
    async create(
        @Body() dto: CreateDoctorDto,
        @CurrentUser() user: CurrentUserData,
    ) {
        if (!user.clinicId) {
            throw new ForbiddenException('User must be associated with a clinic');
        }
        return this.doctorsService.create(dto, user.clinicId);
    }

    @Put(':id')
    @Roles(UserRole.CLINIC_ADMIN)
    @ApiOperation({ summary: 'Update doctor profile' })
    async update(@Param('id') id: string, @Body() dto: UpdateDoctorDto) {
        return this.doctorsService.update(id, dto);
    }

    @Delete(':id')
    @Roles(UserRole.CLINIC_ADMIN)
    @ApiOperation({ summary: 'Delete doctor (soft delete)' })
    async delete(@Param('id') id: string) {
        return this.doctorsService.delete(id);
    }

    @Get()
    @Public()
    @ApiOperation({ summary: 'List doctors for a clinic (public for booking)' })
    @ApiQuery({ name: 'clinicId', required: true })
    @ApiQuery({ name: 'specialistId', required: false })
    async findByClinic(@Query() query: ListDoctorsDto) {
        return this.doctorsService.findByClinic(query.clinicId, query, query.specialistId, query.search);
    }

    @Get('profile/me')
    @Roles(UserRole.DOCTOR)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Get current logged in doctor profile' })
    async getMe(@CurrentUser() user: CurrentUserData) {
        return this.doctorsService.findByUserId(user.userId);
    }

    @Get(':id')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Get doctor details' })
    async findOne(@Param('id') id: string) {
        return this.doctorsService.findById(id);
    }

    @Get(':id/schedule')
    @Public()
    @ApiOperation({ summary: 'Get doctor schedule for a clinic' })
    @ApiQuery({ name: 'clinicId', required: true })
    async getSchedule(
        @Param('id') id: string,
        @Query('clinicId') clinicId: string,
    ) {
        return this.doctorsService.getSchedule(id, clinicId);
    }

    @Put(':id/schedule')
    @Roles(UserRole.CLINIC_ADMIN, UserRole.DOCTOR)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Update doctor schedule' })
    async updateSchedule(
        @Param('id') id: string,
        @CurrentUser() user: CurrentUserData,
        @Body() schedule: any,
    ) {
        if (!user.clinicId) {
            throw new ForbiddenException('User must be associated with a clinic');
        }
        return this.doctorsService.updateSchedule(id, user.clinicId, schedule);
    }

    @Get(':id/appointments')
    @Roles(UserRole.DOCTOR, UserRole.CLINIC_ADMIN)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Get doctor appointments' })
    async getAppointments(
        @Param('id') id: string,
        @Query() query: GetAppointmentsDto,
    ) {
        return this.doctorsService.getAppointments(id, query.date, query.upcoming, query);
    }
}

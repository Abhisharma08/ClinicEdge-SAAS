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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import { CreatePatientDto, UpdatePatientDto } from './dto';
import { Roles, CurrentUser, CurrentUserData } from '../../common/decorators';
import { UserRole } from '@prisma/client';
import { PaginationDto } from '../../common/dto';

@ApiTags('patients')
@Controller('patients')
@ApiBearerAuth('JWT-auth')
export class PatientsController {
    constructor(private readonly patientsService: PatientsService) { }

    @Post()
    @Roles(UserRole.CLINIC_ADMIN, UserRole.DOCTOR)
    @ApiOperation({ summary: 'Register new patient' })
    async create(
        @Body() dto: CreatePatientDto,
        @CurrentUser() user: CurrentUserData,
    ) {
        if (!user.clinicId) {
            throw new ForbiddenException('User must be associated with a clinic');
        }
        return this.patientsService.create(dto, user.clinicId);
    }

    @Get()
    @Roles(UserRole.CLINIC_ADMIN, UserRole.DOCTOR)
    @ApiOperation({ summary: 'List patients (clinic-scoped)' })
    async findAll(
        @CurrentUser() user: CurrentUserData,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 20,
        @Query('search') search?: string,
    ) {
        if (!user.clinicId) {
            throw new ForbiddenException('User must be associated with a clinic');
        }
        const pagination = new PaginationDto();
        pagination.page = Number(page) || 1;
        pagination.limit = Number(limit) || 20;
        return this.patientsService.findByClinic(user.clinicId, pagination, search);
    }

    @Get(':id')
    @Roles(UserRole.CLINIC_ADMIN, UserRole.DOCTOR)
    @ApiOperation({ summary: 'Get patient details' })
    async findOne(@Param('id') id: string) {
        return this.patientsService.findById(id);
    }

    @Put(':id')
    @Roles(UserRole.CLINIC_ADMIN)
    @ApiOperation({ summary: 'Update patient (non-identity fields only for doctors)' })
    async update(@Param('id') id: string, @Body() dto: UpdatePatientDto) {
        return this.patientsService.update(id, dto);
    }

    @Delete(':id')
    @Roles(UserRole.CLINIC_ADMIN)
    @ApiOperation({ summary: 'Delete patient (soft delete)' })
    async delete(@Param('id') id: string) {
        return this.patientsService.delete(id);
    }

    @Get(':id/visits')
    @Roles(UserRole.CLINIC_ADMIN, UserRole.DOCTOR)
    @ApiOperation({ summary: 'Get patient visit history' })
    async getVisitHistory(
        @Param('id') id: string,
        @CurrentUser() user: CurrentUserData,
        @Query() pagination: PaginationDto,
    ) {
        if (!user.clinicId) {
            throw new ForbiddenException('User must be associated with a clinic');
        }
        return this.patientsService.getVisitHistory(id, user.clinicId, pagination);
    }
}

import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    Res,
    ForbiddenException,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { Response } from 'express';
import { PatientsService } from './patients.service';
import { ImportExportService } from './import-export.service';
import { CreatePatientDto, UpdatePatientDto } from './dto';
import { Roles, CurrentUser, CurrentUserData } from '../../common/decorators';
import { UserRole } from '@prisma/client';
import { PaginationDto } from '../../common/dto';

@ApiTags('patients')
@Controller('patients')
@ApiBearerAuth('JWT-auth')
export class PatientsController {
    constructor(
        private readonly patientsService: PatientsService,
        private readonly importExportService: ImportExportService,
    ) { }

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
    @ApiOperation({ summary: 'List patients (clinic-scoped, with optional filters)' })
    async findAll(
        @CurrentUser() user: CurrentUserData,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 20,
        @Query('search') search?: string,
        @Query('fromDate') fromDate?: string,
        @Query('toDate') toDate?: string,
        @Query('gender') gender?: string,
        @Query('bloodGroup') bloodGroup?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    ) {
        if (!user.clinicId) {
            throw new ForbiddenException('User must be associated with a clinic');
        }
        const pagination = new PaginationDto();
        pagination.page = Number(page) || 1;
        pagination.limit = Number(limit) || 20;
        return this.patientsService.findByClinic(user.clinicId, pagination, search, fromDate, toDate, gender, bloodGroup, sortBy, sortOrder);
    }

    @Get('export')
    @Roles(UserRole.CLINIC_ADMIN)
    @ApiOperation({ summary: 'Export all patients as CSV' })
    async exportCSV(
        @CurrentUser() user: CurrentUserData,
        @Query('format') format: string = 'csv',
        @Res() res: Response,
    ) {
        if (!user.clinicId) {
            throw new ForbiddenException('User must be associated with a clinic');
        }

        const patients = await this.patientsService.exportAll(user.clinicId);

        if (format === 'xlsx') {
            const buffer = this.importExportService.toExcel(patients);
            res.set({
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename=patients-${Date.now()}.xlsx`,
            });
            res.send(buffer);
        } else {
            const csv = this.importExportService.toCSV(patients);
            res.set({
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename=patients-${Date.now()}.csv`,
            });
            res.send(csv);
        }
    }

    @Post('import')
    @Roles(UserRole.CLINIC_ADMIN, UserRole.DOCTOR)
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Bulk import patients from CSV or Excel' })
    async importPatients(
        @UploadedFile() file: Express.Multer.File,
        @CurrentUser() user: CurrentUserData,
    ) {
        if (!user.clinicId) {
            throw new ForbiddenException('User must be associated with a clinic');
        }

        if (!file) {
            throw new BadRequestException('File is required');
        }

        const allowedTypes = [
            'text/csv',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ];
        if (!allowedTypes.includes(file.mimetype)) {
            throw new BadRequestException('Only CSV and Excel files are supported');
        }

        return this.importExportService.importPatients(file, user.clinicId);
    }

    @Get(':id')
    @Roles(UserRole.CLINIC_ADMIN, UserRole.DOCTOR)
    @ApiOperation({ summary: 'Get patient details' })
    async findOne(@Param('id') id: string) {
        return this.patientsService.findById(id);
    }

    @Put(':id')
    @Roles(UserRole.CLINIC_ADMIN, UserRole.DOCTOR)
    @ApiOperation({ summary: 'Update patient' })
    async update(@Param('id') id: string, @Body() dto: UpdatePatientDto) {
        return this.patientsService.update(id, dto);
    }

    @Delete(':id')
    @Roles(UserRole.CLINIC_ADMIN, UserRole.DOCTOR)
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

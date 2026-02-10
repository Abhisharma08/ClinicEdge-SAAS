import {
    Controller,
    Get,
    Post,
    Put,
    Body,
    Param,
    UseInterceptors,
    UploadedFile,
    ForbiddenException,
    NotFoundException,
    Res,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { VisitRecordsService } from './visit-records.service';
import { CreateVisitRecordDto, CreatePrescriptionDto } from './dto';
import { Roles, CurrentUser, CurrentUserData } from '../../common/decorators';
import { UserRole } from '@prisma/client';

@ApiTags('visit-records')
@Controller('visit-records')
@ApiBearerAuth('JWT-auth')
export class VisitRecordsController {
    constructor(private readonly visitRecordsService: VisitRecordsService) { }

    @Get(':id/pdf')
    @Roles(UserRole.DOCTOR, UserRole.CLINIC_ADMIN)
    @ApiOperation({ summary: 'Generate and download prescription PDF' })
    async generatePdf(@Param('id') id: string, @Res() res: Response) {
        const buffer = await this.visitRecordsService.generatePdf(id);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="prescription-${id}.pdf"`,
            'Content-Length': buffer.length,
        });

        res.end(buffer);
    }

    @Post()
    @Roles(UserRole.DOCTOR)
    @ApiOperation({ summary: 'Create visit record (doctor only)' })
    async create(
        @Body() dto: CreateVisitRecordDto,
        @CurrentUser() user: CurrentUserData,
    ) {
        if (!user.clinicId) {
            throw new ForbiddenException('User must be associated with a clinic');
        }

        const doctor = await this.visitRecordsService['prisma'].doctor.findUnique({
            where: { userId: user.userId },
        });

        if (!doctor) {
            throw new NotFoundException('Doctor profile not found');
        }

        return this.visitRecordsService.create(dto, doctor.id, user.clinicId);
    }

    @Get(':id')
    @Roles(UserRole.DOCTOR, UserRole.CLINIC_ADMIN)
    @ApiOperation({ summary: 'Get visit record details' })
    async findOne(@Param('id') id: string) {
        return this.visitRecordsService.findById(id);
    }

    @Put(':id')
    @Roles(UserRole.DOCTOR)
    @ApiOperation({ summary: 'Update visit record (creating doctor only)' })
    async update(
        @Param('id') id: string,
        @Body() dto: Partial<CreateVisitRecordDto>,
        @CurrentUser() user: CurrentUserData,
    ) {
        const doctor = await this.visitRecordsService['prisma'].doctor.findUnique({
            where: { userId: user.userId },
        });
        if (!doctor) {
            throw new NotFoundException('Doctor profile not found');
        }
        return this.visitRecordsService.update(id, dto, doctor.id);
    }

    @Post(':id/prescriptions')
    @Roles(UserRole.DOCTOR)
    @ApiOperation({ summary: 'Add prescription to visit record' })
    async addPrescription(
        @Param('id') id: string,
        @Body() dto: CreatePrescriptionDto,
        @CurrentUser() user: CurrentUserData,
    ) {
        const doctor = await this.visitRecordsService['prisma'].doctor.findUnique({
            where: { userId: user.userId },
        });
        if (!doctor) {
            throw new NotFoundException('Doctor profile not found');
        }
        return this.visitRecordsService.addPrescription(id, dto, doctor.id);
    }

    @Post(':id/attachments')
    @Roles(UserRole.DOCTOR)
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Upload attachment to visit record' })
    async addAttachment(
        @Param('id') id: string,
        @UploadedFile() file: Express.Multer.File,
        @CurrentUser() user: CurrentUserData,
    ) {
        const doctor = await this.visitRecordsService['prisma'].doctor.findUnique({
            where: { userId: user.userId },
        });
        if (!doctor) {
            throw new NotFoundException('Doctor profile not found');
        }
        return this.visitRecordsService.addAttachment(id, file, doctor.id);
    }

}

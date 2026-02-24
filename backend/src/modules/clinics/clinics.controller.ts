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
    InternalServerErrorException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ClinicsService } from './clinics.service';
import { CreateClinicDto, UpdateClinicDto } from './dto';
import { Roles, Public } from '../../common/decorators';
import { UserRole } from '@prisma/client';
import { PaginationDto } from '../../common/dto';

@ApiTags('clinics')
@Controller('clinics')
export class ClinicsController {
    constructor(private readonly clinicsService: ClinicsService) { }

    @Post()
    @Roles(UserRole.SUPER_ADMIN)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Create new clinic (Super Admin only)' })
    async create(@Body() dto: CreateClinicDto) {
        return this.clinicsService.create(dto);
    }

    @Get()
    @Roles(UserRole.SUPER_ADMIN)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'List all clinics (Super Admin only)' })
    async findAll(
        @Query() pagination: PaginationDto,
        @Query('search') search?: string,
    ) {
        return this.clinicsService.findAll(pagination, search);
    }

    @Get('public')
    @Public()
    @ApiOperation({ summary: 'List active clinics for booking (public)' })
    async listPublic(@Query() pagination: PaginationDto) {
        return this.clinicsService.findAll(pagination);
    }

    @Get(':id')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Get clinic details' })
    async findOne(@Param('id') id: string) {
        return this.clinicsService.findById(id);
    }

    @Get(':id/public')
    @Public()
    @ApiOperation({ summary: 'Get clinic public info for booking' })
    async getPublicInfo(@Param('id') id: string) {
        return this.clinicsService.getPublicInfo(id);
    }

    @Get(':id/settings')
    @Roles(UserRole.CLINIC_ADMIN)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Get clinic settings' })
    async getSettings(@Param('id') id: string) {
        return this.clinicsService.getSettings(id);
    }

    @Patch(':id/settings')
    @Roles(UserRole.CLINIC_ADMIN)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Update clinic settings' })
    async updateSettings(@Param('id') id: string, @Body() settings: Record<string, any>) {
        return this.clinicsService.updateSettings(id, settings);
    }

    @Put(':id')
    @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Update clinic' })
    async update(@Param('id') id: string, @Body() dto: UpdateClinicDto) {
        return this.clinicsService.update(id, dto);
    }

    @Patch(':id/status')
    @Roles(UserRole.SUPER_ADMIN)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Suspend or activate clinic (Super Admin only)' })
    async updateStatus(@Param('id') id: string, @Query('isActive') isActive: string) {
        return this.clinicsService.updateStatus(id, isActive === 'true');
    }

    @Get(':id/export')
    @Roles(UserRole.SUPER_ADMIN)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Export full clinic data payload (Super Admin only)' })
    async exportData(@Param('id') id: string) {
        return this.clinicsService.exportData(id);
    }

    @Delete(':id')
    @Roles(UserRole.SUPER_ADMIN)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Hard delete clinic and all its data (Super Admin only)' })
    async remove(@Param('id') id: string) {
        try {
            await this.clinicsService.hardDelete(id);
            return { success: true };
        } catch (e: any) {
            console.error('Hard delete error:', e);
            throw new InternalServerErrorException(e.message || JSON.stringify(e));
        }
    }
}

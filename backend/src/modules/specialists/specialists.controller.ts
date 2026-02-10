import { Controller, Get, Post, Put, Delete, Body, Param, Query, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SpecialistsService } from './specialists.service';
import { Roles, CurrentUser, CurrentUserData, Public } from '../../common/decorators';
import { UserRole } from '@prisma/client';

@ApiTags('specialists')
@Controller('specialists')
export class SpecialistsController {
    constructor(private readonly specialistsService: SpecialistsService) { }

    @Get()
    @Public()
    @ApiOperation({ summary: 'List specialists for a clinic (public)' })
    @ApiQuery({ name: 'clinicId', required: true })
    async findByClinic(@Query('clinicId') clinicId: string) {
        return this.specialistsService.findByClinic(clinicId);
    }

    @Get(':id')
    @Public()
    @ApiOperation({ summary: 'Get specialist details with doctors' })
    async findOne(@Param('id') id: string) {
        return this.specialistsService.findById(id);
    }

    @Post()
    @Roles(UserRole.CLINIC_ADMIN)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Create specialist' })
    async create(
        @CurrentUser() user: CurrentUserData,
        @Body() body: { name: string; description?: string },
    ) {
        if (!user.clinicId) {
            throw new ForbiddenException('User must be associated with a clinic');
        }
        return this.specialistsService.create(user.clinicId, body.name, body.description);
    }

    @Put(':id')
    @Roles(UserRole.CLINIC_ADMIN)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Update specialist' })
    async update(
        @Param('id') id: string,
        @Body() body: { name?: string; description?: string },
    ) {
        return this.specialistsService.update(id, body.name, body.description);
    }

    @Delete(':id')
    @Roles(UserRole.CLINIC_ADMIN)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Delete specialist' })
    async remove(@Param('id') id: string) {
        return this.specialistsService.remove(id);
    }
}

import {
    Controller,
    Get,
    Param,
    Query,
    Patch,
    Delete,
    HttpCode,
    HttpStatus,
    ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { Roles, CurrentUser, CurrentUserData } from '../../common/decorators';
import { UserRole } from '@prisma/client';
import { PaginationDto } from '../../common/dto';

@ApiTags('users')
@Controller('users')
@ApiBearerAuth('JWT-auth')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('me')
    @ApiOperation({ summary: 'Get current user profile' })
    async getProfile(@CurrentUser() user: CurrentUserData) {
        return this.usersService.findById(user.userId);
    }

    @Get()
    @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN)
    @ApiOperation({ summary: 'List users (clinic-scoped)' })
    async listUsers(
        @CurrentUser() user: CurrentUserData,
        @Query() pagination: PaginationDto,
        @Query('role') role?: UserRole,
    ) {
        if (!user.clinicId) {
            throw new ForbiddenException('User must be associated with a clinic');
        }
        return this.usersService.findByClinic(user.clinicId, pagination, role);
    }

    @Get(':id')
    @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN)
    @ApiOperation({ summary: 'Get user by ID' })
    async getUser(@Param('id') id: string) {
        return this.usersService.findById(id);
    }

    @Patch(':id/status')
    @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN)
    @ApiOperation({ summary: 'Update user status' })
    async updateStatus(
        @Param('id') id: string,
        @Query('isActive') isActive: boolean,
    ) {
        return this.usersService.updateStatus(id, isActive);
    }

    @Delete(':id')
    @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Soft delete user' })
    async deleteUser(@Param('id') id: string) {
        return this.usersService.softDelete(id);
    }
}

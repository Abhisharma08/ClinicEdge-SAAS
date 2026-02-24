import {
    Controller,
    Get,
    Param,
    Query,
    Patch,
    Post,
    Body,
    Delete,
    HttpCode,
    HttpStatus,
    ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto';
import { Roles, CurrentUser, CurrentUserData } from '../../common/decorators';
import { UserRole } from '@prisma/client';
import { PaginationDto } from '../../common/dto';

@ApiTags('users')
@Controller('users')
@ApiBearerAuth('JWT-auth')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post()
    @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN)
    @ApiOperation({ summary: 'Create a new user (Super Admin or Clinic Admin)' })
    async createUser(
        @Body() dto: CreateUserDto,
        @CurrentUser() user: CurrentUserData,
    ) {
        // Enforce Multi-Tenancy
        if (user.role === UserRole.CLINIC_ADMIN) {
            // Clinic Admin can only create users for their own clinic
            if (!user.clinicId) {
                throw new ForbiddenException('Clinic Admin must belong to a clinic to create users');
            }
            if (dto.clinicId && dto.clinicId !== user.clinicId) {
                throw new ForbiddenException('You can only create users for your own clinic');
            }
            // Force the clinic ID
            dto.clinicId = user.clinicId;
        } else if (user.role === UserRole.SUPER_ADMIN) {
            // Super admin must provide a clinic ID if creating a CLINIC_ADMIN or DOCTOR
            if ((dto.role === UserRole.CLINIC_ADMIN || dto.role === UserRole.DOCTOR) && !dto.clinicId) {
                throw new ForbiddenException(`clinicId is required when creating a ${dto.role}`);
            }
        }

        return this.usersService.create(dto);
    }

    @Get('me')
    @ApiOperation({ summary: 'Get current user profile' })
    async getProfile(@CurrentUser() user: CurrentUserData) {
        return this.usersService.findById(user.userId);
    }

    @Get()
    @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN)
    @ApiOperation({ summary: 'List users (global for super admin, clinic-scoped for clinic admin)' })
    async listUsers(
        @CurrentUser() user: CurrentUserData,
        @Query() pagination: PaginationDto,
        @Query('role') role?: UserRole,
    ) {
        // Super Admin sees all users globally
        if (user.role === UserRole.SUPER_ADMIN) {
            return this.usersService.findAll(pagination, role);
        }
        // Clinic Admin sees clinic-scoped users
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

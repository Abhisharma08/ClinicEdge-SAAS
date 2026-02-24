import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { PaginationDto } from '../../../common/dto';

export class UserListQueryDto extends PaginationDto {
    @ApiPropertyOptional({ enum: UserRole, description: 'Filter users by role' })
    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;
}

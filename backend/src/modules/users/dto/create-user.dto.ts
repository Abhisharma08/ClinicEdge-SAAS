import {
    IsEmail,
    IsString,
    MinLength,
    Matches,
    IsEnum,
    IsOptional,
    IsUUID
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
    @ApiProperty({ example: 'newuser@clinic.com' })
    @IsEmail()
    email: string;

    @ApiProperty({
        example: 'SecurePass@123',
        description: 'Minimum 8 characters, at least one uppercase, one lowercase, one number, one special character'
    })
    @IsString()
    @MinLength(8)
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        { message: 'Password must contain uppercase, lowercase, number, and special character' }
    )
    password: string;

    @ApiProperty({ enum: UserRole, example: UserRole.CLINIC_ADMIN })
    @IsEnum(UserRole)
    role: UserRole;

    @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
    @IsOptional()
    @IsUUID()
    clinicId?: string;
}

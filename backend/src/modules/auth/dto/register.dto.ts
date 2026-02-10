import {
    IsEmail,
    IsString,
    MinLength,
    IsEnum,
    IsOptional,
    IsUUID,
    Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class RegisterDto {
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

    @ApiPropertyOptional({ enum: UserRole, default: UserRole.PATIENT })
    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;

    @ApiPropertyOptional({ description: 'Clinic ID for clinic-scoped users' })
    @IsOptional()
    @IsUUID()
    clinicId?: string;
}

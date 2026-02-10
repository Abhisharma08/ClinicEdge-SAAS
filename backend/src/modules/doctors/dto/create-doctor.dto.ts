import { IsString, IsEmail, IsNotEmpty, MinLength, IsOptional, IsUUID, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDoctorDto {
    @ApiProperty({ example: 'Dr. John Doe' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 'doctor@clinic.com' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: 'Password@123', minLength: 6 })
    @IsString()
    @MinLength(6)
    password: string;

    @ApiProperty({ example: 'MD Cardiology' })
    @IsString()
    @IsNotEmpty()
    qualification: string;

    @ApiProperty({ example: 'REG123456' })
    @IsString()
    @IsNotEmpty()
    licenseNumber: string;

    @ApiProperty({ example: '+919876543210' })
    @IsString()
    @IsNotEmpty()
    phone: string;

    @ApiPropertyOptional({ description: 'Specialist ID' })
    @IsOptional()
    @IsUUID()
    specialistId?: string;
}

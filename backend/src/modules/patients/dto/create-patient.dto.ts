import {
    IsString,
    IsOptional,
    IsDateString,
    IsEnum,
    IsBoolean,
    Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from '@prisma/client';

export class CreatePatientDto {
    @ApiProperty({ example: 'Amit Kumar' })
    @IsString()
    name: string;

    @ApiProperty({ example: '+91-98765-00001', description: 'Phone number with country code' })
    @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'Invalid phone number format' })
    phone: string;

    @ApiPropertyOptional({ example: '1985-05-15' })
    @IsOptional()
    @IsDateString()
    dob?: string;

    @ApiPropertyOptional({ enum: Gender })
    @IsOptional()
    @IsEnum(Gender)
    gender?: Gender;

    @ApiPropertyOptional({ default: false })
    @IsOptional()
    @IsBoolean()
    whatsappConsent?: boolean;

    @ApiPropertyOptional({ example: '123 Main St, City' })
    @IsOptional()
    @IsString()
    address?: string;

    @ApiPropertyOptional({ example: 'patient@example.com' })
    @IsOptional()
    @IsString()
    email?: string;

    @ApiPropertyOptional({ example: 'O+' })
    @IsOptional()
    @IsString()
    bloodGroup?: string;

    @ApiPropertyOptional({ example: 'Peanuts, Penicillin' })
    @IsOptional()
    @IsString()
    allergies?: string;

    @ApiPropertyOptional({ example: 'Diabetes, Hypertension' })
    @IsOptional()
    @IsString()
    medicalHistory?: string;
}

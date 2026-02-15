import {
    IsString,
    IsOptional,
    IsDateString,
    IsEnum,
    IsBoolean,
    Matches,
    IsEmail,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from '@prisma/client';

export class CreatePatientDto {
    // ── Basic Information ──────────────────────────────────────────────
    @ApiProperty({ example: 'Amit' })
    @IsString()
    firstName: string;

    @ApiProperty({ example: 'Kumar' })
    @IsString()
    lastName: string;

    @ApiPropertyOptional({ example: 'Amit Kumar', description: 'Auto-generated from firstName + lastName if not provided' })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiProperty({ example: '+919876500001', description: 'Phone number with country code' })
    @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'Invalid phone number format' })
    phone: string;

    @ApiProperty({ example: '1985-05-15' })
    @IsDateString()
    dob: string;

    @ApiProperty({ enum: Gender })
    @IsEnum(Gender)
    gender: Gender;

    @ApiPropertyOptional({ example: 'patient@example.com' })
    @IsOptional()
    @IsEmail()
    email?: string;

    // ── Address Details ────────────────────────────────────────────────
    @ApiProperty({ example: '12 MG Road' })
    @IsString()
    addressLine1: string;

    @ApiPropertyOptional({ example: 'Near City Mall' })
    @IsOptional()
    @IsString()
    addressLine2?: string;

    @ApiProperty({ example: 'Mumbai' })
    @IsString()
    city: string;

    @ApiProperty({ example: 'Maharashtra' })
    @IsString()
    state: string;

    @ApiProperty({ example: '400001' })
    @IsString()
    postalCode: string;

    @ApiPropertyOptional({ example: 'India', default: 'India' })
    @IsOptional()
    @IsString()
    country?: string;

    // ── Emergency Contact ──────────────────────────────────────────────
    @ApiProperty({ example: 'Priya Kumar' })
    @IsString()
    emergencyName: string;

    @ApiProperty({ example: 'Spouse' })
    @IsString()
    emergencyRelationship: string;

    @ApiProperty({ example: '+919876500002' })
    @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'Invalid emergency phone number format' })
    emergencyPhone: string;

    // ── Nominee (Optional) ─────────────────────────────────────────────
    @ApiPropertyOptional({ example: 'Rahul Kumar' })
    @IsOptional()
    @IsString()
    nomineeName?: string;

    @ApiPropertyOptional({ example: 'Son' })
    @IsOptional()
    @IsString()
    nomineeRelationship?: string;

    @ApiPropertyOptional({ example: '+919876500003' })
    @IsOptional()
    @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'Invalid nominee phone number format' })
    nomineePhone?: string;

    // ── Medical ────────────────────────────────────────────────────────
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

    // ── Consent ────────────────────────────────────────────────────────
    @ApiPropertyOptional({ default: false })
    @IsOptional()
    @IsBoolean()
    whatsappConsent?: boolean;

    @ApiProperty({
        description: 'Consent for collection and processing of personal data under DPDP Act 2023',
        default: false,
    })
    @IsBoolean()
    dpdpConsent: boolean;
}

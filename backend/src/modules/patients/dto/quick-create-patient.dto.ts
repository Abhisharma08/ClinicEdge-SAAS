import {
    IsString,
    IsOptional,
    IsEmail,
    Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QuickCreatePatientDto {
    @ApiProperty({ example: 'Amit Kumar', description: 'Patient full name' })
    @IsString()
    name: string;

    @ApiProperty({ example: '+919876500001', description: 'Phone number with country code' })
    @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'Invalid phone number format' })
    phone: string;

    @ApiPropertyOptional({ example: 'patient@example.com' })
    @IsOptional()
    @IsEmail()
    email?: string;
}

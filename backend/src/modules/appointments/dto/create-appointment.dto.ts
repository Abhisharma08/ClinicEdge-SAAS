import {
    IsUUID,
    IsString,
    IsOptional,
    IsDateString,
    IsEmail,
    Matches,
    ValidateNested,
    ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class InlinePatientData {
    @ApiProperty({ example: 'Amit Kumar' })
    @IsString()
    name: string;

    @ApiProperty({ example: '+919876500001' })
    @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'Invalid phone number format' })
    phone: string;

    @ApiPropertyOptional({ example: 'patient@example.com' })
    @IsOptional()
    @IsEmail()
    email?: string;
}

export class CreateAppointmentDto {
    @ApiProperty({ description: 'Clinic ID' })
    @IsUUID()
    clinicId: string;

    @ApiPropertyOptional({ description: 'Patient ID (required if patientData not provided)' })
    @ValidateIf((o) => !o.patientData)
    @IsUUID()
    patientId?: string;

    @ApiPropertyOptional({ description: 'Inline patient data for quick creation (used if patientId not provided)' })
    @ValidateIf((o) => !o.patientId)
    @ValidateNested()
    @Type(() => InlinePatientData)
    patientData?: InlinePatientData;

    @ApiProperty({ description: 'Doctor ID' })
    @IsUUID()
    doctorId: string;

    @ApiPropertyOptional({ description: 'Specialist ID' })
    @IsOptional()
    @IsUUID()
    specialistId?: string;

    @ApiProperty({ description: 'Appointment date (YYYY-MM-DD)', example: '2024-02-15' })
    @IsDateString()
    appointmentDate: string;

    @ApiProperty({ description: 'Start time (HH:MM)', example: '10:00' })
    @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: 'Start time must be in HH:MM format',
    })
    startTime: string;

    @ApiProperty({ description: 'End time (HH:MM)', example: '10:30' })
    @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: 'End time must be in HH:MM format',
    })
    endTime: string;

    @ApiPropertyOptional({ description: 'Additional notes' })
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiPropertyOptional({ description: 'Idempotency key for duplicate prevention' })
    @IsOptional()
    @IsString()
    idempotencyKey?: string;
}


import {
    IsUUID,
    IsString,
    IsOptional,
    IsDateString,
    Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAppointmentDto {
    @ApiProperty({ description: 'Clinic ID' })
    @IsUUID()
    clinicId: string;

    @ApiProperty({ description: 'Patient ID' })
    @IsUUID()
    patientId: string;

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

import {
    IsUUID,
    IsString,
    IsOptional,
    IsDateString,
    Matches,
    ValidateNested,
    IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class PatientInfoDto {
    @ApiProperty({ description: 'Patient Name' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ description: 'Patient Phone' })
    @IsString()
    @IsNotEmpty()
    phone: string;

    @ApiPropertyOptional({ description: 'Notes' })
    @IsOptional()
    @IsString()
    notes?: string;
}

export class PublicBookAppointmentDto {
    @ApiProperty({ description: 'Clinic ID' })
    @IsUUID()
    clinicId: string;

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

    @ApiProperty({ description: 'Patient Information' })
    @ValidateNested()
    @Type(() => PatientInfoDto)
    patientInfo: PatientInfoDto;
}

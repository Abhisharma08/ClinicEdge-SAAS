import { IsUUID, IsString, IsOptional, IsDateString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreatePrescriptionDto } from './create-prescription.dto';

export class CreateVisitRecordDto {
    @ApiProperty()
    @IsUUID()
    appointmentId: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    diagnosis?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    symptoms?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    followUpDate?: string;

    @ApiPropertyOptional({ type: [CreatePrescriptionDto] })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreatePrescriptionDto)
    prescriptions?: CreatePrescriptionDto[];
}

import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePrescriptionDto {
    @ApiProperty({ example: 'Paracetamol 500mg' })
    @IsString()
    medication: string;

    @ApiPropertyOptional({ example: '1 tablet' })
    @IsOptional()
    @IsString()
    dosage?: string;

    @ApiPropertyOptional({ example: 'Twice daily' })
    @IsOptional()
    @IsString()
    frequency?: string;

    @ApiPropertyOptional({ example: '5 days' })
    @IsOptional()
    @IsString()
    duration?: string;

    @ApiPropertyOptional({ example: 'Take after meals' })
    @IsOptional()
    @IsString()
    instructions?: string;
}

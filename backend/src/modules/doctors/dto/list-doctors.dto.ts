import { IsUUID, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto';

export class ListDoctorsDto extends PaginationDto {
    @ApiProperty({ description: 'Clinic ID' })
    @IsUUID()
    clinicId: string;

    @ApiPropertyOptional({ description: 'Specialist ID' })
    @IsOptional()
    @IsUUID()
    specialistId?: string;

    @ApiPropertyOptional({ description: 'Search by name or phone' })
    @IsOptional()
    @IsString()
    search?: string;
}

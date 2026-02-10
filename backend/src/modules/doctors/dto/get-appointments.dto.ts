
import { IsBoolean, IsDateString, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationDto } from '../../../common/dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetAppointmentsDto extends PaginationDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    date?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    upcoming?: boolean;
}

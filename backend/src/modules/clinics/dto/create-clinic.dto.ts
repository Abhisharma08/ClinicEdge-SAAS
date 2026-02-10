import { IsString, IsOptional, IsEmail, IsObject, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClinicDto {
    @ApiProperty({ example: 'HealthFirst Medical Center' })
    @IsString()
    name: string;

    @ApiPropertyOptional({ example: '123 Medical Plaza, Mumbai, Maharashtra' })
    @IsOptional()
    @IsString()
    address?: string;

    @ApiPropertyOptional({ example: '+91-22-1234-5678' })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional({ example: 'contact@healthfirst.clinic' })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiPropertyOptional({ example: 'https://g.page/r/healthfirst/review' })
    @IsOptional()
    @IsUrl()
    googleReviewUrl?: string;

    @ApiPropertyOptional({
        example: {
            timezone: 'Asia/Kolkata',
            slotDuration: 30,
            bookingAdvanceDays: 30,
            cancelBeforeHours: 4,
        },
    })
    @IsOptional()
    @IsObject()
    settings?: Record<string, any>;
}

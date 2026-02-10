import { IsInt, Min, Max, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubmitFeedbackDto {
    @ApiProperty({ minimum: 1, maximum: 5, description: 'Rating from 1 to 5 stars' })
    @IsInt()
    @Min(1)
    @Max(5)
    rating: number;

    @ApiPropertyOptional({ maxLength: 1000 })
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    comments?: string;
}

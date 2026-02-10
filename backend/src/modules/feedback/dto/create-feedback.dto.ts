import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SubmitFeedbackDto } from './submit-feedback.dto';

export class CreateFeedbackDto extends SubmitFeedbackDto {
    @ApiProperty({ description: 'Feedback token' })
    @IsString()
    @IsNotEmpty()
    token: string;
}

import { IsEmail, IsNotEmpty, MinLength, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
    @ApiProperty()
    @IsEmail()
    @IsNotEmpty()
    email: string;
}

export class ResetPasswordDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    token: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    newPassword: string;
}

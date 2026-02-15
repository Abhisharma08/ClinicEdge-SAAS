import {
    Controller,
    Post,
    Body,
    HttpCode,
    HttpStatus,
    UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService, AuthTokens } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/password-reset.dto';
import { Public, CurrentUser, CurrentUserData } from '../../common/decorators';


@ApiTags('auth')
@Controller('auth')
@Throttle({ default: { limit: 5, ttl: 60000 } })
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'User login' })
    @ApiResponse({ status: 200, description: 'Login successful' })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    async login(@Body() dto: LoginDto): Promise<AuthTokens> {
        return this.authService.login(dto);
    }

    @Public()
    @Post('register')
    @ApiOperation({ summary: 'Register new user (internal - clinic registration only)' })
    @ApiResponse({ status: 201, description: 'Registration successful' })
    @ApiResponse({ status: 409, description: 'Email already exists' })
    async register(@Body() dto: RegisterDto): Promise<AuthTokens> {
        return this.authService.register(dto);
    }

    @Public()
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Refresh access token' })
    @ApiResponse({ status: 200, description: 'Token refreshed' })
    @ApiResponse({ status: 401, description: 'Invalid refresh token' })
    async refresh(@Body() dto: RefreshTokenDto): Promise<AuthTokens> {
        return this.authService.refreshToken(dto.refreshToken);
    }

    @Post('logout')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Logout user' })
    @ApiResponse({ status: 204, description: 'Logged out successfully' })
    async logout(@CurrentUser() user: CurrentUserData): Promise<void> {
        return this.authService.logout(user.userId);
    }

    @Post('me')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Get current user info' })
    @ApiResponse({ status: 200, description: 'Current user data' })
    async me(@CurrentUser() user: CurrentUserData) {
        return user;
    }

    @Public()
    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    @Throttle({ default: { limit: 3, ttl: 3600000 } })
    @ApiOperation({ summary: 'Request password reset' })
    @ApiResponse({ status: 200, description: 'Reset email sent if user exists' })
    async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<void> {
        return this.authService.forgotPassword(dto);
    }

    @Public()
    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Reset password using token' })
    @ApiResponse({ status: 200, description: 'Password reset successful' })
    @ApiResponse({ status: 400, description: 'Invalid or expired token' })
    async resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
        return this.authService.resetPassword(dto);
    }
}

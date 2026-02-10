import {
    Injectable,
    UnauthorizedException,
    ConflictException,
    Logger,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/password-reset.dto';
import { EmailService } from '../integrations/email/email.service';
import { UserRole } from '@prisma/client';
import { generateSecureToken } from '../../common/utils/encryption.util';

export interface JwtPayload {
    sub: string;
    email: string;
    role: UserRole;
    clinicId?: string;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: {
        id: string;
        email: string;
        role: UserRole;
        clinicId?: string;
    };
}

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    private readonly BCRYPT_ROUNDS = 12;
    private readonly REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days in seconds
    private readonly PASSWORD_RESET_TTL = 3600; // 1 hour

    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private configService: ConfigService,
        private redisService: RedisService,
        private emailService: EmailService,
    ) { }

    async login(dto: LoginDto): Promise<AuthTokens> {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (!user || !user.isActive) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Update last login
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        return this.generateTokens(user);
    }

    async register(dto: RegisterDto): Promise<AuthTokens> {
        // Check if email exists
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (existingUser) {
            throw new ConflictException('Email already registered');
        }

        // Hash password
        const passwordHash = await bcrypt.hash(dto.password, this.BCRYPT_ROUNDS);

        // Create user
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                passwordHash,
                role: dto.role || UserRole.PATIENT,
                clinicId: dto.clinicId,
                isActive: true,
            },
        });

        this.logger.log(`New user registered: ${user.email} as ${user.role}`);

        return this.generateTokens(user);
    }

    async refreshToken(refreshToken: string): Promise<AuthTokens> {
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.get<string>('jwt.secret'),
            });

            // Verify token exists in Redis
            const storedToken = await this.redisService.getSession(payload.sub);
            if (!storedToken || (storedToken as any).refreshToken !== refreshToken) {
                throw new UnauthorizedException('Invalid refresh token');
            }

            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
            });

            if (!user || !user.isActive) {
                throw new UnauthorizedException('User not found or inactive');
            }

            // Invalidate old refresh token
            await this.redisService.deleteSession(payload.sub);

            return this.generateTokens(user);
        } catch (error) {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    async logout(userId: string): Promise<void> {
        await this.redisService.deleteSession(userId);
        this.logger.log(`User logged out: ${userId}`);
    }

    async validateUser(payload: JwtPayload): Promise<any> {
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
            select: {
                id: true,
                email: true,
                role: true,
                clinicId: true,
                isActive: true,
            },
        });

        if (!user || !user.isActive) {
            throw new UnauthorizedException('User not found or inactive');
        }

        return {
            userId: user.id,
            email: user.email,
            role: user.role,
            clinicId: user.clinicId,
        };
    }

    async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (!user || !user.isActive) {
            // Don't reveal that user doesn't exist
            return;
        }

        const token = generateSecureToken(32);
        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

        // Store token in Redis
        await this.redisService.set(
            `password_reset:${token}`,
            user.id,
            this.PASSWORD_RESET_TTL,
        );

        // Send email
        await this.emailService.sendEmail(
            user.email,
            'Reset Your Password',
            `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2>Password Reset Request</h2>
                    <p>You requested to reset your password. Click the link below to proceed:</p>
                    <p><a href="${resetLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
                    <p>If you didn't request this, please ignore this email. The link will expire in 1 hour.</p>
                </div>
            `
        );

        this.logger.log(`Password reset email sent to ${user.email}`);
    }

    async resetPassword(dto: ResetPasswordDto): Promise<void> {
        const userId = await this.redisService.get(`password_reset:${dto.token}`);

        if (!userId) {
            throw new BadRequestException('Invalid or expired reset token');
        }

        const passwordHash = await bcrypt.hash(dto.newPassword, this.BCRYPT_ROUNDS);

        await this.prisma.user.update({
            where: { id: userId },
            data: { passwordHash },
        });

        // Invalidate token
        await this.redisService.del(`password_reset:${dto.token}`);

        // Optional: Invalidate all sessions to force re-login?
        // await this.logout(userId);

        this.logger.log(`Password reset successful for user ${userId}`);
    }

    private async generateTokens(user: any): Promise<AuthTokens> {
        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            clinicId: user.clinicId,
        };

        const accessToken = this.jwtService.sign(payload);

        const refreshToken = this.jwtService.sign(payload, {
            expiresIn: this.configService.get<string>('jwt.refreshExpiry'),
        });

        // Store refresh token in Redis
        await this.redisService.setSession(
            user.id,
            { refreshToken },
            this.REFRESH_TOKEN_TTL,
        );

        return {
            accessToken,
            refreshToken,
            expiresIn: 86400, // 24 hours in seconds
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                clinicId: user.clinicId,
            },
        };
    }
}

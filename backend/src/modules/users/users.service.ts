import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { PaginationDto, createPaginatedResult } from '../../common/dto';
import { CreateUserDto } from './dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreateUserDto) {
        // Check if email exists
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (existingUser) {
            throw new NotFoundException('Email already registered'); // Use ConflictException usually, but NestJS built-ins are fine
        }

        // Hash password
        const passwordHash = await bcrypt.hash(dto.password, 12);

        // Create user
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                passwordHash,
                role: dto.role,
                clinicId: dto.clinicId,
                isActive: true,
            },
            select: {
                id: true,
                email: true,
                role: true,
                clinicId: true,
                isActive: true,
                createdAt: true,
            }
        });

        return user;
    }

    async findById(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                role: true,
                clinicId: true,
                isActive: true,
                createdAt: true,
                lastLoginAt: true,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    async findByEmail(email: string) {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    async findByClinic(clinicId: string, pagination: PaginationDto, role?: UserRole) {
        const where = {
            clinicId,
            deletedAt: null,
            ...(role && { role }),
        };

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip: pagination.skip,
                take: pagination.take,
                select: {
                    id: true,
                    email: true,
                    role: true,
                    isActive: true,
                    createdAt: true,
                    lastLoginAt: true,
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.user.count({ where }),
        ]);

        return createPaginatedResult(users, total, pagination);
    }

    async findAll(pagination: PaginationDto, role?: UserRole) {
        const where = {
            deletedAt: null,
            ...(role && { role }),
        };

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip: pagination.skip,
                take: pagination.take,
                select: {
                    id: true,
                    email: true,
                    role: true,
                    clinicId: true,
                    isActive: true,
                    createdAt: true,
                    lastLoginAt: true,
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.user.count({ where }),
        ]);

        return createPaginatedResult(users, total, pagination);
    }

    async updateStatus(id: string, isActive: boolean) {
        return this.prisma.user.update({
            where: { id },
            data: { isActive },
        });
    }

    async softDelete(id: string) {
        return this.prisma.user.update({
            where: { id },
            data: { deletedAt: new Date(), isActive: false },
        });
    }
}

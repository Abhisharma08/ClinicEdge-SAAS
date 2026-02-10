import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { PaginationDto, createPaginatedResult } from '../../common/dto';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

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

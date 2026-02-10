import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

interface ErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: any;
        timestamp: string;
        path: string;
    };
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let code = 'INTERNAL_ERROR';
        let message = 'An unexpected error occurred';
        let details = null;

        // Handle NestJS HTTP exceptions
        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            } else if (typeof exceptionResponse === 'object') {
                const resp = exceptionResponse as any;
                message = resp.message || message;
                details = resp.errors || null;
            }

            code = this.getErrorCode(status);
        }

        // Handle Prisma errors
        else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
            const { code: prismaCode, message: prismaMessage } =
                this.handlePrismaError(exception);
            status = HttpStatus.BAD_REQUEST;
            code = prismaCode;
            message = prismaMessage;
        }

        // Handle Prisma validation errors
        else if (exception instanceof Prisma.PrismaClientValidationError) {
            status = HttpStatus.BAD_REQUEST;
            code = 'VALIDATION_ERROR';
            message = 'Invalid data provided';
        }

        // Handle generic errors
        else if (exception instanceof Error) {
            message = exception.message;
        }

        // Log error
        this.logger.error(
            `[${request.method}] ${request.path} - ${status} - ${message}`,
            exception instanceof Error ? exception.stack : exception,
        );

        const errorResponse: ErrorResponse = {
            success: false,
            error: {
                code,
                message,
                details,
                timestamp: new Date().toISOString(),
                path: request.path,
            },
        };

        response.status(status).json(errorResponse);
    }

    private getErrorCode(status: number): string {
        const codeMap: Record<number, string> = {
            400: 'BAD_REQUEST',
            401: 'UNAUTHORIZED',
            403: 'FORBIDDEN',
            404: 'NOT_FOUND',
            409: 'CONFLICT',
            422: 'UNPROCESSABLE_ENTITY',
            429: 'TOO_MANY_REQUESTS',
            500: 'INTERNAL_ERROR',
        };
        return codeMap[status] || 'UNKNOWN_ERROR';
    }

    private handlePrismaError(error: Prisma.PrismaClientKnownRequestError): {
        code: string;
        message: string;
    } {
        switch (error.code) {
            case 'P2002':
                // Unique constraint violation
                const field = (error.meta?.target as string[])?.join(', ') || 'field';
                return {
                    code: 'DUPLICATE_ENTRY',
                    message: `A record with this ${field} already exists`,
                };

            case 'P2025':
                // Record not found
                return {
                    code: 'NOT_FOUND',
                    message: 'The requested record was not found',
                };

            case 'P2003':
                // Foreign key constraint
                return {
                    code: 'INVALID_REFERENCE',
                    message: 'Referenced record does not exist',
                };

            case 'P2014':
                // Required relation violation
                return {
                    code: 'REQUIRED_RELATION',
                    message: 'Required relation is missing',
                };

            default:
                return {
                    code: 'DATABASE_ERROR',
                    message: 'A database error occurred',
                };
        }
    }
}

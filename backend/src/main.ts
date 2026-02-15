import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, BadRequestException } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
    const logger = new Logger('Bootstrap');

    // ── Fail-fast: validate required secrets ──────────────────────────
    const requiredEnvVars = ['JWT_SECRET', 'ENCRYPTION_KEY'];
    const missing = requiredEnvVars.filter((v) => !process.env[v]);
    if (missing.length > 0) {
        logger.error(
            `Missing required environment variables: ${missing.join(', ')}. ` +
            `Set them before starting the server.`,
        );
        process.exit(1);
    }

    const app = await NestFactory.create(AppModule, {
        logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    // Global prefix
    app.setGlobalPrefix('api/v1');

    // Graceful shutdown
    app.enableShutdownHooks();

    // CORS configuration
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction && !process.env.CORS_ORIGINS) {
        logger.error('CORS_ORIGINS must be set in production. Exiting.');
        process.exit(1);
    }

    app.enableCors({
        origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        credentials: true,
    });

    // Global validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
            exceptionFactory: (errors) => {
                const messages = errors.map((error) => ({
                    property: error.property,
                    constraints: error.constraints,
                }));
                const logger = new Logger('ValidationPipe');
                logger.error('Validation Warning:', JSON.stringify(messages, null, 2));
                return new BadRequestException(messages);
            },
        }),
    );

    // Swagger documentation — disabled in production
    if (!isProduction) {
        const config = new DocumentBuilder()
            .setTitle('Clinic CRM API')
            .setDescription('Production-grade multi-tenant Clinic CRM REST API')
            .setVersion('1.0')
            .addBearerAuth(
                {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    name: 'JWT',
                    description: 'Enter JWT token',
                    in: 'header',
                },
                'JWT-auth',
            )
            .addTag('auth', 'Authentication endpoints')
            .addTag('clinics', 'Clinic management')
            .addTag('doctors', 'Doctor management')
            .addTag('specialists', 'Specialist management')
            .addTag('patients', 'Patient management')
            .addTag('appointments', 'Appointment booking')
            .addTag('visit-records', 'Visit records and prescriptions')
            .addTag('feedback', 'Feedback management')
            .addTag('notifications', 'Notification management')
            .build();

        const document = SwaggerModule.createDocument(app, config);
        SwaggerModule.setup('api/docs', app, document);
    }

    const port = process.env.PORT || 3001;
    await app.listen(port);

    console.log(`
╔════════════════════════════════════════════════════════════════╗
║             🏥 Clinic CRM API Server Started                   ║
╠════════════════════════════════════════════════════════════════╣
║  🌐 Server:     http://localhost:${port}                         ║
║  📚 API Docs:   ${isProduction ? 'DISABLED (production)' : `http://localhost:${port}/api/docs`}                ║
║  🔧 Environment: ${process.env.NODE_ENV || 'development'}                              ║
╚════════════════════════════════════════════════════════════════╝
  `);
}

// Backend started
bootstrap();


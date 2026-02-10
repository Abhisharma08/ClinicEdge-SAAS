import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    // Global prefix
    app.setGlobalPrefix('api/v1');

    // CORS configuration
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
        }),
    );

    // Swagger documentation
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

    const port = process.env.PORT || 3001;
    await app.listen(port);

    console.log(`
╔════════════════════════════════════════════════════════════════╗
║             🏥 Clinic CRM API Server Started                   ║
╠════════════════════════════════════════════════════════════════╣
║  🌐 Server:     http://localhost:${port}                         ║
║  📚 API Docs:   http://localhost:${port}/api/docs                ║
║  🔧 Environment: ${process.env.NODE_ENV || 'development'}                              ║
╚════════════════════════════════════════════════════════════════╝
  `);
}

// Backend started
bootstrap();

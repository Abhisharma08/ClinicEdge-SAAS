export default () => ({
    // Application
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3001', 10) || 3001,

    // Database
    database: {
        url: process.env.DATABASE_URL,
    },

    // Redis
    redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
    },

    // JWT — no fallback; validated at startup
    jwt: {
        secret: process.env.JWT_SECRET,
        accessExpiry: process.env.JWT_ACCESS_EXPIRY || '24h',
        refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
    },

    // MinIO Storage
    storage: {
        endpoint: process.env.MINIO_ENDPOINT || 'localhost',
        port: parseInt(process.env.MINIO_PORT || '9000', 10) || 9000,
        useSSL: process.env.MINIO_USE_SSL === 'true',
        accessKey: process.env.MINIO_ACCESS_KEY || 'minio_admin',
        secretKey: process.env.MINIO_SECRET_KEY || 'minio_secret_key',
        bucket: process.env.MINIO_BUCKET || 'clinic-crm',
    },

    // Interakt WhatsApp API
    interakt: {
        apiKey: process.env.INTERAKT_API_KEY,
        baseUrl: process.env.INTERAKT_BASE_URL || 'https://api.interakt.ai/v1',
    },

    // Encryption — no fallback; validated at startup
    encryption: {
        key: process.env.ENCRYPTION_KEY,
    },

    // Timezone
    timezone: process.env.DEFAULT_TIMEZONE || 'Asia/Kolkata',

    // CORS
    cors: {
        origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    },
});

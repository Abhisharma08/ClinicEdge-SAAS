import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
    private client: Redis;
    private readonly logger = new Logger(RedisService.name);

    constructor(private configService: ConfigService) { }

    async onModuleInit() {
        const redisUrl = this.configService.get<string>('redis.url') || 'redis://localhost:6379';
        this.client = new Redis(redisUrl);

        this.client.on('connect', () => {
            this.logger.log('Redis connected');
        });

        this.client.on('error', (err) => {
            this.logger.error('Redis error:', err);
        });
    }

    async onModuleDestroy() {
        await this.client.quit();
    }

    getClient(): Redis {
        return this.client;
    }

    // Slot caching for appointments
    async getCachedSlots(key: string): Promise<string[] | null> {
        const data = await this.client.get(key);
        if (!data) return null;

        try {
            return JSON.parse(data);
        } catch (error) {
            this.logger.error(`Error parsing cached slots for key ${key}:`, error);
            await this.client.del(key); // Clear corrupted cache
            return null;
        }
    }

    async setCachedSlots(
        key: string,
        slots: string[],
        ttlSeconds: number = 300,
    ): Promise<void> {
        await this.client.setex(key, ttlSeconds, JSON.stringify(slots));
    }

    async invalidateSlotCache(clinicId: string, doctorId: string, date: string): Promise<void> {
        const pattern = `slots:${clinicId}:${doctorId}:${date}`;
        await this.delByScan(pattern);
    }

    // Rate limiting helpers
    async checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
        const current = await this.client.incr(key);
        if (current === 1) {
            await this.client.expire(key, windowSeconds);
        }
        return current <= limit;
    }

    // Distributed lock for appointment booking
    async acquireLock(key: string, ttlMs: number = 5000): Promise<string | null> {
        const lockId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const result = await this.client.set(key, lockId, 'PX', ttlMs, 'NX');
        return result === 'OK' ? lockId : null;
    }

    async releaseLock(key: string, lockId: string): Promise<boolean> {
        const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
        const result = await this.client.eval(script, 1, key, lockId);
        return result === 1;
    }

    // Session management
    async setSession(sessionId: string, data: object, ttlSeconds: number = 86400): Promise<void> {
        await this.client.setex(`session:${sessionId}`, ttlSeconds, JSON.stringify(data));
    }

    async getSession(sessionId: string): Promise<object | null> {
        const data = await this.client.get(`session:${sessionId}`);
        return data ? JSON.parse(data) : null;
    }

    async deleteSession(sessionId: string): Promise<void> {
        await this.client.del(`session:${sessionId}`);
    }

    // Generic key-value storage
    async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
        if (ttlSeconds) {
            await this.client.setex(key, ttlSeconds, value);
        } else {
            await this.client.set(key, value);
        }
    }

    async get(key: string): Promise<string | null> {
        return this.client.get(key);
    }

    async del(key: string): Promise<void> {
        await this.client.del(key);
    }

    async delPattern(pattern: string): Promise<void> {
        await this.delByScan(pattern);
    }

    /**
     * Uses SCAN instead of KEYS to avoid blocking Redis under load.
     */
    private async delByScan(pattern: string): Promise<void> {
        const stream = this.client.scanStream({ match: pattern, count: 100 });
        for await (const keys of stream) {
            if (keys.length > 0) {
                await this.client.del(...keys);
            }
        }
    }
}

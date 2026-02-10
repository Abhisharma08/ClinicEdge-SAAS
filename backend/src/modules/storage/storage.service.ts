import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StorageService implements OnModuleInit {
    private readonly logger = new Logger(StorageService.name);
    private client: Minio.Client;
    private bucket: string;

    constructor(private configService: ConfigService) {
        this.bucket = this.configService.get<string>('storage.bucket') || 'clinic-crm';

        this.client = new Minio.Client({
            endPoint: this.configService.get<string>('storage.endpoint') || 'localhost',
            port: this.configService.get<number>('storage.port') || 9000,
            useSSL: this.configService.get<boolean>('storage.useSSL') || false,
            accessKey: this.configService.get<string>('storage.accessKey') || 'minio_admin',
            secretKey: this.configService.get<string>('storage.secretKey') || 'minio_secret_key',
        });
    }

    async onModuleInit() {
        try {
            const exists = await this.client.bucketExists(this.bucket);
            if (!exists) {
                await this.client.makeBucket(this.bucket);
                this.logger.log(`Created bucket: ${this.bucket}`);
            }
            this.logger.log('MinIO storage initialized');
        } catch (error) {
            this.logger.error('Failed to initialize MinIO:', error.message);
        }
    }

    async uploadFile(file: Express.Multer.File, path: string): Promise<string> {
        const extension = file.originalname.split('.').pop();
        const fileName = `${path}/${uuidv4()}.${extension}`;

        await this.client.putObject(
            this.bucket,
            fileName,
            file.buffer,
            file.size,
            { 'Content-Type': file.mimetype },
        );

        this.logger.log(`File uploaded: ${fileName}`);

        return this.getFileUrl(fileName);
    }

    async deleteFile(fileName: string): Promise<void> {
        await this.client.removeObject(this.bucket, fileName);
        this.logger.log(`File deleted: ${fileName}`);
    }

    async getPresignedUrl(fileName: string, expirySeconds: number = 3600): Promise<string> {
        return this.client.presignedGetObject(this.bucket, fileName, expirySeconds);
    }

    private getFileUrl(fileName: string): string {
        const endpoint = this.configService.get<string>('storage.endpoint');
        const port = this.configService.get<number>('storage.port');
        const useSSL = this.configService.get<boolean>('storage.useSSL');
        const protocol = useSSL ? 'https' : 'http';

        return `${protocol}://${endpoint}:${port}/${this.bucket}/${fileName}`;
    }
}

import { Module } from '@nestjs/common';
import { DoctorsController } from './doctors.controller';
import { DoctorsService } from './doctors.service';
import { RedisModule } from '../../redis/redis.module';

@Module({
    imports: [RedisModule],
    controllers: [DoctorsController],
    providers: [DoctorsService],
    exports: [DoctorsService],
})
export class DoctorsModule { }

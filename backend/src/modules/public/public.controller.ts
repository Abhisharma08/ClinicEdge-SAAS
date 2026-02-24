import { Controller, Get } from '@nestjs/common';
import { PublicService } from './public.service';
import { Public } from '../../common/decorators';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('public')
@Controller('public')
export class PublicController {
    constructor(private readonly publicService: PublicService) { }

    @Get('stats')
    @Public()
    @ApiOperation({ summary: 'Get public statistics for landing page' })
    async getStats() {
        return this.publicService.getStats();
    }
}

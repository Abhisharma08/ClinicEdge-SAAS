import {
    Controller,
    Post,
    Body,
    ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CampaignsService, SendCampaignDto } from './campaigns.service';
import { Roles, CurrentUser, CurrentUserData } from '../../common/decorators';
import { UserRole } from '@prisma/client';

@ApiTags('campaigns')
@Controller('campaigns')
@ApiBearerAuth('JWT-auth')
export class CampaignsController {
    constructor(private readonly campaignsService: CampaignsService) { }

    @Post('send')
    @Roles(UserRole.CLINIC_ADMIN, UserRole.DOCTOR)
    @ApiOperation({ summary: 'Send WhatsApp campaign to selected patients' })
    async sendCampaign(
        @Body() dto: SendCampaignDto,
        @CurrentUser() user: CurrentUserData,
    ) {
        if (!user.clinicId) {
            throw new ForbiddenException('User must be associated with a clinic');
        }
        return this.campaignsService.sendCampaign(dto, user.clinicId);
    }
}

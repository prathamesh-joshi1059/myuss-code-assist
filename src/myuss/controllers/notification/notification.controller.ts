import { Body, Controller, Post, UseGuards, UseFilters } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationService } from '../../services/notification/notification.service';
import { NotificationResponse } from '../../models/notification';
import { NotificationReqDTO } from './dto/notification-req.dto';
import { ApiRespDTO } from '../../../common/dto/api-resp.dto';
import { ApiTags, ApiBearerAuth, ApiUnauthorizedResponse, ApiResponse, ApiInternalServerErrorResponse } from '@nestjs/swagger';
import { AccountIdGuard } from '../../custom-guard/accountId.guard';
import { ThrottlerExceptionFilter } from '../../../core/utils/rate-limiting-exception/throttler-exception-filter';

@UseFilters(ThrottlerExceptionFilter)
@ApiBearerAuth()
@ApiTags('notifications')
@Controller('api/notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationController {
    constructor(private notificationService: NotificationService) {}

    @UseGuards(AccountIdGuard)
    @Post()
    @ApiResponse({ status: 1000, description: 'Success', type: NotificationResponse })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error' })
    async fetchNotification(@Body() request: NotificationReqDTO): Promise<ApiRespDTO<NotificationResponse>> {
        const notificationResp = await this.notificationService.fetchNotification(request.accountId);
        return notificationResp;
    }
}
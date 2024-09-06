import { Body, Controller, Post } from '@nestjs/common';
import { PlytixService } from '../services/plytix.service';
import { PlytixWebhookCallReqDTO } from '../models/plytix-webhook-call-req.dto';
import { LoggerService } from '../../core/logger/logger.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Plytix')
@Controller('api/plytix')
export class PlytixController {
  constructor(private readonly plytixService: PlytixService, private readonly logger: LoggerService) {}

  @Post('plytix-webhook-call')
  async plytixWebhookCall(@Body() plytixWebhookCallReqDto: PlytixWebhookCallReqDTO) {
    try {
      return await this.plytixService.plytixWebhookCall(plytixWebhookCallReqDto);
    } catch (error) {
      this.logger.error(error);
      throw error; // rethrowing the error to propagate it further
    }
  }
}
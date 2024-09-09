import { Body, Controller, Post, Query, UseGuards, VERSION_NEUTRAL, UseFilters } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LoggerService } from '../../../core/logger/logger.service';
import { OrderInfoService } from '../../services/order-info/order-info.service';
import { GetOrderInfoDTO } from './dto/get-order-info.dto';
import { RecaptchaService } from '../../../backend/google/recaptcha/recaptcha.service';
import { ThrottlerExceptionFilter } from '../../../core/utils/rate-limiting-exception/throttler-exception-filter';

@UseFilters(ThrottlerExceptionFilter)
@Controller({ 
  path: 'api/uss-web/order-info',
  version: [VERSION_NEUTRAL, '1']
})
@UseGuards(AuthGuard('jwt'))
export class OrderInfoController {
  constructor(
    private logger: LoggerService,
    private orderInfoService: OrderInfoService,
    private recaptchaService: RecaptchaService,
  ) {}

  @Post()
  public async getOrderInfo(@Body() body: GetOrderInfoDTO) {
    try {
      const token = body.reCaptchaToken;
      // check the reCaptcha
      const recaptchaResult = await this.recaptchaService.verifyRecaptcha(
        token,
        'order_info',
      );
      if (!recaptchaResult.success) {
        return { status_code: 'ERR_RECAPTCHA' };
      }
      const orderId = body.orderNo;
      const zipCode = body.zip;

      this.logger.info(`getOrderInfo: ${body.orderNo} zip: ${body.zip}`);
      const orderInfo = await this.orderInfoService.getOrderInfoByOrderIdAndZIP(
        orderId,
        zipCode,
      );
      if (orderInfo) {
        if (orderInfo.order_status === 'Canceled') {
          return { 
            status_code: 'ERR_CANCELED',
            default_message: 'The order has been canceled. Please contact us at 1-800-TOILETS.' 
          };
        }
        return orderInfo;
      } else {
        return { 
          status_code: 'ERR_NOT_FOUND',
          default_message: 'The order/zip code combination was not found. Please check your order number and zip code and try again or contact us at 1-800-TOILETS.'
         };
      }
    } catch (err) {
      this.logger.error(err);
      return { 
        status_code: 'ERR_OTHER',
        default_message: 'An error occurred. Please try again or contact us at 1-800-TOILETS.'
      };
    }
  }
}

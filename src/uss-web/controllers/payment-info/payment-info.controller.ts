import {
  Controller,
  UseGuards,
  Post,
  Request,
  Body,
  HttpException,
  VERSION_NEUTRAL,
  UseFilters,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LoggerService } from '../../../core/logger/logger.service';
import { PaymentInfoService } from '../../services/payment-info/payment-info.service';
import { SetupIntentReqDTO } from './dto/setup-intent-req.dto';
import { SetupIntentRespDTO } from './dto/setup-intent-resp.dto';
import { AuthService } from '../../../auth/auth/auth.service';
import { UpdatePaymentMethodReqDTO, UpdatePaymentMethodRespDTO } from './dto/update-payment-method-req.dto';
import { PaymentMethodAuthGuard } from '../../../auth/auth/payment-method/payment-method.guard';
import { RecaptchaService } from '../../../backend/google/recaptcha/recaptcha.service';
import { ThrottlerExceptionFilter } from '../../../core/utils/rate-limiting-exception/throttler-exception-filter';

@UseFilters(ThrottlerExceptionFilter)
@Controller({
  path: 'api/uss-web/payment-info',
  version: [VERSION_NEUTRAL, '1'],
})
@UseGuards(AuthGuard('jwt'))
export class PaymentInfoController {
  constructor(
    private logger: LoggerService,
    private paymentInfoService: PaymentInfoService,
    private authService: AuthService,
    private recaptchaService: RecaptchaService,
  ) {}

  @Post('setup-intent')
  async createSetupIntent(
    @Request() req: Request,
    @Body() body: SetupIntentReqDTO,
  ): Promise<SetupIntentRespDTO> {
    const resp = new SetupIntentRespDTO();
    try {
      const token = body.reCaptchaToken;
      const recaptchaResult = await this.recaptchaService.verifyRecaptcha(token, 'order_info');

      if (!recaptchaResult.success) {
        resp.status_code = 'ERR_RECAPTCHA';
        return resp;
      }

      const quoteInfo = await this.paymentInfoService.getQuote(body.accountNo, body.orderNo);
      resp.success = true; // Assuming success based on your code logic

      const stripeCustomer = await this.paymentInfoService.getOrCreateStripeCustomer(
        body.accountNo,
        quoteInfo.dto.account_name,
        quoteInfo.payerEmail,
      );

      const setupIntent = await this.paymentInfoService.createSetupIntent(stripeCustomer.id);
      resp.stripe_client_secret = setupIntent.client_secret;

      resp.order_update_jwt = await this.authService.generatePaymentInfoToken(
        body.accountNo,
        body.orderNo,
      );

      return resp;
    } catch (err) {
      resp.success = false;
      resp.status_code = 'ERR_OTHER';
      resp.default_message = 'An error occurred while creating the payment method. Please call 1-800-TOILETS for assistance.';

      if (err.message === 'QUOTE_NOT_FOUND') {
        this.logger.log(err);
        resp.status_code = 'ERR_QUOTE_NOT_FOUND';
        resp.default_message = 'Quote not found';
      } else if (err.message === 'UNSUPPORTED_BILLING_SYSTEM') {
        this.logger.log(err);
        resp.status_code = 'ERR_UNSUPPORTED_BILLING_SYSTEM';
        resp.default_message = 'Online payment method setup is not supported for this billing system. Please call 1-800-TOILETS for assistance.';
      } else if (err.message === 'INVALID_QUOTE_STATUS') {
        this.logger.log(err);
        resp.status_code = 'ERR_INVALID_QUOTE_STATUS';
        resp.default_message = 'The Order you have entered is not in a status where a payment method can be added. Please call 1-800-TOILETS for assistance.';
      } else {
        this.logger.error(err);
      }

      return resp;
    }
  }

  @Post('/update-payment-method')
  @UseGuards(PaymentMethodAuthGuard)
  async updatePaymentMethod(
    @Request() req: Request,
    @Body() body: UpdatePaymentMethodReqDTO,
  ): Promise<UpdatePaymentMethodRespDTO | HttpException> {
    const resp = new UpdatePaymentMethodRespDTO();

    try {
      await this.paymentInfoService.updatePaymentMethod(body.orderNo, body.paymentMethodId);
      resp.status_code = 'OK';
      resp.default_message = 'Payment method updated successfully';
      return resp;
    } catch (err) {
      this.logger.error('error in updatePaymentMethod', err);
      resp.status_code = 'ERR_OTHER';
      resp.default_message = 'An error occurred while updating the payment method. Please call 1-800-TOILETS for assistance.';
      return new HttpException(resp, 500);
    }
  }
}
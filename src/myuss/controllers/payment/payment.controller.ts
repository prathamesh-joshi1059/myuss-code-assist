import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Request,
  Param,
  UseFilters,
} from '@nestjs/common';
import { PaymentMethodsService } from '../../services/payment/payment-methods.service';
import { AuthGuard } from '@nestjs/passport';
import { LoggerService } from '../../../core/logger/logger.service';
import {
  ApiBadRequestResponse,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  StripeCreateCustomerReqDTO,
  StripeGetPaymentDetailsReqDTO,
  StripeGetPaymentMethodsReqDTO,
  StripeSetupIntentReqDTO,
} from './dto/payment-req.dto';
import { ApiRespDTO } from '../../../common/dto/api-resp.dto';
import { ThrottlerExceptionFilter } from '../../../core/utils/rate-limiting-exception/throttler-exception-filter';

@UseFilters(ThrottlerExceptionFilter)
@ApiTags('payments')
@UseGuards(AuthGuard('jwt'))
@Controller('api/stripe')
export class PaymentMethodsController {
  constructor(
    private readonly paymentMethodsService: PaymentMethodsService,
    private readonly logger: LoggerService,
  ) {}

  @ApiResponse({ status: 1000, description: 'Success', type: ApiRespDTO })
  @ApiBadRequestResponse({ status: 401 })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Post('customer')
  async createStripeCustomer(
    @Request() req,
    @Body() request: StripeCreateCustomerReqDTO,
  ): Promise<ApiRespDTO<any>> {
    this.logger.info('createStripeCustomer', req);
    const customerResponse = await this.paymentMethodsService.getStripeCustomer(
      request.accountNumber,
    );
    let customerResObj: ApiRespDTO<any>;

    this.logger.info(customerResponse);
    if (customerResponse.data.length > 0) {
      customerResObj = {
        success: true,
        status: 1000,
        message: 'Success',
        data: { stripeCustomerId: customerResponse.data[0].id, exist: true },
      };
      return customerResObj;
    } else {
      await this.timeout(5000);
      const response: ApiRespDTO<any> =
        await this.paymentMethodsService.createNewStripeCustomer(
          request.accountName,
          request.email,
          request.accountNumber,
        );
      customerResObj = {
        success: true,
        status: 1000,
        message: 'Customer created successfully',
        data: { stripeCustomerId: response.data.customerId, exist: true },
      };
      return customerResObj;
    }
  }

  private timeout(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  //Get payment Methods from stripe - api
  @ApiResponse({ status: 1000, description: 'Success', type: ApiRespDTO })
  @ApiResponse({
    status: 1009,
    description: 'Payment methods not found - If customer id is wrong',
    type: ApiRespDTO,
  })
  @ApiBadRequestResponse({
    status: 400,
    description: 'If provided query is not valid',
  })
  @Get()
  async getPaymentMethods(
    @Query() request: StripeGetPaymentMethodsReqDTO,
  ): Promise<ApiRespDTO<any>> {
    let paymentMethodsResObj: ApiRespDTO<any>;

    this.logger.info('stripeCustomerId: ' + request.stripe_customer_id);
    const paymentMethods = await this.paymentMethodsService.getPaymentMethods(
      request.stripe_customer_id,
    );
    if (paymentMethods.success) {
      paymentMethodsResObj = {
        success: true,
        status: 1000,
        message: 'Success',
        data: {
          paymentMethods: paymentMethods.data,
        },
      };
      return paymentMethodsResObj;
    } else {
      paymentMethodsResObj = {
        success: true,
        status: 1000,
        data: {
          paymentMethods: [],
        },
        message: 'Payment methods not found',
      };
      return paymentMethodsResObj;
    }
  }

  //Create Setup Intent - api
  @ApiResponse({ status: 1000, description: 'Success', type: ApiRespDTO })
  @ApiResponse({
    status: 1009,
    description: 'Customer not found - If customer id is not valid',
    type: ApiRespDTO,
  })
  @ApiBadRequestResponse({
    status: 400,
  })
  @Post('customer/setup-intent')
  async createSetupIntent(
    @Body() request: StripeSetupIntentReqDTO,
  ): Promise<ApiRespDTO<any>> {
    let createSetupIntentResObj: ApiRespDTO<any>;
    this.logger.info('createSetupIntent request', request);

    const setupIntentRes = await this.paymentMethodsService.createSetupIntent(
      request.customer_id,
    );
    this.logger.info('setupIntent', setupIntentRes);
    if (!setupIntentRes.success) {
      createSetupIntentResObj = {
        success: false,
        status: 1009,
        data: {},
        message: 'Customer not found',
      };
      return createSetupIntentResObj;
    }
    createSetupIntentResObj = {
      success: true,
      status: 1000,
      message: 'Success',
      data: { client_secret: setupIntentRes.data.client_secret },
    };

    return createSetupIntentResObj;
  }

  //Get Payment Details - api
  @ApiResponse({ status: 1000, description: 'Success', type: ApiRespDTO })
  @ApiResponse({
    status: 1009,
    description:
      'Error in fetch payment details - If payment method id is invalid',
    type: ApiRespDTO,
  })
  @ApiBadRequestResponse({ status: 400 })
  @Get('customer/payment-details/:id')
  async getPaymentDetails(
    @Param() params: StripeGetPaymentDetailsReqDTO,
  ): Promise<ApiRespDTO<any>> {
    return await this.paymentMethodsService.getPaymentDetails(params.id);
  }
}
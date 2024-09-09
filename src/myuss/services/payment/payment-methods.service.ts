import { Injectable } from '@nestjs/common';
import { StripeService } from '../../../backend/stripe/services/stripe/stripe.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { ApiRespDTO } from '../../../common/dto/api-resp.dto';
import { USS_CUSTOMERCARE_MESSAGE } from '../../../core/utils/constants';
import { GetPaymentMethodsResObj } from '../../../myuss/models/contract.model';
import { SFDC_ContractMapper } from '../../../myuss/mappers/salesforce/contract.mapper';

@Injectable()
export class PaymentMethodsService {
  constructor(
    private stripeService: StripeService,
    private logger: LoggerService,
  ) {}

  async getStripeCustomer(accountNumber: string): Promise<ApiRespDTO<any>> {
    const getCustomerResObj = new ApiRespDTO<any>();
    try {
      const getCustomer = await this.stripeService.getCustomerByUSSAccountId(accountNumber);
      return {
        ...getCustomerResObj,
        success: true,
        status: 1000,
        message: 'Success',
        data: getCustomer.data,
      };
    } catch (error) {
      this.logger.error('getStripeCustomer', error.message);
      return {
        ...getCustomerResObj,
        success: false,
        status: 1008,
        message: USS_CUSTOMERCARE_MESSAGE,
        data: {},
      };
    }
  }

  async createNewStripeCustomer(name: string, email: string, accountNumber: string): Promise<ApiRespDTO<object>> {
    const createCustomerResObj = new ApiRespDTO<object>();
    try {
      const newCustomer = {
        name,
        email,
        ussAccountId: accountNumber,
      };
      const customer = await this.stripeService.createCustomer(newCustomer);
      return {
        ...createCustomerResObj,
        success: true,
        status: 1000,
        message: 'Success',
        data: { customerId: customer.id, exist: true },
      };
    } catch (error) {
      this.logger.error('createStripeCustomer', error.message);
      return {
        ...createCustomerResObj,
        success: false,
        status: 1008,
        message: USS_CUSTOMERCARE_MESSAGE,
        data: {},
      };
    }
  }

  async getPaymentMethods(stripeCustomerId: string): Promise<ApiRespDTO<Object>> {
    const getPaymentMethodListObj = new ApiRespDTO<Object>();
    try {
      const paymentMethods = await this.stripeService.getPaymentMethods(stripeCustomerId);
      const paymentMethodList: GetPaymentMethodsResObj[] = paymentMethods.data.map((paymentMethod) => {
        const isExpired = paymentMethod.card
          ? !(paymentMethod.card.exp_year < new Date().getFullYear() || 
            (paymentMethod.card.exp_year === new Date().getFullYear() && paymentMethod.card.exp_month <= new Date().getMonth() + 1))
          : true;

        return paymentMethod.card
          ? {
              paymentMethodId: paymentMethod.id,
              type: paymentMethod.type,
              card: SFDC_ContractMapper.getCardDetails(paymentMethod, isExpired),
            }
          : {
              paymentMethodId: paymentMethod.id,
              type: paymentMethod.type,
              bank: SFDC_ContractMapper.getBankDetails(paymentMethod),
            };
      });
      
      return {
        ...getPaymentMethodListObj,
        success: true,
        status: 1000,
        message: 'Success',
        data: paymentMethodList,
      };
    } catch (error) {
      this.logger.error('getPaymentMethods', error.message);
      return {
        ...getPaymentMethodListObj,
        success: false,
        status: 1008,
        message: USS_CUSTOMERCARE_MESSAGE,
        data: [],
      };
    }
  }

  async getPaymentDetails(paymentMethodId: string): Promise<ApiRespDTO<any>> {
    const getPaymentDetailsObj = new ApiRespDTO<any>();
    try {
      const paymentMethodsDetail = await this.stripeService.getPaymentDetails(paymentMethodId);
      
      return {
        ...getPaymentDetailsObj,
        success: true,
        status: 1000,
        message: 'Success',
        data: paymentMethodsDetail.card
          ? { cardDetails: SFDC_ContractMapper.getCardDetails(paymentMethodsDetail, false) }
          : { bankDetails: SFDC_ContractMapper.getBankDetails(paymentMethodsDetail) },
      };
    } catch (error) {
      this.logger.error('getPaymentDetails', error.message);
      return {
        ...getPaymentDetailsObj,
        success: false,
        status: 1008,
        message: USS_CUSTOMERCARE_MESSAGE,
        data: {},
      };
    }
  }

  async createSetupIntent(customerId: string): Promise<ApiRespDTO<any>> {
    const setupIntentRes = new ApiRespDTO<any>();
    try {
      const setupIntent = await this.stripeService.createSetupIntent(customerId);
      this.logger.info(setupIntent);
      return {
        ...setupIntentRes,
        success: true,
        status: 1000,
        message: 'Success',
        data: setupIntent,
      };
    } catch (error) {
      this.logger.error('createSetupIntent', error.message);
      return {
        ...setupIntentRes,
        success: false,
        status: 1008,
        message: USS_CUSTOMERCARE_MESSAGE,
        data: {},
      };
    }
  }
}
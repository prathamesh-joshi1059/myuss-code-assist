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

  async getStripeCustomer(accountNumber: string) {
    let getCustomerResObj = new ApiRespDTO<any>();
    try{
      const getCustomer = await this.stripeService.getCustomerByUSSAccountId(
        accountNumber,
      );
        getCustomerResObj = {
          success: true,
          status: 1000,
          message: 'Success',
          data:getCustomer.data,
        };
        return getCustomerResObj;
      }catch(error){
        this.logger.error('getStripeCustomer', error.message);
        getCustomerResObj = {
          success: false,
          status: 1008,
          message:USS_CUSTOMERCARE_MESSAGE,
          data: {},
      };
      return getCustomerResObj;
    }
  }

  async createNewStripeCustomer(name: string, email: string, accountNumber: string) : Promise<ApiRespDTO<object>> {
    let createCustomerResObj = new ApiRespDTO<object>();
    try{
      const newCustomer = { 
        name: name, 
        email: email,
        ussAccountId: accountNumber
      }     
      const customer = await this.stripeService.createCustomer(newCustomer);
      createCustomerResObj = {
        success: true,
        status: 1000,
        message: 'Success',
        data: { customerId: customer.id, exist: true },
      }
       return createCustomerResObj;
    }
    catch(error){
      this.logger.error('createStripeCustomer', error.message);
      createCustomerResObj = {
        success: false,
        status: 1008,
        message: USS_CUSTOMERCARE_MESSAGE,
        data: {},
      };
      return createCustomerResObj;
    }     
  }
 
  async getPaymentMethods(stripeCustomerId: string): Promise<ApiRespDTO<Object>> {
    let getPaymentMethodListObj = new ApiRespDTO<Object>();
    try{
      const paymentMethods = await this.stripeService.getPaymentMethods(
        stripeCustomerId,
      );
      let paymentMethodList:GetPaymentMethodsResObj[] = paymentMethods.data.map((paymentMethod) => {
        let isExpired = true;
        if(paymentMethod.card){
          //check card is expired
          if(paymentMethod.card.exp_year > new Date().getFullYear() ){
            isExpired = false;
          }else{
            if(paymentMethod.card.exp_year === new Date().getFullYear() && paymentMethod.card.exp_month > (new Date().getMonth()+1) ){
              isExpired = false;
            }
          }
          let paymentMethodObj : GetPaymentMethodsResObj= {
            paymentMethodId: paymentMethod.id,
            type: paymentMethod.type,
            card : SFDC_ContractMapper.getCardDetails(paymentMethod,isExpired),
          };
          return paymentMethodObj;
        }else{
          let paymentMethodObj : GetPaymentMethodsResObj= {
            paymentMethodId: paymentMethod.id,
            type: paymentMethod.type,
            bank : SFDC_ContractMapper.getBankDetails(paymentMethod)
          }
          return paymentMethodObj;
        }
      });
      getPaymentMethodListObj = {
        success: true,
        status: 1000,
        message: 'Success',
        data: paymentMethodList,
      };
      return getPaymentMethodListObj;
    }catch(error){
      this.logger.error('getPaymentMethods', error.message);
      getPaymentMethodListObj = {
        success: false,
        status: 1008,
        message: USS_CUSTOMERCARE_MESSAGE,
        data: [],
      };
      return getPaymentMethodListObj;
    }
  }
  async getPaymentDetails( paymentMethodId: string): Promise<ApiRespDTO<any>> {
    let getPaymentDetailsObj = new ApiRespDTO<any>();
    try{
      const paymentMethodsDetail = await this.stripeService.getPaymentDetails(
        paymentMethodId
      );

      if (paymentMethodsDetail.card) {
        let card = SFDC_ContractMapper.getCardDetails(paymentMethodsDetail, false)
        getPaymentDetailsObj = {
          success: true,
          status: 1000,
          message: 'Success',
          data: {
            cardDetails: card,
          },
        };
        return getPaymentDetailsObj;
      } else {
        let bankDetail = SFDC_ContractMapper.getBankDetails(paymentMethodsDetail)
        getPaymentDetailsObj = {
          success: true,
          status: 1000,
          message: 'Success',
          data: {
            bankDetails: bankDetail,
          },
        };
        return getPaymentDetailsObj;
      }
    }catch(error){
      this.logger.error('getPaymentDetails', error.message);
      getPaymentDetailsObj = {
        success: false,
        status: 1008,
        message: USS_CUSTOMERCARE_MESSAGE,
        data: {},
      };
      return getPaymentDetailsObj;
    }
  }
  async createSetupIntent(customerId: string): Promise<ApiRespDTO<any>> {
    let setupIntentRes = new ApiRespDTO<any>();
    try{
      const setupIntent = await this.stripeService.createSetupIntent(customerId);
      this.logger.info(setupIntent);
      setupIntentRes = {
        success: true,
        status: 1000,
        message: 'Success',
        data: setupIntent,
      };
      return setupIntentRes;
    }catch(error){
      this.logger.error('createSetupIntent', error.message);
      setupIntentRes = {
        success: false,
        status: 1008,
        message: USS_CUSTOMERCARE_MESSAGE,
        data: {},
      };
      return setupIntentRes;
    }
  }
}

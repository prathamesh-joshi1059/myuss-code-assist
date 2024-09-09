import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../../core/logger/logger.service';
import { SfdcQuoteService } from '../../../backend/sfdc/services/sfdc-quote/sfdc-quote.service';
import { SFDC_QuoteMapper } from '../../mappers/salesforce/quote.mapper';
import { SetupIntentRespDTO } from '../../controllers/payment-info/dto/setup-intent-resp.dto';
import { StripeService } from '../../../backend/stripe/services/stripe/stripe.service';

@Injectable()
export class PaymentInfoService {
  constructor(
    private logger: LoggerService,
    private sfdcQuoteService: SfdcQuoteService,
    private stripeService: StripeService
  ) {}

  async updatePaymentMethod(orderNo: string, paymentMethodId: string) {
    // trim non-numerical characters from orderNo
    orderNo = orderNo.replace(/\D/g, '');
    if (!orderNo) {
      throw new Error('QUOTE_NOT_FOUND');
    }
    // get quote from SFDC
    const quote = await this.sfdcQuoteService.getQuoteByOrderNo(orderNo);
    // update quote with payment method id
    const resp = await this.sfdcQuoteService.updatePaymentMethod(quote.Id, paymentMethodId);
    return resp;
  }

  async getQuote(accountNo: string, orderNo: string): Promise<{ dto: SetupIntentRespDTO; payerEmail: string }> {
    // trim non-numerical characters from orderNo
    orderNo = orderNo.replace(/\D/g, '');
    if (!orderNo) {
      throw new Error('QUOTE_NOT_FOUND');
    }
    const quote = await this.sfdcQuoteService.getQuoteByAccountAndOrderNo(accountNo, orderNo);
    // check if quote is null and transform to payment info DTO
    if (!quote) {
      throw new Error('QUOTE_NOT_FOUND');
    }

    // check the status of the quote
    if (
      quote.SBQQ__Status__c !== 'Approved' ||
      !quote.Site_Complete__c ||
      !quote.Billing_Complete__c ||
      !quote.Credit_Card_Payment_Status__c ||
      !['Awaiting Payment Method', 'Payment method not received'].includes(quote.Credit_Card_Payment_Status__c)
    ) {
      // include relevant data points in the warning message
      this.logger.warn(
        `INVALID_QUOTE_STATUS: OrderNo: ${orderNo}, SBQQ__Status__c: ${quote.SBQQ__Status__c}, Site_Complete__c: ${quote.Site_Complete__c}, Billing_Complete__c: ${quote.Billing_Complete__c}, Credit_Card_Payment_Status__c: ${quote.Credit_Card_Payment_Status__c}`
      );
      throw new Error('INVALID_QUOTE_STATUS');
    }

    const setupIntentDTO = SFDC_QuoteMapper.mapSFDCQuoteToSetupIntentRespDTO(quote);
    return {
      dto: setupIntentDTO,
      payerEmail: quote.SBQQ__Account__r.PP_Email__c,
    };
  }

  async createSetupIntent(stripeCustomerId: string) {
    const paymentIntent = await this.stripeService.createSetupIntent(stripeCustomerId);
    return paymentIntent;
  }

  async getOrCreateStripeCustomer(ussAccountId: string, name: string, email: string) {
    const customers = await this.stripeService.getCustomerByUSSAccountId(ussAccountId);
    // if customer is found return it
    if (customers?.data?.length > 0) {
      return customers.data[0];
    }
    // if not found create it
    const customer = await this.stripeService.createCustomer({
      name,
      email,
      ussAccountId,
    });
    return customer;
  }
}
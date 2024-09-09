import { SBQQ__Quote__c } from '../../../backend/sfdc/model/SBQQ__Quote__c';
import { SetupIntentRespDTO } from '../../controllers/payment-info/dto/setup-intent-resp.dto';

export class SFDC_QuoteMapper {
  public static mapSFDCQuoteToSetupIntentRespDTO(
    sfdcQuote: SBQQ__Quote__c,
  ): SetupIntentRespDTO {
    const resp = new SetupIntentRespDTO();
    resp.success = true;
    resp.status_code = 'OK';
    resp.address = sfdcQuote.Shipping_Address__r.USF_Street__c;
    resp.start_date = sfdcQuote.SBQQ__StartDate__c;
    resp.account_name = sfdcQuote.SBQQ__Account__r?.Name;
    const invoiceAmounts = this.calcInvoiceAmounts(sfdcQuote);
    resp.first_invoice_amount = invoiceAmounts.firstInvoiceAmount;
    resp.recurring_invoice_amount = invoiceAmounts.recurringInvoiceAmount;
    return resp;
  }

  static calcInvoiceAmounts(quote: SBQQ__Quote__c): {
    firstInvoiceAmount: number;
    recurringInvoiceAmount: number;
  } {
    const recurringLines = quote.SBQQ__LineItems__r.filter((line) => {
      return line.SBQQ__ChargeType__c === 'Recurring';
    });
    const recurringInvoiceAmount = recurringLines.reduce(
      (acc, line) =>
        acc +
        line.USS_Net__c +
        line.EEC_Charge__c +
        line.ESF_Charge__c +
        line.Houston_Franchise_Fees__c +
        line.Fuel_Surcharge_Amount__c +
        line.Total_Sales_Tax_Amount__c,
      0,
    );

    const firstInvoiceAmount = quote.SBQQ__LineItems__r.reduce(
      (acc, line) =>
        acc +
        line.USS_Net__c +
        line.EEC_Charge__c +
        line.ESF_Charge__c +
        line.Houston_Franchise_Fees__c +
        line.Fuel_Surcharge_Amount__c +
        line.Total_Sales_Tax_Amount__c,
      0,
    );

    return {
      firstInvoiceAmount,
      recurringInvoiceAmount,
    };
  }
}

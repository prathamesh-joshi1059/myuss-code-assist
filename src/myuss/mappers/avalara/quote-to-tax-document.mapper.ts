import { CPQ_QuoteModel } from '../../../backend/sfdc/model/cpq/QuoteModel';
import { TaxCalculationResponse } from '../../../backend/avalara/model/tax-calculation-response.mode';
import { TaxCalculationRequest } from '../../../backend/avalara/model/uss-tax-calculation-request.model';
import { SBQQ__QuoteLine__c } from '../../../backend/sfdc/model/SBQQ__QuoteLine__c';
import { SBQQ__Quote__c } from '../../../backend/sfdc/model/SBQQ__Quote__c';

export class AvalaraSalesforceMapper {
  static mapQuoteToAddressDocument(quote: SBQQ__Quote__c): TaxCalculationRequest {
    let request = new TaxCalculationRequest();
    request.code = quote.Name;
    request.referenceCode = quote.Id;
    request.date = new Date().toISOString().substring(0, 10);
    request.companyCode = quote.Legal_entity_code__c;
    request.isSellerImporterOfRecord = quote.AVA_SFCPQ__Is_Seller_Importer_Of_Record__c;
    request.customerUsageType = quote.AVA_SFCPQ__Entity_Use_Code__r.Name;
    request.businessIdentificationNo = quote.SBQQ__Account__r.AVA_MAPPER__Business_Identification_Number__c;
    request.exemptionNo = quote.SBQQ__Account__r.AVA_MAPPER__Exemption_Number__c;
    request.customerCode = quote.SBQQ__Account__r.USF_Account_Number__c;
    request.addresses = {
      shipFrom: {
        locationCode: null,
        line1: quote.Ship_From_Street__c,
        city: quote.Ship_From_City__c,
        region: quote.Ship_From_State__c,
        postalCode: quote.Ship_From_Zipcode__c,
        country: 'US',
      },
    };
    request.lines = quote.SBQQ__LineItems__r.map((line, index) => {
      return {
        lineNumber: line.Id,
        ref1: line.Id,
        quantity: line.SBQQ__Quantity__c,
        itemCode: line.SBQQ__ProductCode__c,
        amount: line.USS_Net__c,
        taxCode: line.SBQQ__TaxCode__c,
        addresses: {
          shipTo: {
            locationCode: null,
            line1: line.USF_Address__r.USF_Street__c,
            city: line.USF_Address__r.USF_City__c,
            region: line.USF_Address__r.USF_State__c,
            postalCode: line.USF_Address__r.USF_Zip_Code__c,
            country: 'US',
          },
          shipFrom: {
            locationCode: line.AVA_SFCPQ__Location_Code__c,
            line1: line.Ship_From_Street__c,
            city: line.Ship_From_City__c,
            region: line.Ship_From_State__c,
            postalCode: line.Ship_From_Zipcode__c,
            country: 'US',
          },
        },
      };
    });

    return request;
  }

  public static mapAvalaraResponseToQuote(response: TaxCalculationResponse): SBQQ__Quote__c {
    let quote = new SBQQ__Quote__c();
    quote.Id = response.referenceCode;
    quote.AVA_SFCPQ__SalesTaxAmount__c = response.totalTax;
    quote.AVA_SFCPQ__AvaTaxMessage__c = 'Tax Amount Is Up To Date';
    quote.SBQQ__LineItems__r = response.lines.map((line) => {
      let quoteLine = new SBQQ__QuoteLine__c();
      quoteLine.Id = line.ref1;
      quoteLine.AVA_SFCPQ__TaxAmount__c = line.tax;
      return quoteLine;
    });
    return quote;
  }

  // CPQ Model mappers
  static mapCPQQuoteModelToTaxCalculationRequest(
    quoteModel: CPQ_QuoteModel,
    quote: SBQQ__Quote__c,
  ): TaxCalculationRequest {
    let request = new TaxCalculationRequest();
    request.code = quote.Name;
    request.referenceCode = quote.Id;
    request.date = new Date().toISOString().substring(0, 10);
    request.companyCode = quote.Legal_entity_code__c;
    request.isSellerImporterOfRecord = quote.AVA_SFCPQ__Is_Seller_Importer_Of_Record__c;
    request.customerUsageType = quote.AVA_SFCPQ__Entity_Use_Code__r.Name;
    request.businessIdentificationNo = quote.SBQQ__Account__r.AVA_MAPPER__Business_Identification_Number__c;
    request.exemptionNo = quote.SBQQ__Account__r.AVA_MAPPER__Exemption_Number__c;
    request.customerCode = quote.SBQQ__Account__r.USF_Account_Number__c;
    request.addresses = {
      shipFrom: {
        locationCode: null,
        line1: quote.Ship_From_Street__c,
        city: quote.Ship_From_City__c,
        region: quote.Ship_From_State__c,
        postalCode: quote.Ship_From_Zipcode__c,
        country: 'US',
      },
    };
    request.lines = quote.SBQQ__LineItems__r.map((line, index) => {
      // since we're calculating amount on the fly we need to get the amount from the quote model
      const modelLine = quoteModel.lineItems.find((lineModel) => lineModel.record.Id === line.Id);
      return {
        lineNumber: line.Id,
        ref1: line.Id,
        quantity: line.SBQQ__Quantity__c,
        itemCode: line.SBQQ__ProductCode__c,
        amount: modelLine.record.USS_Net__c,
        taxCode: line.SBQQ__TaxCode__c,
        addresses: {
          shipTo: {
            locationCode: null,
            line1: line.USF_Address__r.USF_Street__c,
            city: line.USF_Address__r.USF_City__c,
            region: line.USF_Address__r.USF_State__c,
            postalCode: line.USF_Address__r.USF_Zip_Code__c,
            country: 'US',
          },
          shipFrom: {
            locationCode: line.AVA_SFCPQ__Location_Code__c,
            line1: line.Ship_From_Street__c,
            city: line.Ship_From_City__c,
            region: line.Ship_From_State__c,
            postalCode: line.Ship_From_Zipcode__c,
            country: 'US',
          },
        },
      };
    });
    return request;
  }

  public static mapAvalaraResponseToCPQQuoteModel(
    response: TaxCalculationResponse,
    quoteModel: CPQ_QuoteModel,
  ): CPQ_QuoteModel {
    quoteModel.record.AVA_SFCPQ__SalesTaxAmount__c = response.totalTax;
    quoteModel.record.AVA_SFCPQ__AvaTaxMessage__c = 'Tax Amount Is Up To Date';
    response.lines.forEach((line) => {
      // find the corresponding line in the quote model
      const idx = quoteModel.lineItems.findIndex((lineModel) => lineModel.record.Id === line.ref1);
      quoteModel.lineItems[idx].record.AVA_SFCPQ__TaxAmount__c = line.tax;
      quoteModel.lineItems[idx].record.SBQQ__Taxable__c = line.taxable;
    });
    return quoteModel;
  }
}

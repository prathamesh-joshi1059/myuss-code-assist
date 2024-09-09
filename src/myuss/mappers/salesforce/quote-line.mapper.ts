import { SBQQ__Quote__c } from '../../../backend/sfdc/model/SBQQ__Quote__c';

import { QuoteLineModel } from '../../../myuss/models';
import { SFDC_AccountMapper } from './account.mapper';
import { SFDC_ContactMapper } from './contact.mapper';
import { SBQQ__QuoteLine__c } from '../../../backend/sfdc/model/SBQQ__QuoteLine__c';
import { SFDC_ProductMapper } from './product.mapper';
import { GeneralUtils } from '../../../core/utils/general.utils';

export class SFDC_QuoteLineMapper {
  public static getMyUSSQuoteLineModeFromCPQ(sfQuoteLines: SBQQ__QuoteLine__c[]): QuoteLineModel[] {
    let quoteLines: QuoteLineModel[] = [];

    sfQuoteLines.forEach((sfQuoteLine) => {
      const quoteLine = new QuoteLineModel();
      quoteLine.quoteLineId = sfQuoteLine.Id;
      quoteLine.quoteId = sfQuoteLine.SBQQ__Quote__c;
      quoteLine.lineNumber = sfQuoteLine.SBQQ__Number__c;
      quoteLine.name = sfQuoteLine.Name;
      quoteLine.requiredBy = sfQuoteLine.SBQQ__RequiredBy__c;
      quoteLine.product = SFDC_ProductMapper.getMyUSSProductFromSFDCProduct(sfQuoteLine.SBQQ__Product__r);

      quoteLine.quantity = sfQuoteLine.SBQQ__Quantity__c;
      //quoteLine.=sfQuoteLine.IS2PContractedPrice__c
      //quoteLine.=sfQuoteLine.SBQQ__SpecialPriceType__c
      quoteLine.listPrice = sfQuoteLine.SBQQ__ListPrice__c;
      quoteLine.floorPrice = sfQuoteLine.Floor_Price__c;
      quoteLine.unitCost = sfQuoteLine.SBQQ__UnitCost__c;
      quoteLine.netPrice = sfQuoteLine.SBQQ__NetPrice__c;
      quoteLine.customerPrice = sfQuoteLine.SBQQ__CustomerPrice__c;
      //quoteLine.=sfQuoteLine.Price_Override__c

      quoteLine.salesTaxAmount = sfQuoteLine.Total_Sales_Tax_Amount__c;

      quoteLine.productType = sfQuoteLine.Product_Type__c;
      quoteLine.requiredBy = sfQuoteLine.SBQQ__RequiredBy__c;
      quoteLine.ussNetAmount = sfQuoteLine.USS_Net__c;
      quoteLine.chargeType = sfQuoteLine.SBQQ__ChargeType__c;

      quoteLine.startDate = sfQuoteLine.SBQQ__StartDate__c;
      quoteLine.endDate = sfQuoteLine.SBQQ__EndDate__c;
      quoteLine.priceBookId = sfQuoteLine.SBQQ__PricebookEntryId__c;
      //quoteLine.subscriptionTerm=sfQuoteLine.SBQQ__SubscriptionTerm__c
      quoteLine.productSubscriptionType = sfQuoteLine.SBQQ__ProductSubscriptionType__c;
      //quoteLine.=sfQuoteLine.SBQQ__ProrateMultiplier__c
      //quoteLine.subscriptionPricing=sfQuoteLine.SBQQ__SubscriptionPricing__c
      quoteLine.subscriptionType = sfQuoteLine.SBQQ__SubscriptionType__c;
      //quoteLine.defaultSubscriptionTermonTerm=sfQuoteLine.SBQQ__DefaultSubscriptionTerm__c;
      quoteLine.productCode = sfQuoteLine.SBQQ__ProductCode__c;
      quoteLine.aVASFCPQLocationCode = sfQuoteLine.AVA_SFCPQ__Location_Code__c;
      //quoteLine.address=sfQuoteLine.USF_Address__r
      quoteLine.taxable = sfQuoteLine.SBQQ__Taxable__c;
      quoteLine.taxCode = sfQuoteLine.SBQQ__TaxCode__c;
      //quoteLine.taxPercentage=sfQuoteLine.Tax__c;
      //quoteLine.shipAddress=sfQuoteLine.Ship_From_Street__c;
      //quoteLine.=sfQuoteLine.Ship_From_City__c;
      //quoteLine.=sfQuoteLine.Ship_From_State__c;
      //quoteLine.=sfQuoteLine.Ship_From_Zipcode__c;
      quoteLine.tax = sfQuoteLine.AVA_SFCPQ__TaxAmount__c;
      //quoteLine.=sfQuoteLine.SBQQ__LineItems__r: SBQQ__QuoteLine__c[];
      //quoteLine.jobsites=sfQuoteLine.Quoted_Jobsites__r
      quoteLine.bunddled = sfQuoteLine.SBQQ__Bundle__c;

      quoteLine.quantityUnitOfMeasure = sfQuoteLine.QuantityUnitOfMeasure__c;
      quoteLine.requiresParentAsset = sfQuoteLine.Requires_Parent_Asset__c;
      quoteLine.sortOrder = sfQuoteLine.Sort_Order__c;
      //quoteLine.=sfQuoteLine.USF_Address__c
      quoteLine.customerOwned = sfQuoteLine.CustomerOwned__c;
      //quoteLine.=sfQuoteLine.AdditionalOptions__c
      quoteLine.assetSummary = sfQuoteLine.Asset_Summary__c;
      quoteLine.productOptionId = sfQuoteLine.SBQQ__ProductOption__c;

      quoteLine.targetPrice = sfQuoteLine.Target_Price__c;
      quoteLine.productNetAmount = sfQuoteLine.Product_Net_Amount__c;
      //quoteLine.serviceFrequency=sfQuoteLine.Service_Frequency__c
      quoteLine.serviceEndDate = sfQuoteLine.NF_Service_End_Date__c;
      quoteLine.effectiveEndDate = sfQuoteLine.SBQQ__EffectiveEndDate__c;
      quoteLine.serviceStartDate = sfQuoteLine.NF_Service_Start_Date__c;
      quoteLine.effectiveStartDate = sfQuoteLine.SBQQ__EffectiveStartDate__c;
      quoteLine.ESFPrice = sfQuoteLine.ESFPrice__c;

      quoteLine.applyHoustonFranchiseFee = sfQuoteLine.Apply_Houston_Franchise_Fee__c;
      quoteLine.houstonFranchiseFeePerUnit = sfQuoteLine.Houston_Franchise_Fee_Per_Unit__c;
      quoteLine.houstonFranchiseFeesPercent = sfQuoteLine.Houston_Franchise_Fees_Percent__c;
      quoteLine.houstonFranchiseAmount = GeneralUtils.roundToTwoDecimals(sfQuoteLine.Houston_Franchise_Fees__c || 0);

      quoteLine.applyFuelSurcharge = sfQuoteLine.Apply_Fuel_Surcharge__c;
      quoteLine.fuelSurchargePercent = sfQuoteLine.Fuel_Surcharge_Percent__c;
      quoteLine.fuelSurchargeAmount = GeneralUtils.roundToTwoDecimals(sfQuoteLine.Fuel_Surcharge_Amount__c || 0);

      quoteLine.fuelSurchargePerUnit = sfQuoteLine.Fuel_Surcharge_Per_Unit__c;

      quoteLine.EECPercent = sfQuoteLine.EEC_Percent__c;

      quoteLine.EECAmount = GeneralUtils.roundToTwoDecimals(sfQuoteLine.EEC_Charge__c || 0);

      quoteLine.ESFPercent = sfQuoteLine.ESF_Percent__c;

      quoteLine.ESFAmount = GeneralUtils.roundToTwoDecimals(sfQuoteLine.ESF_Charge__c || 0);

      quoteLines.push(quoteLine);
    });
    return quoteLines;
  }
}

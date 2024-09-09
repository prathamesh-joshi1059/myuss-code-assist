import { GeneralUtils } from '../../../../core/utils/general.utils';
import { SBQQ__QuoteLine__c } from '../SBQQ__QuoteLine__c';
import { SBQQ__Quote__c } from '../SBQQ__Quote__c';

// https://developer.salesforce.com/docs/atlas.en-us.cpq_dev_api.meta/cpq_dev_api/cpq_api_quote_model_9.htm
export class CPQ_QuoteModel {
  public record: SBQQ__Quote__c; // The record that this model represents.
  public lineItems: CPQ_QuoteLineModel[]; //The lines that this quote contains.
  public lineItemGroups: CPQ_QuoteLineGroupModel[]; //	The groups that this quote contains.
  public nextKey: number; // Integer - The next key to use for new groups or lines. To keep keys unique, do not lower this value.
  public applyAdditionalDiscountLast: boolean; //	Corresponds to the field SBQQ__Quote__c.ApplyAdditionalDiscountLast__c.
  public applyPartnerDiscountFirst: boolean; //	Corresponds to the field SBQQ__Quote__c.ApplyPartnerDiscountFirst__c.
  public channelDiscountsOffList: boolean; //	Corresponds to the field SBQQ__Quote__c.ChannelDiscountsOffList__c.
  public customerTotal: number; //	Decimal	SBQQ__Quote__c.SBQQ__CustomerAmount__c is a roll-up summary field, so its accuracy is guaranteed only after a quote has been saved. In the meantime, its current value is stored in customerTotal.
  public netTotal: number; //	Decimal	SBQQ__Quote__c.SBQQ__NetAmount__c is a roll-up summary field, so its accuracy is guaranteed only after a quote has been saved. In the meantime, its current value is stored in netTotal.
  public netNonSegmentTotal: number; //	Decimal	The net total for all non-multidimensional quote lines.
  public calculationRequired: any;
  public calculatePending: boolean;
  public backgroundCalculatePending: boolean; 

  public setFormulaFieldValues(): void {
    for (let i = 0; i < this.lineItems.length; i++) {
      const line = Object.assign(new SBQQ__QuoteLine__c(), this.lineItems[i].record);

      this.lineItems[i].record = line;

      const eecPercentage = line.EEC_Percent__c || 0;
      const esfPercentage = line.ESF_Percent__c || 0;
      const fuelSurchargePercentage = line.Fuel_Surcharge_Percent__c || 0;
      const houstonPercentage = line.Houston_Franchise_Fees_Percent__c || 0;
      const ussNetAmount = line.USS_Net__c || 0;

      if (line.Apply_Houston_Franchise_Fee__c == true) {
        this.lineItems[i].record.Houston_Franchise_Fees__c = this.calculatePercentageAmount(
          ussNetAmount,
          houstonPercentage,
        );
      }
      if (line.EEC_Percent__c != 0) {
        this.lineItems[i].record.EEC_Charge__c = this.calculatePercentageAmount(ussNetAmount, eecPercentage);
      }
      if (line.ESF_Percent__c != 0) {
        this.lineItems[i].record.ESF_Charge__c = this.calculatePercentageAmount(ussNetAmount, esfPercentage);
      }

      if (line.Fuel_Surcharge_Amount__c == null || line.Fuel_Surcharge_Amount__c == 0) {
        /*
Fuel_Surcharge_Amount__c===ROUND(Fuel_Surcharge_Per_Unit__c,2)*SBQQ__Quantity__c 

Fuel_Surcharge_Per_Unit__c====Price_Override__c * Fuel_Surcharge_Percent__c /100

        */
        let fuelSurchargePerUnit = GeneralUtils.round(
          (this.lineItems[i].record.Price_Override__c * fuelSurchargePercentage) / 100,
          2,
        );

        this.lineItems[i].record.Fuel_Surcharge_Amount__c =
          fuelSurchargePerUnit * this.lineItems[i].record.SBQQ__Quantity__c;
      }
      line.setFormulaFieldValues();
    }
  }

  public calculatePercentageAmount(amountToConvert: number, percentage: number): number {
    return GeneralUtils.round((amountToConvert * percentage) / 100, 2);
  }
  public setQuoteRollupFields(): void {
    // roll up the values from the quote lines
    let oneTimeSubtotal = 0;
    let oneTimeTax = 0;
    let recurringSubtotal = 0;
    let recurringTax = 0;
    this.lineItems.forEach((line) => {
      if (line.record.SBQQ__ChargeType__c === 'One-Time') {
        oneTimeSubtotal += line.record.Total_USS_Net__c;
        oneTimeTax += line.record.Total_Sales_Tax_Amount__c;
      }
      if (line.record.SBQQ__ChargeType__c === 'Recurring') {
        recurringSubtotal += line.record.Total_USS_Net__c;
        recurringTax += line.record.Total_Sales_Tax_Amount__c;
      }
    });
    // set the quote rollup fields
    this.record.One_Time_Subtotal__c = oneTimeSubtotal;
    this.record.One_Time_Tax__c = oneTimeTax;
    // set the one time total One_Time_Total__c = One_Time_Subtotal__c + One_Time_Tax__c
    this.record.One_Time_Total__c = oneTimeSubtotal + oneTimeTax;

    this.record.Recurring_Subtotal__c = recurringSubtotal;
    this.record.Recurring_Tax__c = recurringTax;
    this.record.Recurring_Total__c = recurringSubtotal + recurringTax;
  }
}

// https://developer.salesforce.com/docs/atlas.en-us.cpq_dev_api.meta/cpq_dev_api/cpq_api_quoteline_model_1.htm
export class CPQ_QuoteLineModel {
  record: SBQQ__QuoteLine__c; //	The record that this model represents.
  amountDiscountProrated: boolean; //	Corresponds to SBQQ__QuoteLine__c.ProrateAmountDiscount__c.
  parentGroupKey: number; //Integer	The unique key of this line’s group, if this line is part of a grouped quote.
  parentItemKey: number; //	Integer	The unique key of this line’s parent, if this line is part of a bundle.
  key: number; //	Integer	Each quote line and group has a key that is unique amongst all other keys in the same quote.
  upliftable: boolean; //	Boolean	True if this line is an MDQ segment that can be uplifted from a previous segment.
  configurationType: string; //Indicates the configuration type of the product that this line represents.
  configurationEvent: string; // Indicates the configuration event of the product that this line represents.
  reconfigurationDisabled: boolean; // If true, this line cannot be reconfigured.
  descriptionLocked: boolean; // If true, this line’s description cannot be changed.
  productQuantityEditable: boolean; // Boolean	If true, this line’s quantity is editable.
  productQuantityScale: number; // Decimal	The number of decimal places used for rounding this line’s quantity.
  dimensionType: string; // The type of MDQ dimension that this line represents.
  productHasDimensions: boolean; //	If true, the underlying product can be represented as a multidimensional line.
  targetCustomerAmount: number; // Decimal	The unit price forwhich this quote line is discounted.
  targetCustomerTotal: number; //	Decimal	The customer amount for which this quote line is discounted.
}

// Not used at USS, inclded for completeness
export class CPQ_QuoteLineGroupModel {}

import { GeneralUtils } from '../../../core/utils/general.utils';
import { NF_Quoted_Jobsite__c } from './NF_Quoted_Jobsite__c';
import { SBQQ__ProductOption__c } from './Product2';
import { SBQQ__Product__c } from './SBQQ__Product__c';
import { Attributes, SFDC_Object } from './SFDC_Base';
import { USF_Address__c } from './USF_Address__c';

export class SBQQ__QuoteLine__c extends SFDC_Object {
  Id: string;
  SBQQ__Quote__c?: string;
  SBQQ__Number__c?: number;
  Name: string;
  SBQQ__RequiredBy__c: string;
  SBQQ__Product__c: string;
  Product_Name__c: string;
  SBQQ__Product__r: SBQQ__Product__c;
  SBQQ__Quantity__c: number;
  IS2PContractedPrice__c: boolean;
  SBQQ__SpecialPriceType__c: string;
  SBQQ__ListPrice__c: number;
  Floor_Price__c?: number;
  SBQQ__UnitCost__c?: number;
  SBQQ__NetPrice__c: number;
  SBQQ__CustomerPrice__c: number;
  Price_Override__c: number;
  Fuel_Surcharge_Amount__c: number;
  Fuel_Surcharge_Per_Unit__c: number;
  Total_Sales_Tax_Amount__c: number; // formula field: setTotalTaxAmount
  Total_USS_Net__c: number; // formula field: setTotalUSSNet

  Product_Type__c: string;
  SBQQ__RequiredBy__r: SBQQ__QuoteLine__c;
  USS_Net__c: any;
  SBQQ__ChargeType__c: string;
  EEC_Charge__c: number;
  ESF_Charge__c: number;

  SBQQ__StartDate__c?: string;
  SBQQ__EndDate__c?: string;
  SBQQ__PricebookEntryId__c?: string;
  SBQQ__SubscriptionTerm__c?: number;
  SBQQ__ProductSubscriptionType__c?: string;
  SBQQ__ProrateMultiplier__c?: number;
  SBQQ__SubscriptionPricing__c?: string;
  SBQQ__SubscriptionType__c?: string;
  SBQQ__DefaultSubscriptionTerm__c?: number;
  SBQQ__ProductCode__c?: string;
  AVA_SFCPQ__Location_Code__c?: string;
  USF_Address__r?: USF_Address__c;
  SBQQ__TaxCode__c?: string;
  Ship_From_Street__c?: string;
  Ship_From_City__c?: string;
  Ship_From_State__c?: string;
  Ship_From_Zipcode__c?: string;
  AVA_SFCPQ__TaxAmount__c: number;
  SBQQ__LineItems__r: SBQQ__QuoteLine__c[];
  Quoted_Jobsites__r: NF_Quoted_Jobsite__c[];
  SBQQ__Bundle__c: boolean;
  Prod_Subscription_Type__c: string;
  QuantityUnitOfMeasure__c: string;
  Requires_Parent_Asset__c: boolean;
  Sort_Order__c: string;
  USF_Address__c: string;
  CustomerOwned__c: boolean;
  AdditionalOptions__c: string;
  Asset_Summary__c: string;
  SBQQ__ProductOption__c: string;
  SBQQ__ProductOption__r: SBQQ__ProductOption__c;
  Target_Price__c: number;
  AdHoc__c: boolean;
  Product_Net_Amount__c: number;
  Service_Frequency__c: boolean;
  NF_Service_End_Date__c: any;
  SBQQ__EffectiveEndDate__c: any;
  NF_Service_Start_Date__c: any;
  SBQQ__EffectiveStartDate__c: any;
  ESFPrice__c: number;
  Fuel_Surcharge_Percent__c: number;
  ESF_Percent__c: number;
  EEC_Percent__c: number;
  SBQQ__BundledQuantity__c: number;
  SBQQ__DynamicOptionId__c: string;
  SBQQ__OptionLevel__c: number;
  SBQQ__OptionType__c: string;
  Apply_Fuel_Surcharge__c?: boolean;

  Apply_Houston_Franchise_Fee__c?: boolean;
  Houston_Franchise_Fee_Per_Unit__c: number;
  Houston_Franchise_Fees__c: number;
  Houston_Franchise_Fees_Percent__c?: number;
  SBQQ__Taxable__c?: boolean;

  public setTypeAttribute(): void {
    super._setTypeAttribute('SBQQ__QuoteLine__c');
  }

  public setFormulaFieldValues(): void {
    this.setTotalTaxAmount();
    this.setTotalUSSNet();
  }

  /* Formula for Total_Sales_Tax_Amount__c
   *  AVA_SFCPQ__TaxAmount__c +
   *  ( (AVA_SFCPQ__TaxAmount__c / USS_Net__c ) * EEC_Charge__c) +
   *  ( (AVA_SFCPQ__TaxAmount__c / USS_Net__c ) * ESF_Charge__c) +
   *  ( (AVA_SFCPQ__TaxAmount__c / USS_Net__c ) * Fuel_Surcharge_Amount__c )
   */
  public setTotalTaxAmount(): void {
    let totalTaxAmount = this.AVA_SFCPQ__TaxAmount__c;
    const eecAmount = this.EEC_Charge__c || 0;
    const esfAmount = this.ESF_Charge__c || 0;
    const fuelSurchargeAmount = this.Fuel_Surcharge_Amount__c || 0;
    const houstonAmount = this.Houston_Franchise_Fees__c || 0;
    if (this.USS_Net__c && this.USS_Net__c != 0) {
      const taxRate = this.AVA_SFCPQ__TaxAmount__c / this.USS_Net__c;
      console.log('taxRate', taxRate);
      totalTaxAmount += taxRate * eecAmount;
      totalTaxAmount += taxRate * esfAmount;
      totalTaxAmount += taxRate * fuelSurchargeAmount;
      // totalTaxAmount += taxRate * houstonAmount;
    }
    // set the total tax amount
    this.Total_Sales_Tax_Amount__c = GeneralUtils.roundToTwoDecimals(totalTaxAmount || 0);
    console.log('Total_Sales_Tax_Amount__c', this.Total_Sales_Tax_Amount__c);
  }

  /* Formula for Total_USS_Net__c
   *  ROUND(USS_Net__c, 2) +
   *  ROUND(EEC_Charge__c, 2) +
   *  ROUND(ESF_Charge__c, 2)+
   *  ROUND(Houston_Franchise_Fees__c, 2) +
   *  ROUND(Fuel_Surcharge_Amount__c, 2)
   */
  public setTotalUSSNet(): void {
    let totalUSSNet = GeneralUtils.roundToTwoDecimals(this.USS_Net__c || 0);
    totalUSSNet += GeneralUtils.roundToTwoDecimals(this.EEC_Charge__c || 0);
    totalUSSNet += GeneralUtils.roundToTwoDecimals(this.ESF_Charge__c || 0);
    totalUSSNet += GeneralUtils.roundToTwoDecimals(this.Houston_Franchise_Fees__c || 0);
    totalUSSNet += GeneralUtils.roundToTwoDecimals(this.Fuel_Surcharge_Amount__c || 0);
    // set the total USS net
    this.Total_USS_Net__c = totalUSSNet;
  }
}

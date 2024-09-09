import { SBQQ__QuoteLine__c } from './SBQQ__QuoteLine__c';
import { SBQQ__Quote__c } from './SBQQ__Quote__c';
import { SFDC_Object } from './SFDC_Base';
import { USF_Address__c } from './USF_Address__c';

export class NF_Quoted_Jobsite__c extends SFDC_Object {
  Id: string;
  Name: string;
  NF_Quote__c: string;
  NF_End_Date__c: Date | string;
  NF_Start_Date__c: Date | string;
  NF_Quote_Line__c: string;
  NF_USF_Address__c: string;
  NF_Aggregated_Product_Name__c: string;
  NF_Asset_Product__c: string;
  NF_Frequency_Product__c: string;
  NF_PreOrder_Flow_Complete__c: boolean;
  NF_Quantity_Quoted__c: number;
  NF_SiteName__c: string;
  NF_USF_Address__r: USF_Address__c;
  NF_Quote_Line__r: SBQQ__QuoteLine__c;
  NF_Quote__r: SBQQ__Quote__c;
  NF_Site_Name__c?: string;

  public setTypeAttribute(): void {
    super._setTypeAttribute('NF_Quoted_Jobsite__c');
  }
}

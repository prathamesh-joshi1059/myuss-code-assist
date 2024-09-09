import { Contract } from './Contract';
import { NF_Quoted_Jobsite__c } from './NF_Quoted_Jobsite__c';
import { SBQQ__Product__c } from './SBQQ__Product__c';
import { SBQQ__Subscription__c } from './SBQQ__Subscription__c';
import { USF_Address__c } from './USF_Address__c';

export class NF_Asset_Location__c {
  Id: string;
  Name: string;
  NF_USS_Order__c: string;
  NF_End_Date__c: Date;
  NF_Start_Date__c: Date;
  Service_Start_Date__c: Date;
  Service_End_Date__c: Date;
  NF_Service_Product__r: SBQQ__Product__c;
  NF_Subscription_Product__r?: SBQQ__Product__c;
  NF_Placed_Jobsite__r: USF_Address__c;
  NF_Quantity__c?: number;
  NF_Asset_Serial_Number__c?: string;
  NF_Bundle_Subscription_Original__r?: SBQQ__Subscription__c;
  NF_Asset__c?: string;
  NF_USS_Order__r?: Contract;
  NF_Service_Subscription__r?: SBQQ__Subscription__c;
}

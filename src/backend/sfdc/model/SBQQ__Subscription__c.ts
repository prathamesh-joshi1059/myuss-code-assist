import { SBQQ__Product__c } from './SBQQ__Product__c';
import { SBQQ__QuoteLine__c } from './SBQQ__QuoteLine__c';

export class SBQQ__Subscription__c {
  Id: string;
  SBQQ__RequiredById__c: string;
  SBQQ__StartDate__c: Date;
  SBQQ__EndDate__c: Date;
  NF_Service_Start_Date__c: Date;
  NF_Service_End_Date__c: Date;
  Price_Override__c: number;
  Product_Type__c: string;
  SBQQ__ChargeType__c: string;
  SBQQ__Quantity__c: number;
  AVA_SFCPQ__TaxAmount__c: number;
  SBQQ__Product__r: SBQQ__Product__c;
  SBQQ__QuoteLine__r?: SBQQ__QuoteLine__c;
}

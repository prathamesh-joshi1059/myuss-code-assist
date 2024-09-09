import { SBQQ__Product__c } from "./SBQQ__Product__c";
import { USF_Address__c } from "./USF_Address__c";

export class MaintenancePlan {
  Id: string;
  Subscription__c: string;
  Active__c: boolean;
  Contract__c: string;
  StartDate: Date;
  EndDate: Date;
  Day_of_Week__c: string;
  Last_Generated_Date__c: Date;
  Service_Frequency__c: string;
  Site_Name__c: string;
  Site_City__c: string;
  Frequency: number;
  FrequencyType: string;
  Site_Address__r: USF_Address__c;
  Maintenance_Lines__r: Maintenance_Line__c[];

  constructor() {
    this.Maintenance_Lines__r = [];
  }
}

export class Maintenance_Line__c {
  Id: string;
  Customer_Owned__c: boolean;
  Product__r: SBQQ__Product__c;
  Effective_From__c: Date;
  End_Date__c: Date;
  Quantity__c: number;
  ServiceSubscription__c: string;
  Subscription__c: string;
}
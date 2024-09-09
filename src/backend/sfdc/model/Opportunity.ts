import { Project } from "src/myuss/models/project.model";
import { SFDC_Object } from "./SFDC_Base";
import { USF_Project__c } from "./USF_Project__c";

export class Opportunity extends SFDC_Object {
  Id:string;
  AccountId: string;
  Name: string;
  Opportunity_Name_Extension__c: string;
  StageName: string;
  Amount: number;
  CloseDate: string;
  LeadSource: string;
  USF_Bill_To_Account__c: string;
  USF_Start_Date__c: string;
  USF_End_Date__c: string;
  USF_Order_Type__c: string;
  USF_Primary_Contact__c: string;
  USF_Won_Reason__c: string;
  USS_Product_Categories__c: string;
  USF_Project__c: string;
  USF_Project__r: USF_Project__c;
}
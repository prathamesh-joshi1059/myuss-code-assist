import { Contact } from './Contact';
import { SFDC_Object } from './SFDC_Base';
import { User } from './User';

export class Account extends SFDC_Object {
  Id?: string;
  Name?: string;
  RecordTypeId?: string;
  Phone?: string;
  USF_Account_Number__c?: string;
  PP_Email__c?: string;
  AVA_MAPPER__Business_Identification_Number__c?: string;
  AVA_MAPPER__Exemption_Number__c?: string;
  Primary_Payer__c?: string;
  Customer_Segment__c?: string;
  Business_Type__c?: string;
  PO_Required__c?: boolean;
  Lien_Release_Required__c?: boolean;
  Auto_Pay_Requirement__c?: string;
  BillingAddress?: string;
  BillingStreet?: string;
  BillingCity?: string;
  BillingState?: string;
  BillingStateCode__c?: string;
  BillingPostalCode?: string;
  BillingCountry?: string;
  BillingCountryCode?: string;
  Primary_Address_ID__c?: string;
  // MyUSS feature/module flags
  MyUSS_Enabled__c?: boolean;
  MyUSS_Billing_Enabled__c?: boolean;
  MyUSS_Cases_Enabled__c?: boolean;
  MyUSS_Easy_Pay_Enabled__c?: boolean;
  MyUSS_Home_Enabled__c?: boolean;
  MyUSS_Orders_Enabled__c?: boolean;
  MyUSS_Projects_Enabled__c?: boolean;
  MyUSS_Quotes_Enabled__c?: boolean;
  MyUSS_Asset_Scanning_Enabled__c?:boolean;
  Contacts: Contact[];
  Bill_to_Email_Address_1__c: string;
  Bill_to_Email_Address_2__c: string;
  Bill_to_Email_Address_3__c: string;
  Bill_to_Email_Address_4__c: string;
  Bill_to_Email_Address_5__c: string;
  Bill_to_Email_Address_6__c: string;
  Account_Payment_Status__c: string;
  Owner?: User;  USF_Outstanding_Balance__c: number;
  MyUSS_Bypass_Terms_and_Conditions__c: boolean;

  constructor() {
    super();
    this.Id = '';
  }
}

import { Account } from './Account';
import { Contact } from './Contact';
import { NF_Quoted_Jobsite__c } from './NF_Quoted_Jobsite__c';
import { Opportunity } from './Opportunity';
import { Purchase_Order__c } from './Purchase_Order__c';
import { SBQQ__QuoteDocument__c } from './SBQQ__QuoteDocument__c';
import { SBQQ__QuoteLine__c } from './SBQQ__QuoteLine__c';
import { Attributes, SFDC_Object } from './SFDC_Base';
import { USF_Address__c } from './USF_Address__c';
import { User } from './User';

export class SBQQ__Quote__c extends SFDC_Object {
  Id: string;
  Bill_To_Address__c: string;
  Bill_To_Address__r: USF_Address__c;
  Shipping_Address__c: string;
  Primary_Contact__c: string;
  Ship_To_Contact__c: string;
  PrimarySiteContact__c: string;
  PrimarySiteContact__r: Contact;
  BillToContact__c: string;
  SBQQ__Opportunity2__c: string;
  SBQQ__Opportunity2__r: Opportunity;  
  SBQQ__Account__c: string;
  Parent_Account_Number__c: string;
  Purchase_Order__c: string;
  SBQQ__Status__c: string;
  SBQQ__Ordered__c?: boolean;
  Name: string;
  BillCycleDay__c: string;
  Bill_Timing__c: string;
  Billing_Approval_Status__c: string;
  Billing_Complete__c: boolean;
  // Site_Complete__c: boolean;
  Billing_Period__c: string;
  Charge_Type__c: string;
  Decline_Damage_Waiver__c: boolean;
  EEC_Percent__c: number;
  ESF_Percent__c: number;
  Fuel_Surcharge_Percent__c: number;
  InvoiceDeliveryMethod__c: string;
  LastBillingDate__c: string;
  Legal_Entity__c: string;
  Legal_entity_code__c: string;
  Location_Code__c: string;
  Customer_Type__c: string;
  Business_Type__c: string;
  Bill_To_Contact_Email__c: string;
  Order_Type__c: string;
  Facility_Name__c: string;
  Subdivision_Name__c: string;
  OtherInstructions__c: string;
  Other_Access_Notes__c: string;
  PO_Number_Conga__c: string;
  Payment_Mode__c: string;
  isCheckPaymentMethod__c: boolean;
  AutoPay__c: boolean;
  Payment_Method_Id__c: string;
  SBQQ__BillingStreet__c: string;
  SBQQ__BillingCity__c: string;
  SBQQ__BillingState__c: string;
  SBQQ__BillingPostalCode__c: string;
  SBQQ__ShippingStreet__c: string;
  SBQQ__ShippingCity__c: string;
  SBQQ__ShippingState__c: string;
  SBQQ__ShippingPostalCode__c: string;
  SBQQ__StartDate__c: string;
  SBQQ__EndDate__c: string;
  ZSB__ZuoraBillingAccountId__c: string;
  Reference_Number__c: string;
  CreatedDate: any;
  LastModifiedDate: any;
  SBQQ__Account__r: Account;
  Purchase_Order__r: Purchase_Order__c;
  SBQQ__LineItems__r: SBQQ__QuoteLine__c[];
  Ship_To_Contact__r: Contact;
  SBQQ__PrimaryContact__r: Contact;
  SBQQ__CustomerAmount__c: any;
  Shipping_Address__r: USF_Address__c;
  NF_Quoted_Jobsites__r: NF_Quoted_Jobsite__c[];
  SBQQ__QuoteDocuments__r: SBQQ__QuoteDocument__c[];
  SBQQ__R00N70000001lX7YEAU__r: SBQQ__QuoteDocument__c[];
  Credit_Card_Payment_Status__c: string;
  PreOrder_Flow_Complete__c: boolean;
  //Billing_System__c: string;
  CPQ_Template__c: string; // template ID
  Enable_Server_Side_Pricing_Calculation__c: boolean;
  AVA_SFCPQ__Entity_Use_Code__r: {
    Name: string;
  };
  AvaTax_Company_Code__c: string;
  AVA_SFCPQ__Is_Seller_Importer_Of_Record__c: boolean;
  Ship_From_Street__c: string;
  Ship_From_City__c: string;
  Ship_From_State__c: string;
  Ship_From_Zipcode__c: string;
  AVA_SFCPQ__SalesTaxAmount__c: number;
  AVA_SFCPQ__AvaTaxMessage__c: string;
  Service_Type_Scenario__c: string;
  Site_Complete__c?: boolean;
  Duration__c?: string;
  Recalculate__c?: boolean;
  NF_MlcpqStatus__c: string;
  SBQQ__Type__c: string;
  Sub_Order_Type__c: any;
  TotalOneTimeCharges__c: number;
  NF_Trailer_Count__c: number;
  NF_Quote_Type__c: string;
  EEC__c: boolean;
  LastActivityDate: string;
  LastViewedDate: string;
  LastReferencedDate: string;
  SBQQ__LastCalculatedOn__c: string;
  SBQQ__Uncalculated__c: boolean;
  SBQQ__Unopened__c: boolean;
  SBQQ__PriceBook__c: string;
  SBQQ__Primary__c: boolean;
  SBQQ__PrimaryContact__c: string;
  Serviceable_Zip_Code__c: string;
  Can_be_Ordered_in_Salesforce__c: boolean;
  Quote_Name__c: string;
  SBQQ__PricebookId__c: string;
  Quoted_Jobsites__c: boolean;
  // SBQQ__Ordered__c?:boolean;
  Quote_Date__c?: string;
  SBQQ_ExpirationDateFormatted__c?: string;
  SBQQ__SalesRep__r?: Contact;
  One_Time_Subtotal__c?: number;
  One_Time_Tax__c?: number;
  One_Time_Total__c?: number;

  Recurring_Subtotal__c?: number;
  Recurring_Tax__c?: number;
  Recurring_Total__c?: number;
  SecondaryBillToContact__r?: Contact;

  Estimated_End_Date__c?: string;
  CreatedBy: User;

  Serviceable_Zip_Code__r: {
    Zip_Code__c: string;
  }
  SBQQ__ExpirationDate__c?:string;
  SBQQ__LineItemCount__c?:number;

  public setTypeAttribute(): void {
    super._setTypeAttribute('SBQQ__Quote__c');
  }
}

export class SBQQ__Quote__c_DtoCreate {
  constructor(
    Bill_To_Address__c?: string,
    Shipping_Address__c?: string,
    Primary_Contact__c?: string,
    Ship_To_Contact__c?: string,
    PrimarySiteContact__c?: string,
    BillToContact__c?: string,
    SBQQ__Opportunity2__c?: string,
    SBQQ__Account__c?: string,
    Purchase_Order__c?: string,
    Name?: string,
    Bill_Timing__c?: string,
    Billing_Approval_Status__c?: string,
    Billing_Complete__c?: string,
    Billing_Period__c?: string,
    Charge_Type__c?: string,
    Decline_Damage_Waiver__c?: string,
    EEC_Percent__c?: string,
    ESF_Percent__c?: string,
    Fuel_Surcharge_Percent__c?: string,
    InvoiceDeliveryMethod__c?: string,
    LastBillingDate__c?: string,
    Legal_Entity__c?: string,
    Legal_entity_code__c?: string,
    Location_Code__c?: string,
    Customer_Type__c?: string,
    Business_Type__c?: string,
    Bill_To_Contact_Email__c?: string,
    Order_Type__c?: string,
    Facility_Name__c?: string,
    Subdivision_Name__c?: string,
    OtherInstructions__c?: string,
    Other_Access_Notes__c?: string,
    PO_Number_Conga__c?: string,
    Payment_Mode__c?: string,
    isCheckPaymentMethod__c?: string,
    AutoPay__c?: string,
    Payment_Method_Id__c?: string,
    SBQQ__BillingStreet__c?: string,
    SBQQ__BillingCity__c?: string,
    SBQQ__BillingState__c?: string,
    SBQQ__BillingPostalCode__c?: string,
    SBQQ__ShippingStreet__c?: string,
    SBQQ__ShippingCity__c?: string,
    SBQQ__ShippingState__c?: string,
    SBQQ__ShippingPostalCode__c?: string,
    SBQQ__StartDate__c?: string,
    SBQQ__EndDate__c?: string,
  ) {
    this.Bill_To_Address__c = Bill_To_Address__c;
    this.Shipping_Address__c = Shipping_Address__c;
    //this.Primary_Contact__c = Primary_Contact__c;
    this.Ship_To_Contact__c = Ship_To_Contact__c;
    this.PrimarySiteContact__c = PrimarySiteContact__c;
    this.BillToContact__c = BillToContact__c;
    this.SBQQ__Opportunity2__c = SBQQ__Opportunity2__c;
    this.SBQQ__Account__c = SBQQ__Account__c;
    this.Purchase_Order__c = Purchase_Order__c;
    //this.Name = Name;
    this.Bill_Timing__c = Bill_Timing__c;
    this.Billing_Approval_Status__c = Billing_Approval_Status__c;
    this.Billing_Complete__c = Billing_Complete__c;
    this.Billing_Period__c = Billing_Period__c;
    this.Charge_Type__c = Charge_Type__c;
    this.Decline_Damage_Waiver__c = Decline_Damage_Waiver__c;
    this.EEC_Percent__c = EEC_Percent__c;
    this.ESF_Percent__c = ESF_Percent__c;
    this.Fuel_Surcharge_Percent__c = Fuel_Surcharge_Percent__c;
    this.InvoiceDeliveryMethod__c = InvoiceDeliveryMethod__c;
    this.LastBillingDate__c = LastBillingDate__c;
    this.Legal_Entity__c = Legal_Entity__c;
    this.Legal_entity_code__c = Legal_entity_code__c;
    this.Location_Code__c = Location_Code__c;
    this.Customer_Type__c = Customer_Type__c;
    this.Business_Type__c = Business_Type__c;
    this.Bill_To_Contact_Email__c = Bill_To_Contact_Email__c;
    this.Order_Type__c = Order_Type__c;
    this.Facility_Name__c = Facility_Name__c;
    this.Subdivision_Name__c = Subdivision_Name__c;
    this.OtherInstructions__c = OtherInstructions__c;
    this.Other_Access_Notes__c = Other_Access_Notes__c;
    //this.PO_Number_Conga__c = PO_Number_Conga__c;
    this.Payment_Mode__c = Payment_Mode__c;
    this.isCheckPaymentMethod__c = isCheckPaymentMethod__c;
    this.AutoPay__c = AutoPay__c;
    this.Payment_Method_Id__c = Payment_Method_Id__c;
    this.SBQQ__BillingStreet__c = SBQQ__BillingStreet__c;
    this.SBQQ__BillingCity__c = SBQQ__BillingCity__c;
    this.SBQQ__BillingState__c = SBQQ__BillingState__c;
    this.SBQQ__BillingPostalCode__c = SBQQ__BillingPostalCode__c;
    this.SBQQ__ShippingStreet__c = SBQQ__ShippingStreet__c;
    this.SBQQ__ShippingCity__c = SBQQ__ShippingCity__c;
    this.SBQQ__ShippingState__c = SBQQ__ShippingState__c;
    this.SBQQ__ShippingPostalCode__c = SBQQ__ShippingPostalCode__c;
    this.SBQQ__StartDate__c = SBQQ__StartDate__c;
    this.SBQQ__EndDate__c = SBQQ__EndDate__c;
  }

  Bill_To_Address__c: string;
  Shipping_Address__c: string;
  Primary_Contact__c: string;
  Ship_To_Contact__c: string;
  PrimarySiteContact__c: string;
  BillToContact__c: string;
  SBQQ__Opportunity2__c: string;
  SBQQ__Account__c: string;
  Purchase_Order__c: string;
  Name: string;
  Bill_Timing__c: string;
  Billing_Approval_Status__c: string;
  Billing_Complete__c: string;
  Billing_Period__c: string;
  Charge_Type__c: string;
  Decline_Damage_Waiver__c: string;
  EEC_Percent__c: string;
  ESF_Percent__c: string;
  Fuel_Surcharge_Percent__c: string;
  InvoiceDeliveryMethod__c: string;
  LastBillingDate__c: string;
  Legal_Entity__c: string;
  Legal_entity_code__c: string;
  Location_Code__c: string;
  Customer_Type__c: string;
  Business_Type__c: string;
  Bill_To_Contact_Email__c: string;
  Order_Type__c: string;
  Facility_Name__c: string;
  Subdivision_Name__c: string;
  OtherInstructions__c: string;
  Other_Access_Notes__c: string;
  PO_Number_Conga__c: string;
  Payment_Mode__c: string;
  isCheckPaymentMethod__c: string;
  AutoPay__c: string;
  Payment_Method_Id__c: string;
  SBQQ__BillingStreet__c: string;
  SBQQ__BillingCity__c: string;
  SBQQ__BillingState__c: string;
  SBQQ__BillingPostalCode__c: string;
  SBQQ__ShippingStreet__c: string;
  SBQQ__ShippingCity__c: string;
  SBQQ__ShippingState__c: string;
  SBQQ__ShippingPostalCode__c: string;
  SBQQ__StartDate__c: string;
  SBQQ__EndDate__c: string;
}

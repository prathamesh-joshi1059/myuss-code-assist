import { Purchase_Order__c } from './Purchase_Order__c';
import { Contact } from './Contact';
import { USF_Address__c } from './USF_Address__c';
import { NF_Asset_Location__c } from './NF_Asset_Location__c';
import { MaintenancePlan } from './MaintenancePlan';
import { SBQQ__Subscription__c } from './SBQQ__Subscription__c';
import { WorkOrder } from './WorkOrder';
import { SBQQ__Quote__c } from './SBQQ__Quote__c';
import { CaseOrderRelationship } from 'src/myuss/models/case-order-relationship.model';
import { Case_Order_Relationship__c } from 'src/backend/sfdc/model/Case_Order_Relationship__c';
export class Contract {
  Id: string;
  Name: string;
  Reference_Number__c: string;
  BillCycleDay__c: number;
  Billing_Period__c: string;
  NF_EEC_Percent__c: number;
  NF_ESF_Percent__c: number;
  Fuel_Surcharge_Percent__c: number;
  InvoiceDeliveryMethod__c: string;
  LastBillingDate__c: Date;
  Location_Code__c: string;
  Status: string;
  Order_Type__c: string;
  Facility_Name__c: string;
  Bill_To_Contact_Name__c: string;
  Bill_To_Contact_Email__c: string;
  Subdivision_Name__c: string;
  AutoPay__c: boolean;
  Payment_Method_ID__c: string;
  StartDate: Date;
  EndDate: Date;
  AccountId: string;
  CreatedDate: Date;
  LastModifiedDate: Date;
  Bill_to_Email_Address_1__c: string;
  Bill_to_Email_Address_2__c: string;
  Bill_to_Email_Address_3__c: string;
  Bill_to_Email_Address_4__c: string;
  Bill_to_Email_Address_5__c: string;
  Bill_to_Email_Address_6__c: string;
  Ship_To__c: string;
  Ship_To_Street__c: string;
  Ship_To_City__c: string;
  Ship_To_State__c: string;
  Ship_To_Zip_Code__c: string;
  Purchase_Order__r: Purchase_Order__c;
  SecondaryBillToContact__r: Contact;
  PrimaryContact__r: Contact;
  Bill_To_Address__r: USF_Address__c;
  Asset_Locations__r: NF_Asset_Location__c[];
  Maintenance_Plans__r: MaintenancePlan[];
  SBQQ__Subscriptions__r: SBQQ__Subscription__c[];
  Work_Orders__r: WorkOrder[];
  SBQQ__Quote__r: SBQQ__Quote__c;

  currentStatus: number;
  SBQQ__Quote__c: string;
  SBQQ__Order__c: string;
  billingEffectiveDateCombined__c: string;
  contractDocumnetId: string;
  contractDocumentName: string;
  Global_Order_Number__c?: string;
  Shipping_Address__r?: USF_Address__c ;
  ContractNumber?: string;
  CaseOrderRelationships__r?:CaseOrderRelationship
  Case_Order_Relationship__c?:Case_Order_Relationship__c;

  constructor() {
    this.Asset_Locations__r = [];
  }
}

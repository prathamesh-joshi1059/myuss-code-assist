import { Contact } from './Contact';

export class USF_Address__c {
  Id: string;
  USF_Account__c: string;
  Name: string;
  NF_Parent_USF_Address__c: string;
  NF_Parent_USF_Address__r: USF_Address__c;
  USF_Street__c: string;
  USF_City__c: string;
  USF_State__c: string;
  USF_Zip_Code__c: string;
  USF_Country__c: string;
  Address_Latitude_Longitude__Latitude__s: number;
  Address_Latitude_Longitude__Longitude__s: number;
  Is_Primary__c: boolean;
  USF_Ship_To_Address__c: boolean;
  USF_Bill_To_Address__c: boolean;
  NF_Is_Parent__c: boolean;
  Address_Validated__c: boolean;
  GeoCode_Accuracy__c: string;
  Site_Name__c: string;
  NF_Site_Hours_Start_Time__c: string;
  NF_Site_Hours_End_Time__c: string;
  NF_Arrival_Start_Time__c: string;
  NF_Arrival_End_Time__c: string;
  NF_Gate_Code__c: string;
  NF_Access_instructions__c: string;
  NF_Key_Instructions__c: string;
  NF_Other_Instructions__c: string;
  NF_Placement__c: string;
  NF_Site_Contact__r: Contact;
  NF_Secondary_Site_Contact__r: Contact;
  NF_Ship_To_Contact__r: Contact;
  NF_Site_Name_Address__c?: string;
  Additional_Information__c? : string;
  NF_Ship_To_Contact__c? : string;
  NF_Site_Contact__c? : string;
  NF_Clearance_Required__c? : boolean;
  NF_Background_Check__c?: boolean;
  NF_Site_Name__c?: string;

  
}

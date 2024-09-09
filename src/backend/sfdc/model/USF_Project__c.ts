import { SFDC_Object } from "./SFDC_Base";


export class USF_Project__c extends SFDC_Object {
Id: string;
Name?: string;
USF_Project_Description__c?: string;
Project_ID_SF__c?: string;
USF_Project_Type__c?: string;
USF_External_Project_Type__c?: string;
Stage__c?: string;
USF_USS_Project_Status__c?: string;
USF_Project_Start_Date__c?: string;
USF_Completion_Date__c?: string;
USF_Project_Address_1__c?: string;
CreatedDate?: string;
LastModifiedDate?: string;
USF_Project_City__c?: string;
USF_Project_State__c?: string;
USF_Project_Zip_Code__c?: string;
USF_Project_County__c?: string;
USF_Project_Contact_Email__c?: string;
USF_Project_Contact_Name__c?:string;
USF_Project_Contact_Phone__c?:string;
USF_Project_Contact_Title__c?:string;


public setTypeAttribute(): void {
    super._setTypeAttribute('USF_Project__c');
}
    
}
import { SFDC_Object } from "./SFDC_Base";
import { USF_Project__c } from "./USF_Project__c";



export class USF_Account_Project__c extends SFDC_Object {
    Id: string;
    USF_Project__c?: string;
    USF_Account__c?:string;
    USF_Project_Status__c?:string;
    Name?:string;
    CreatedDate?: Date;
    LastModifiedDate?: Date;
    USF_Project__r:USF_Project__c

    public setTypeAttribute(): void {
        super._setTypeAttribute('USF_Account_Project__c');
    }
}
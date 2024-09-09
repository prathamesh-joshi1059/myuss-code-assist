import { SFDC_Object } from "./SFDC_Base";


export class Portal_Action__c extends SFDC_Object {
    Id?: string;
    OwnerId?: string;
    IsDeleted?: boolean;
    Name?: string;
    Quote__c?:string;
    USS_Portal_User__c?: string;
    Account__c?: string;
    User_Action__c?:string;
    Contact__c?: string;
    USS_Order__c?: string;
    Screen_Name__c? : string;

    public setTypeAttribute(): void {
        super._setTypeAttribute('Portal_Action__c');
    }
}
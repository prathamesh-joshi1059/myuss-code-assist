import { Contact } from './Contact';
import { SFDC_Object } from './SFDC_Base';

export class USS_Portal_User__c extends SFDC_Object{
  Id: string;
  Name: string;
  Email_Address__c: string;
  Auth0_Id__c: string;
  Contacts__r: Contact[];
  Last_Login__c: Date;

  public setTypeAttribute(): void {
    super._setTypeAttribute('USS_Portal_User__c');
  }
}

import { Account } from './Account';
import { AccountContactRelation } from './AccountContactRelation';
import { SFDC_Object } from './SFDC_Base';
import { USS_Portal_User__c } from './USS_Portal_User__c';

export class Contact extends SFDC_Object {
  Id: string;
  FirstName: string;
  LastName: string;
  Phone: string;
  Email: string;
  MailingAddress: string;
  AccountId: string;
  Account: Account;
  USS_Portal_User__c: string;
  USS_Portal_User__r: USS_Portal_User__c;
  AccountContactRelations: AccountContactRelation[];
  ContactId?: string;
  Title?: string;

  Name?: string;

  constructor() {
    super();
    this.Id = '';
  }
}

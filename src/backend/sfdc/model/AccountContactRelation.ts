import { Account } from './Account';
import { Contact } from './Contact';

export class AccountContactRelation {
  public Id: string;
  public AccountId: string;
  public ContactId: string;
  public Roles: string;
  public IsDirect: boolean;
  public IsActive: boolean;
  public CreatedDate: Date;
  public CreatedById: string;
  public LastModifiedDate: Date;
  public LastModifiedById: string;
  public SystemModstamp: Date;
  public IsDeleted: boolean;
  public LastViewedDate: Date;
  public LastReferencedDate: Date;
  public Account: Account;
  public Contact: Contact;
  public MyUSS_User_Role__c?: string;
  public MyUSS_Modules__c?: string;
}

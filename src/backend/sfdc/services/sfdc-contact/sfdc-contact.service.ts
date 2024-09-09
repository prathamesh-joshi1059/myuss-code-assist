import { Injectable } from '@nestjs/common';
import { SfdcBaseService } from '../sfdc-base/sfdc-base.service';
import { Contact } from '../../model/Contact';
import { LoggerService } from '../../../../core/logger/logger.service';

@Injectable()
export class SfdcContactService {
  constructor(private salesforceBaseService: SfdcBaseService, private logger: LoggerService) {}

  async updateContacts(contactsToUpdate: Contact[]): Promise<any> {
    return this.salesforceBaseService.updateSObjects('Contact', contactsToUpdate);
  }

  async insertContacts(contactsToInsert: Contact[]): Promise<any> {
    return this.salesforceBaseService.createSObjects('Contact', contactsToInsert, 25);
  }

  async getContactsForAccount(accountId: string): Promise<Contact[]> {
    return this.salesforceBaseService.conn
      .sobject('AccountContactRelation')
      .select(
        'Id, AccountId, Account.USF_Account_Number__c, Roles, ContactId, Contact.FirstName, Contact.LastName, Contact.Email, Contact.Phone, Contact.Ext__c, IsActive, Contact.USF_Inactive__c',
      )
      .where({ AccountId: accountId })
      .limit(500)
      .execute();
  }

  public async getContactsByAccountNumbers(accountNumbers: string[]): Promise<Contact[]> {
    const accountNumbersSoql = `USF_Inactive__c = false AND Account.USF_Account_Number__c IN (${accountNumbers
      .map((accountNumber) => `'${this.salesforceBaseService.escapeSOQLString(accountNumber)}'`)
      .join(',')})`;
      
    return this.salesforceBaseService.conn
      .sobject('Contact')
      .select('Id, Name, Email, CreatedDate, AccountId')
      .where(accountNumbersSoql)
      .execute({ autoFetch: true, maxFetch: 100000 });
  }

  async getContactByEmail(email: string): Promise<any> {
    const safeEmail = this.salesforceBaseService.escapeSOQLString(email);
    const query = `SELECT Id, FirstName, LastName, Email, Phone, MailingStreet, MailingCity, MailingState, 
    MailingPostalCode, MailingCountry, USS_Portal_User__r.Auth0_Id__c FROM Contact WHERE Email = '${safeEmail}'`;
    return this.salesforceBaseService.getQuery(query);
  }
}
import { Injectable } from '@nestjs/common';
import { SfdcBaseService } from '../sfdc-base/sfdc-base.service';
import { Contact } from '../../model/Contact';
import { LoggerService } from '../../../../core/logger/logger.service';

@Injectable()
export class SfdcContactService {
  constructor(private salesforceBaseService: SfdcBaseService, private logger: LoggerService) {}

  async updateContacts(contactsToUpdate: Contact[]): Promise<any> {
    const response = await this.salesforceBaseService.updateSObjects('Contact', contactsToUpdate);
    return response;
  }

  async insertContacts(contactsToInsert: Contact[]): Promise<any> {
    const response = await this.salesforceBaseService.createSObjects('Contact', contactsToInsert, 25);
    return response;
  }

  async getContactsForAccount(accountId: string) {
    const contact: Contact[] = await this.salesforceBaseService.conn
      .sobject('AccountContactRelation')
      .select(
        'Id, AccountId, Account.USF_Account_Number__c, Roles, ContactId, Contact.FirstName, Contact.LastName, Contact.Email, Contact.Phone, Contact.Ext__c, IsActive, Contact.USF_Inactive__c',
      )
      .where({ AccountId: accountId })
      .limit(500)
      .execute();
    return contact;
  }

  public async getContactsByAccountNumbers(accountNumbers: string[]) {
    let accountNumbersSoql = 'USF_Inactive__c = false AND Account.USF_Account_Number__c IN (';
    accountNumbers.forEach((accountNumber) => {
      accountNumbersSoql += `'${this.salesforceBaseService.escapeSOQLString(accountNumber)}',`;
    });
    accountNumbersSoql = accountNumbersSoql.slice(0, -1); // remove trailing comma
    accountNumbersSoql += ')';
    const contacts = await this.salesforceBaseService.conn
      .sobject('Contact')
      .select('Id, Name, Email, CreatedDate, AccountId')
      .where(accountNumbersSoql)
      .execute({ autoFetch: true, maxFetch: 100000 });
    return contacts;
  }

  async getContactByEmail(email: string) {
    const safeEmail = this.salesforceBaseService.escapeSOQLString(email);
    const query = `SELECT Id, FirstName, LastName, Email, Phone, MailingStreet, MailingCity, MailingState, 
    MailingPostalCode, MailingCountry, USS_Portal_User__r.Auth0_Id__c FROM Contact WHERE Email = '${safeEmail}'`;
    const response = await this.salesforceBaseService.getQuery(query);
    return response;
  }
}

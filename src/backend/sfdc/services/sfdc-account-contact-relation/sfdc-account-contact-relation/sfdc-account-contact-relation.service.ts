import { Injectable } from '@nestjs/common';
import { SfdcBaseService } from '../../sfdc-base/sfdc-base.service';
import { USS_Portal_User__c } from '../../../../../backend/sfdc/model/USS_Portal_User__c';
import { AccountContactRelation } from '../../../../../backend/sfdc/model/AccountContactRelation';
import { LoggerService } from '../../../../../core/logger/logger.service';
import { Account } from '../../../../../backend/sfdc/model/Account';
import { Contact } from '../../../../../backend/sfdc/model/Contact';
import { SFDC_Response } from '../../../../../backend/sfdc/model/SFDC_Response';

@Injectable()
export class SfdcAccountContactRelationService {
  constructor(
    private salesforceBaseService: SfdcBaseService,
    private logger: LoggerService
  ) {}

  async updateAccountContactRelations(
    accountContactRelationsToUpdate: AccountContactRelation[]
  ): Promise<SFDC_Response[]> {
    // delete contact and account fields
    accountContactRelationsToUpdate.forEach((acr) => {
      delete acr.Account;
      delete acr.Contact;
      delete acr.ContactId;
      delete acr.AccountId;
    });
    return await this.salesforceBaseService.conn
      .sobject('AccountContactRelation')
      .update(accountContactRelationsToUpdate);
  }

  async getAccountContactRelation(
    accountId: string,
    contactId: string
  ): Promise<AccountContactRelation> {
    const accountContactRelation = await this.salesforceBaseService.conn
      .sobject('AccountContactRelation')
      .select('Id, AccountId, ContactId, Roles')
      .where({ AccountId: accountId, ContactId: contactId })
      .limit(1)
      .execute();
    return accountContactRelation;
  }

  async getACRsForUSSPortalUsers(
    ussPortalUsers: USS_Portal_User__c[]
  ): Promise<AccountContactRelation[]> {
    // get the ACRs by portal user in batches of 100
    const accountContactRelations: AccountContactRelation[] = [];
    const ussPortalUserIds = ussPortalUsers.map((user) => user.Id);
    const batchSize = 100;

    for (let i = 0; i < ussPortalUserIds.length; i += batchSize) {
      const batchIds = ussPortalUserIds.slice(i, i + batchSize);
      const batchAccountContactRelations = await this.salesforceBaseService.conn
        .sobject('AccountContactRelation')
        .select(`Id, AccountId, Account.USF_Account_Number__c, ContactId, Contact.USS_Portal_User__r.Email_Address__c, Roles, MyUSS_User_Role__c, MyUSS_Modules__c,
            Account.MyUSS_Enabled__c, Account.MyUSS_Billing_Enabled__c, Account.MyUSS_Cases_Enabled__c,
            Account.MyUSS_Easy_Pay_Enabled__c, Account.MyUSS_Home_Enabled__c, Account.MyUSS_Orders_Enabled__c,
            Account.MyUSS_Projects_Enabled__c, Account.MyUSS_Quotes_Enabled__c`)
        .where(`Contact.USS_Portal_User__c IN ('${batchIds.join("','")}')`)
        .execute({ autoFetch: true, maxFetch: 10000 });

      // map the attributes on the Contact response to the AccountContactRelation model
      batchAccountContactRelations.forEach((acr) => {
        const accountContactRelation = new AccountContactRelation();
        accountContactRelation.Id = acr.Id;
        accountContactRelation.AccountId = acr.AccountId;
        accountContactRelation.ContactId = acr.ContactId;
        accountContactRelation.Roles = acr.Roles;
        accountContactRelation.MyUSS_User_Role__c = acr.MyUSS_User_Role__c;
        accountContactRelation.MyUSS_Modules__c = acr.MyUSS_Modules__c;
        accountContactRelation.Account = new Account();
        accountContactRelation.Account.Id = acr.Account.attributes.Id;
        accountContactRelation.Account.USF_Account_Number__c = acr.Account.USF_Account_Number__c;
        accountContactRelation.Account.MyUSS_Enabled__c = acr.Account.MyUSS_Enabled__c;
        accountContactRelation.Account.MyUSS_Billing_Enabled__c = acr.Account.MyUSS_Billing_Enabled__c;
        accountContactRelation.Account.MyUSS_Cases_Enabled__c = acr.Account.MyUSS_Cases_Enabled__c;
        accountContactRelation.Account.MyUSS_Easy_Pay_Enabled__c = acr.Account.MyUSS_Easy_Pay_Enabled__c;
        accountContactRelation.Account.MyUSS_Home_Enabled__c = acr.Account.MyUSS_Home_Enabled__c;
        accountContactRelation.Account.MyUSS_Orders_Enabled__c = acr.Account.MyUSS_Orders_Enabled__c;
        accountContactRelation.Account.MyUSS_Projects_Enabled__c = acr.Account.MyUSS_Projects_Enabled__c;
        accountContactRelation.Account.MyUSS_Quotes_Enabled__c = acr.Account.MyUSS_Quotes_Enabled__c;
        accountContactRelation.Contact = new Contact();
        accountContactRelation.Contact.USS_Portal_User__r = new USS_Portal_User__c();
        accountContactRelation.Contact.USS_Portal_User__r.Email_Address__c = acr.Contact.USS_Portal_User__r.Email_Address__c;
        accountContactRelations.push(accountContactRelation);
      });
    }
    return accountContactRelations;
  }

  async getAccountContactRelationsByAccountAndPortalUserId(
    accountUserMap: Map<string, string>
  ): Promise<AccountContactRelation[]> {
    // get the ACRs in batches of 50
    const accountContactRelations: AccountContactRelation[] = [];
    const accountUserMapKeys = Array.from(accountUserMap.keys());
    const accountUserMapValues = Array.from(accountUserMap.values());
    const batchSize = 50;

    for (let i = 0; i < accountUserMapKeys.length; i += batchSize) {
      const batchKeys = accountUserMapKeys.slice(i, i + batchSize);
      const batchValues = accountUserMapValues.slice(i, i + batchSize);
      const batchAccountContactRelations = await this.salesforceBaseService.conn
        .sobject('AccountContactRelation')
        .select('Id, AccountId, ContactId, Contact.USS_Portal_User__c, Roles, MyUSS_User_Role__c, MyUSS_Modules__c')
        .where({ AccountId: batchKeys, Contact: { USS_Portal_User__c: batchValues } })
        .limit(500)
        .execute();
      accountContactRelations.push(...batchAccountContactRelations);
    }
    return accountContactRelations;
  }
}
import { Injectable } from '@nestjs/common';
import { SfdcBaseService } from '../sfdc-base/sfdc-base.service';
import { Account } from '../../model/Account';
import { LoggerService } from '../../../../core/logger/logger.service';

@Injectable()
export class SfdcAccountService {
  private readonly prospectRecordTypeName = 'Prospect';
  public accountRecordTypeIdProspect!: string;

  constructor(private salesforceBaseService: SfdcBaseService, private logger: LoggerService) {}

  async getAccount(id: string): Promise<Account> {
    const fields = [
      'Id',
      'Name',
      'USF_Account_Number__c',
      'PP_Email__c',
      'AVA_MAPPER__Business_Identification_Number__c',
      'AVA_MAPPER__Exemption_Number__c',
      'Primary_Payer__c',
      'Customer_Segment__c',
      'Business_Type__c',
      'PO_Required__c',
      'Lien_Release_Required__c',
      'Auto_Pay_Requirement__c',
      'BillingAddress',
      'BillingStreet',
      'BillingCity',
      'BillingState',
      'BillingStateCode__c',
      'BillingPostalCode',
      'BillingCountry',
      'BillingCountryCode',
      'Primary_Address_ID__c',
      'Owner.Id',
      'Owner.FirstName',
      'Owner.LastName',
      'Owner.Title',
      'Owner.Phone',
      'Owner.Email',
      'Owner.UserName',
      'USF_Outstanding_Balance__c',
    ];
    const resp = await this.salesforceBaseService.getSObjectById('Account', id, fields);
    return Object.assign(new Account(), resp);
  }

  async getProspectAccountRecordTypeId(): Promise<void> {
    const soql = `SELECT Id, Name FROM RecordType WHERE SobjectType = 'Account' AND Name = '${this.prospectRecordTypeName}'`;
    const recordType = await this.salesforceBaseService.getQuery(soql);
    if (!recordType.records || recordType.records.length === 0) {
      throw new Error(`No record type found for ${this.prospectRecordTypeName}`);
    }
    this.accountRecordTypeIdProspect = recordType.records[0].Id;
  }

  async getAccountsByAccountNumbers(accountNumbers: string[]): Promise<Account[]> {
    const accountNumbersSoql = `USF_Account_Number__c IN (${accountNumbers
      .map((accountNumber) => `'${this.salesforceBaseService.escapeSOQLString(accountNumber)}'`)
      .join(',')})`;
    const query = `SELECT Id, USF_Account_Number__c FROM Account WHERE ${accountNumbersSoql}`;
    this.logger.info('getAccountsByAccountNumbers query', query);
    const response = await this.salesforceBaseService.getQuery(query);
    return response.records;
  }

  public async updatePrimaryPayer(accountId: string, contactId: string): Promise<void> {
    const account = new Account();
    account.Id = accountId;
    account.Primary_Payer__c = contactId;
    await this.salesforceBaseService.updateSObject('Account', account);
  }

  public async getPrimaryPayerEmail(accountId: string): Promise<string | null> {
    const account = await this.salesforceBaseService.getSObjectById('Account', accountId, ['PP_Email__c']);
    return account.PP_Email__c;
  }

  async getAccounts(): Promise<any> {
    const soql = `SELECT Id, Name FROM Account`;
    return await this.salesforceBaseService.getQuery(soql);
  }

  async getAccountByName(crm_companyname: string): Promise<any> {
    const soql = `SELECT Id, Name, Account_Payment_Status__c FROM Account WHERE Name LIKE '%${this.salesforceBaseService.escapeSOQLString(crm_companyname)}%'`;
    return await this.salesforceBaseService.getQuery(soql);
  }

  async getAccountNumberByUSSAccountId(ussAccountId: string): Promise<string> {
    const accounts = await this.salesforceBaseService.conn
      .sobject('Account')
      .select('USF_Account_Number__c')
      .where({ Id: ussAccountId })
      .limit(1)
      .execute();
    if (accounts.length === 0) {
      throw new Error(`No account found for ussAccountId: ${ussAccountId}`);
    }
    return accounts[0].USF_Account_Number__c;
  }

  async updateAccounts(accountsToUpdate: Account[]): Promise<any> {
    return await this.salesforceBaseService.updateSObjects('Account', accountsToUpdate, 25);
  }

  async enableMyUSSFeatures(
    accountId: string,
    featuresToEnable: ('core' | 'billing' | 'cases' | 'easy_pay' | 'home' | 'orders' | 'projects' | 'quotes')[],
    disableNotListed?: boolean,
  ): Promise<void> {
    const account = new Account();
    account.Id = accountId;
    account.MyUSS_Enabled__c = featuresToEnable.includes('core') ? true : disableNotListed ? false : null;
    account.MyUSS_Billing_Enabled__c = featuresToEnable.includes('billing') ? true : disableNotListed ? false : null;
    account.MyUSS_Cases_Enabled__c = featuresToEnable.includes('cases') ? true : disableNotListed ? false : null;
    account.MyUSS_Easy_Pay_Enabled__c = featuresToEnable.includes('easy_pay') ? true : disableNotListed ? false : null;
    account.MyUSS_Home_Enabled__c = featuresToEnable.includes('home') ? true : disableNotListed ? false : null;
    account.MyUSS_Orders_Enabled__c = featuresToEnable.includes('orders') ? true : disableNotListed ? false : null;
    account.MyUSS_Projects_Enabled__c = featuresToEnable.includes('projects') ? true : disableNotListed ? false : null;
    account.MyUSS_Quotes_Enabled__c = featuresToEnable.includes('quotes') ? true : disableNotListed ? false : null;
    await this.salesforceBaseService.updateSObject('Account', account);
  }

  public getEnabledFeatures(
    account: Account,
    featuresToEnable: ('core' | 'billing' | 'cases' | 'easy_pay' | 'home' | 'orders' | 'projects' | 'quotes')[],
  ): Account {
    account.MyUSS_Enabled__c = featuresToEnable.includes('core');
    account.MyUSS_Billing_Enabled__c = featuresToEnable.includes('billing');
    account.MyUSS_Cases_Enabled__c = featuresToEnable.includes('cases');
    account.MyUSS_Easy_Pay_Enabled__c = featuresToEnable.includes('easy_pay');
    account.MyUSS_Home_Enabled__c = featuresToEnable.includes('home');
    account.MyUSS_Orders_Enabled__c = featuresToEnable.includes('orders');
    account.MyUSS_Projects_Enabled__c = featuresToEnable.includes('projects');
    account.MyUSS_Quotes_Enabled__c = featuresToEnable.includes('quotes');
    return account;
  }

  async checkContractIdInAccount(accountId: string, contractId: string): Promise<boolean> {
    const contract = await this.salesforceBaseService.conn
      .sobject('Contract')
      .select('Id')
      .where({ Id: contractId, AccountId: accountId })
      .limit(1)
      .execute();
    return contract?.length > 0;
  }

  async fetchAllDashboardDetails(accountId: string): Promise<object> {
    const orderCountPromise = this.getCount(accountId, 'order');
    const quoteCountPromise = this.getCount(accountId, 'quote');
    const casesCountPromise = this.getCount(accountId, 'case');
    const outStandingBalancePromise = this.getQutstandingBalance(accountId);
    
    try {
      const [orderCount, quoteCount, caseCount, outStandingBalance] = await Promise.all([
        orderCountPromise,
        quoteCountPromise,
        casesCountPromise,
        outStandingBalancePromise,
      ]);
      return { orderCount, quoteCount, caseCount, outStandingBalance };
    } catch (err) {
      this.logger.error(err);
      return { status: 200, message: 'Fail', data: { error: err } };
    }
  }

  async getCount(accountId: string, type: string): Promise<number> {
    let query = '';
    switch (type) {
      case 'order':
        query = `SELECT COUNT(Id) FROM Contract WHERE AccountId = '${accountId}' AND Status != 'Canceled'`;
        break;
      case 'quote':
        query = `SELECT COUNT(Id) FROM SBQQ__Quote__c WHERE SBQQ__Account__c = '${accountId}' AND SBQQ__Status__c NOT IN ('Rejected', 'Archived', 'Ordered', 'Canceled')`;
        break;
      case 'case':
        query = `SELECT COUNT(Id) FROM Case WHERE AccountId = '${accountId}' AND Status != 'Closed' AND RecordType.Name = 'Order Support'`;
        break;
    }
    const getCountResp = await this.salesforceBaseService.getQuery(query);
    return getCountResp.records[0].expr0;
  }

  getQutstandingBalance(accountId: string): Promise<number> {
    const query = `SELECT USF_Outstanding_Balance__c FROM Account WHERE Id = '${accountId}'`;
    return this.salesforceBaseService.getQuery(query).then((resp) => {
      return resp.records[0].USF_Outstanding_Balance__c;
    });
  }

  public getUserModulesEnableFeatures(
    featuresToEnable: ('core' | 'billing' | 'cases' | 'easy_pay' | 'home' | 'orders' | 'projects' | 'quotes')[],
  ): string {
    const featureStrings: { [key: string]: string } = {
      core: 'MyUSS Enabled;',
      billing: 'MyUSS Billing Enabled;',
      cases: 'MyUSS Cases Enabled;',
      easy_pay: 'MyUSS Easy Pay Enabled;',
      home: 'MyUSS Home Enabled;',
      orders: 'MyUSS Orders Enabled;',
      projects: 'MyUSS Projects Enabled;',
      quotes: 'MyUSS Quotes Enabled;',
    };

    return featuresToEnable
      .map((feature) => featureStrings[feature])
      .filter(Boolean)
      .join('');
  }
}
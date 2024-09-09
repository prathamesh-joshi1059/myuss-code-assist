import { Injectable } from '@nestjs/common';
import { SfdcBaseService } from '../sfdc-base/sfdc-base.service';
import { Account } from '../../model/Account';
import { LoggerService } from '../../../../core/logger/logger.service';
import { SfdcContractService } from '../sfdc-contract/sfdc-contract.service';

@Injectable()
export class SfdcAccountService {
  prospectRecordTypeName = 'Prospect';
  public accountRecordTypeIdProspect: string;

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
    const account = Object.assign(new Account(), resp);

    return account;
  }

  async getProspectAccountRecordTypeId(): Promise<void> {
    const soql = `SELECT Id, Name FROM RecordType WHERE SobjectType = 'Account' AND Name = '${this.prospectRecordTypeName}'`;
    const recordType = await this.salesforceBaseService.getQuery(soql);
    if (!recordType.records || recordType.length === 0) {
      throw new Error(`No record type found for ${this.prospectRecordTypeName}`);
    }
    this.accountRecordTypeIdProspect = recordType.records[0].Id;
  }

  async getAccountsByAccountNumbers(accountNumbers: string[]): Promise<Account[]> {
    // create list of account numbers
    let accountNumbersSoql = 'USF_Account_Number__c IN (';
    accountNumbers.forEach((accountNumber) => {
      accountNumbersSoql += `'${this.salesforceBaseService.escapeSOQLString(accountNumber)}',`;
    });
    accountNumbersSoql = accountNumbersSoql.slice(0, -1); // remove trailing comma
    accountNumbersSoql += ')';
    const query = `SELECT Id, USF_Account_Number__c
      FROM Account WHERE ${accountNumbersSoql}`;
    this.logger.info('getAccountsByAccountNumbers query', query);
    const response = await this.salesforceBaseService.getQuery(query);
    const accounts = response.records;
    return accounts;
  }

  public async updatePrimaryPayer(accountId: any, contactId: any) {
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
    const accounts = await this.salesforceBaseService.getQuery(soql);
    return accounts;
  }

  async getAccountByName(crm_companyname: string) {
    const soql = `SELECT Id, Name, Account_Payment_Status__c FROM Account WHERE Name LIKE '%${this.salesforceBaseService.escapeSOQLString(
      crm_companyname,
    )}%'`;
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

  // Features: core, billing, cases, easy_pay, home, orders, projects, quotes
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
    if (contract?.length === 0) {
      return false;
    }
    return true;
  }


  async fetchAllDashboardDetails(accountId:string):Promise<object>{
   
    let orderCount = 0
    let quoteCount = 0;
    let caseCount = 0;
    let outStandingBalance = 0;

    const orderCountPromise =  this.getCount(accountId,'order').then((count) => {
      orderCount = count
    });

    const quoteCountPromise = this.getCount(accountId,'quote').then((count) => {
      quoteCount = count
      });

    const casesCountPromise = this.getCount(accountId,'case').then((count) => {
      caseCount = count
      });


      const outStandingBalancePromise = this.getQutstandingBalance(accountId).then((balance) => {
        outStandingBalance = balance
      });



    return await Promise.all([orderCountPromise,quoteCountPromise , casesCountPromise, outStandingBalancePromise]).then(() => {
      return {orderCount,quoteCount,caseCount,outStandingBalance}
      }).catch((err) => {
        this.logger.error(err);
    const respObj = {
      status: 200,
      message: 'Fail',
      data: { error: err },
    };
    return respObj;
      }
    );
    }
  


   async getCount(accountId: string,type: string): Promise<number> {
   let query = '';
    switch(type) {
      case 'order':
         query = `select count(id) from Contract where AccountId = '${accountId}'  and Status != 'Canceled'`;
        break;
      case 'quote':
        query= `select count(id)
        from SBQQ__Quote__c where SBQQ__Account__c = '${accountId}' and SBQQ__Status__c not in('Rejected', 'Archived','Ordered','Canceled')`
        break;
      case 'case':  
       query = `select count(id)from case where AccountId = '${accountId}' and Status != 'Closed' and RecordType.Name = 'Order Support' ` ;
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
  
    let userModulesEnable = '';
  
    featuresToEnable.forEach(feature => {
      if (featureStrings[feature]) {
        userModulesEnable += featureStrings[feature];
      }
    });

    if (userModulesEnable.endsWith(';')) {
      userModulesEnable = userModulesEnable.slice(0, -1);
    }
  
    return userModulesEnable;
  }



}

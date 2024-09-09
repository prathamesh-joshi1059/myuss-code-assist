import { Account } from '../../../model/Account';

export class SfdcAccountService {
  public prospectRecordTypeName = 'Prospect';
  public accountRecordTypeIdProspect: string;
  private mockAccountsList: Account[] = [];

  constructor() {
    this.setupMockData();
  }

  async getAccounts(): Promise<Account[]> {
    return this.mockAccountsList;
  }

  async getAccountByName(crm_companyname: string): Promise<Account | null> {
    return this.mockAccountsList.find((acct) => acct.Name === crm_companyname) || null;
  }

  // TODO: Add more mock data as needed, make it more sophisticated
  private setupMockData(): void {
    const account1 = new Account();
    account1.Id = 'account1id';
    account1.Name = 'account1';
    account1.PP_Email__c = 'myusstest@fakemail.com';
    this.mockAccountsList.push(account1);
  }
}
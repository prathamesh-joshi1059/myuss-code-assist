import { Account } from "./Account";

export class Purchase_Order__c {
  Id: string;
  Name: string;
  Account__c: string;
  Amount__c: number;
  Expiration_Date__c: Date;
  Account: Account;

  constructor() {
    this.Id = '';
  }
}
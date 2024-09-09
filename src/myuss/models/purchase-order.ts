export class PurchaseOrder {
  id: string;
  name: string;
  accountId: string;
  amount: number;
  expirationDate: Date;

  constructor(accountId?: string) {
    this.accountId = accountId || '';
  }
}
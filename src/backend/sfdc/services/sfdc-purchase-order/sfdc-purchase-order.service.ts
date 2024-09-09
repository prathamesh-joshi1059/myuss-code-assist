import { Injectable } from '@nestjs/common';
import { SfdcBaseService } from '../sfdc-base/sfdc-base.service';
import { Purchase_Order__c } from '../../model/Purchase_Order__c';
import { CreateDto_Purchase_Order__c } from './dto/create-Purchase_Order__c.dto';

@Injectable()
export class SfdcPurchaseOrderService {
  constructor(private salesforceBaseService: SfdcBaseService) {}

  async getPurchaseOrders(): Promise<Purchase_Order__c[]> {
    const soql = `SELECT Id, Name, Account__c, Amount__c, Expiration_Date__c FROM Purchase_Order__c`;
    const purchaseOrders = await this.salesforceBaseService.getQuery(soql);
    return purchaseOrders;
  }

  async getPurchaseOrderById(id: string): Promise<Purchase_Order__c> {
    const soql = `SELECT Id, Name, Account__c, Amount__c, Expiration_Date__c FROM Purchase_Order__c WHERE Id = '${id}'`;
    const purchaseOrder = await this.salesforceBaseService.getQuery(soql);
    return purchaseOrder;
  }

  async getPurchaseOrdersByAccountId(accountId: string): Promise<Purchase_Order__c[]> {
    const soql = `SELECT Id, Name, Account__c, Amount__c, Expiration_Date__c FROM Purchase_Order__c WHERE Account__c = '${accountId}'`;
    const purchaseOrders = await this.salesforceBaseService.getQuery(soql);
    return purchaseOrders;
  }

  async createPurchaseOrder(purchaseOrder: CreateDto_Purchase_Order__c): Promise<Purchase_Order__c> {
    const createdPurchaseOrder = await this.salesforceBaseService.createSObject('Purchase_Order__c', purchaseOrder);
    const po = new Purchase_Order__c();
    Object.assign(po, createdPurchaseOrder);
    return po;
    // TODO: handle errors
  }
}
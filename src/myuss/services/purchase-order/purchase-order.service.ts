import { Injectable } from '@nestjs/common';
import { SfdcPurchaseOrderService } from '../../../backend/sfdc/services/sfdc-purchase-order/sfdc-purchase-order.service';
import { PurchaseOrder } from '../../models/purchase-order';
import { Purchase_Order__c } from '../../../backend/sfdc/model/Purchase_Order__c';
import { CreatePurchaseOrderDto } from '../../controllers/accounts/dto/create-purchase-order.dto';
import { CreateDto_Purchase_Order__c } from '../../../backend/sfdc/services/sfdc-purchase-order/dto/create-Purchase_Order__c.dto'

@Injectable()
export class PurchaseOrderService {

  constructor(private sfdcPurchaseOrderService: SfdcPurchaseOrderService) {}

  async getPurchaseOrders() {
    const purchaseOrders = await this.sfdcPurchaseOrderService.getPurchaseOrders();
    return purchaseOrders;
  }

  async createPurchaseOrder(purchaseOrder: CreatePurchaseOrderDto): Promise<PurchaseOrder> {
    const sfdcPurchaseOrder = this.mapCreatePurchaseOrderDtoToCreateDto_Purchase_Order__c(purchaseOrder);
    const createdSfdcPurchaseOrder = await this.sfdcPurchaseOrderService.createPurchaseOrder(sfdcPurchaseOrder);
    const createdPurchaseOrder = this.mapSfdcPurchase_Order__cToPurchaseOrder(createdSfdcPurchaseOrder);
    return createdPurchaseOrder;
  }

  private mapPurchaseOrderToSfdcPurchase_Order__c(purchaseOrder: PurchaseOrder): Purchase_Order__c {
    let sfdcPurchaseOrder = new Purchase_Order__c();
    sfdcPurchaseOrder.Name = purchaseOrder.name;
    sfdcPurchaseOrder.Account__c = purchaseOrder.accountId;
    sfdcPurchaseOrder.Amount__c = purchaseOrder.amount;
    sfdcPurchaseOrder.Expiration_Date__c = purchaseOrder.expirationDate;
    return sfdcPurchaseOrder;
  }

  private mapCreatePurchaseOrderDtoToCreateDto_Purchase_Order__c(purchaseOrder: CreatePurchaseOrderDto): CreateDto_Purchase_Order__c {
    let createDto_Purchase_Order__c = new CreateDto_Purchase_Order__c();
    createDto_Purchase_Order__c.Name = purchaseOrder.name;
    createDto_Purchase_Order__c.Account__c = purchaseOrder.accountId;
    createDto_Purchase_Order__c.Amount__c = purchaseOrder.amount;
    createDto_Purchase_Order__c.Expiration_Date__c = purchaseOrder.expirationDate;
    return createDto_Purchase_Order__c;
  }

  private mapSfdcPurchase_Order__cToPurchaseOrder(sfdcPurchaseOrder: Purchase_Order__c): PurchaseOrder {
    let purchaseOrder = new PurchaseOrder();
    purchaseOrder.id = sfdcPurchaseOrder.Id;
    purchaseOrder.name = sfdcPurchaseOrder.Name;
    purchaseOrder.accountId = sfdcPurchaseOrder.Account__c;
    purchaseOrder.amount = sfdcPurchaseOrder.Amount__c;
    purchaseOrder.expirationDate = sfdcPurchaseOrder.Expiration_Date__c;
    return purchaseOrder;
  }
}

import { Purchase_Order__c } from "../../../backend/sfdc/model/Purchase_Order__c";
import { PurchaseOrder } from "../../../myuss/models";

export class SFDC_PurchaseOrderMapper {
    public static getMyUSSPurchaseOrderFromSFDCPurchaseOrder(purchaseOrderDetails : Purchase_Order__c):PurchaseOrder {
        const poDetails = new PurchaseOrder()
        poDetails.id = purchaseOrderDetails.Id
        poDetails.name = purchaseOrderDetails.Name
        poDetails.accountId = purchaseOrderDetails.Account__c
        poDetails.amount = purchaseOrderDetails.Amount__c
        poDetails.expirationDate = purchaseOrderDetails.Expiration_Date__c
        return poDetails
    }
}
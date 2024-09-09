import { Portal_Action__c } from "../../../backend/sfdc/model/Portal_Action__c";
import { PortalActionModel } from "../../../myuss/models/user-event.model";


export class SFDC_UserEventMapper {
    public static getSFDCPortalActionsFromMyUSSPortalActions(portalActionModel: PortalActionModel): Portal_Action__c {
      const portalAction =  new Portal_Action__c();
      portalAction.Screen_Name__c = portalActionModel.name;
      portalAction.Account__c = portalActionModel.accountId;
      portalAction.USS_Portal_User__c = portalActionModel.ussPortalUserId;
      portalAction.User_Action__c = portalActionModel.userAction;
      portalAction.Contact__c = portalActionModel.contactId;
      portalAction.Quote__c = portalActionModel.quoteId;
      portalAction.USS_Order__c = portalActionModel.ussOrderId;

      return portalAction;
    } 
  }
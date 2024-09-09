import { Injectable } from '@nestjs/common';
import { SfdcBaseService } from '../sfdc-base/sfdc-base.service';
import { LoggerService } from '../../../../core/logger/logger.service';
import { Portal_Action__c } from '../../model/Portal_Action__c';

@Injectable()
export class SfdcPortalActionService {
  constructor(private sfdcBaseService: SfdcBaseService, private logger: LoggerService) {}


  public async setPortalActions(portalAction: Portal_Action__c){
    this.sfdcBaseService.createSObject('Portal_Action__c',portalAction);
  }

  public async fetchContactAndUssPortalUser(auth0Id: string,accountId:string): Promise<Object> {
    const soql = `select ContactId, AccountId, Contact.USS_Portal_User__c from AccountContactRelation  where 
    AccountId = '${accountId}'  and Contact.USS_Portal_User__r.Auth0_Id__c = '${auth0Id}'`;
    const userData = await this.sfdcBaseService.getQuery(soql);
    return {
      contactId: userData.records[0].ContactId,
      ussPortalUserId: userData.records[0].Contact.USS_Portal_User__c,
      accountId: userData.records[0].AccountId
    }
  }
 
}

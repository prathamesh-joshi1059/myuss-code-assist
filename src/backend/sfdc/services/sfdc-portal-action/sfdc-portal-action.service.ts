import { Injectable } from '@nestjs/common';
import { SfdcBaseService } from '../sfdc-base/sfdc-base.service';
import { LoggerService } from '../../../../core/logger/logger.service';
import { Portal_Action__c } from '../../model/Portal_Action__c';

@Injectable()
export class SfdcPortalActionService {
  constructor(
    private readonly sfdcBaseService: SfdcBaseService,
    private readonly logger: LoggerService
  ) {}

  public async setPortalActions(portalAction: Portal_Action__c): Promise<void> {
    await this.sfdcBaseService.createSObject('Portal_Action__c', portalAction);
  }

  public async fetchContactAndUssPortalUser(
    auth0Id: string,
    accountId: string
  ): Promise<{ contactId: string; ussPortalUserId: string; accountId: string }> {
    const soql = `SELECT ContactId, AccountId, Contact.USS_Portal_User__c FROM AccountContactRelation WHERE 
    AccountId = '${accountId}' AND Contact.USS_Portal_User__r.Auth0_Id__c = '${auth0Id}'`;
    const userData = await this.sfdcBaseService.getQuery(soql);
    return {
      contactId: userData.records[0].ContactId,
      ussPortalUserId: userData.records[0].Contact.USS_Portal_User__c,
      accountId: userData.records[0].AccountId,
    };
  }
}
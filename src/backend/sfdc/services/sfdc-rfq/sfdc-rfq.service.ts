import { Injectable } from '@nestjs/common';
import { SfdcBaseService } from '../sfdc-base/sfdc-base.service';
import { CreateDto_Request_for_Quote__c } from './dto/CreateDto_Request_for_Quote__c';

@Injectable()
export class SfdcRFQService {
  constructor(private sfdcBaseService: SfdcBaseService) {}

  async getRFQ(id: string): Promise<object> {
    return this.sfdcBaseService.getSObjectById('Request_for_Quote__c', id);
  }

  async getRFQbyGUID(rfq_id: string): Promise<object | undefined> {
    const rfqs = await this.sfdcBaseService.getSObjectRecordsByField('Request_for_Quote__c', 'RFQ_ID__c', rfq_id);
    return rfqs.length > 0 ? rfqs[0] : undefined;
  }

  async createRFQ(rfq: CreateDto_Request_for_Quote__c): Promise<object> {
    return this.sfdcBaseService.createSObject('Request_for_Quote__c', rfq);
  }

  async updateRFQByGUID(rfq_id: string, rfq: CreateDto_Request_for_Quote__c): Promise<object> {
    return this.sfdcBaseService.updateSObjectByExternalId('Request_for_Quote__c', 'RFQ_ID__c', rfq);
  }
}
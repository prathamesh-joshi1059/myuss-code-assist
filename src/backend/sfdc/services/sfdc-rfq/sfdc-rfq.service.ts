import { Injectable } from '@nestjs/common';
import { SfdcBaseService } from '../sfdc-base/sfdc-base.service';
import { CreateDto_Request_for_Quote__c } from './dto/CreateDto_Request_for_Quote__c';

@Injectable()
export class SfdcRFQService {
  constructor(private sfdcBaseService: SfdcBaseService) {}

  async getRFQ(id: string) {
    const rfq = await this.sfdcBaseService.getSObjectById('Request_for_Quote__c', id);
    return rfq;
  }

  async getRFQbyGUID(rfq_id: string) {
    let rfq;
    const rfqs = await this.sfdcBaseService.getSObjectRecordsByField('Request_for_Quote__c', 'RFQ_ID__c', rfq_id);
    if (rfqs.length > 0) {
      rfq = rfqs[0];
    }
    return rfq;
  }

  async createRFQ(rfq: CreateDto_Request_for_Quote__c): Promise<object> {
    const rfqId = await this.sfdcBaseService.createSObject(
      'Request_for_Quote__c',
      rfq,
    );
    return rfqId;
  }

  async updateRFQByGUID(rfq_id: string, rfq: CreateDto_Request_for_Quote__c): Promise<object> {
    let rfqId;
    rfqId = await this.sfdcBaseService.updateSObjectByExternalId(
      'Request_for_Quote__c',
      'RFQ_ID__c',
      rfq,
    );
    return rfqId;
  }
}

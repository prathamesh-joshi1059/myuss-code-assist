import { Injectable } from '@nestjs/common';
import { SfdcBaseService } from '../sfdc-base/sfdc-base.service';
import { Lead } from '../../model/Lead';
import { LoggerService } from '../../../../core/logger/logger.service';
import { RecordResult } from '../../model/RecordResult';

@Injectable()
export class SfdcLeadService {
  constructor(private sfdcBaseService: SfdcBaseService, private logger: LoggerService) {}

  public async createOrUpdateLead(lead: Lead): Promise<string> {
    let resp = await this.getLeadByEmail(lead.Email);
    let leadId = '';
    if (resp) {
      leadId = resp.Id;
      lead.Id = leadId;
      // do the update async
      this.updateLead(lead)
        .then((resp) => {
          this.logger.info('Lead updated', resp);
        })
        .catch((err) => {
          this.logger.error('Lead update failed', err);
        });
    } else {
      const createdLead = await this.createLead(lead);
      leadId = createdLead['id'];
    }
    return leadId;
  }

  public async createLead(lead: Lead): Promise<string> {
    this.logger.info(`creating lead: ${JSON.stringify(lead)}`);
    return await this.sfdcBaseService.createSObject('Lead', lead);
  }

  public async updateLead(lead: Lead): Promise<RecordResult> {
    return await this.sfdcBaseService.updateSObject('Lead', lead);
  }

  public async getLeadByEmail(email: string): Promise<Lead> {
    // Exclude converted and disqualified leads and return the most recently modified
    const query = `SELECT Id, Email FROM Lead WHERE Email = '${email}' AND IsDeleted = false AND Status NOT IN ('Converted', 'Disqualified') ORDER BY LastModifiedDate DESC LIMIT 1`;
    const resp = await this.sfdcBaseService.getQuery(query);
    if (resp && resp.records && resp.records.length > 0) {
      return resp.records[0] as Lead;
    } else {
      return null;
    }
  }
}

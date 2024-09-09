import { Injectable } from '@nestjs/common';
import { SfdcBaseService } from '../sfdc-base/sfdc-base.service';
import { Campaign, CampaignMember } from '../../model/Campaign';
import { LoggerService } from '../../../../core/logger/logger.service';

@Injectable()
export class SfdcCampaignService {
  constructor(private sfdcBaseService: SfdcBaseService,
    private logger: LoggerService
    ) {}

  public async getCampaignByName(name: string): Promise<Campaign> {
    const resp = await this.sfdcBaseService.getSObjectRecordsByField('Campaign', 'Name', name);
    if (resp && resp.records && resp.records.length > 0) {
      return resp.records[0] as Campaign;
    } else {
      return null;
    }
  }

  public async getCampaignsByName(names: string[]): Promise<Campaign[]> {
    // make safe for SOQL
    names = names.map((name) => name.replace(/'/g, "\\'"));
    const query = `SELECT Id, Name, IsActive FROM Campaign WHERE Name IN ('${names.join("','")}')`;
    const resp = await this.sfdcBaseService.getQuery(query);
    if (resp && resp.records && resp.records.length > 0) {
      return resp.records as Campaign[];
    } else {
      return [];
    }
  }

  public async getCampaignMembersByCampaignId(campaignId: string): Promise<CampaignMember[]> {
    const campaignMembers = await this.sfdcBaseService.conn.sobject('CampaignMember')
    .select(`Id, CampaignId, LeadId, ContactId`)
    .where({ CampaignId: campaignId })
    .execute();
    return campaignMembers as CampaignMember[];
  }

  public async deleteCampaignMemberByCampaignIdAndLeadId(campaignId: string, leadId: string): Promise<any> {
    const cm = await this.getCampaignMemberByCampaignIdAndLeadId(campaignId, leadId);
    if (cm) {
      const resp = await this.sfdcBaseService.deleteSObject('CampaignMember', cm.Id);
      return resp;
    } else {
      return `No CampaignMember found for CampaignId: ${campaignId} and LeadId: ${leadId}`;
    }
  }

  public async deleteCampaignMemberById(id: string): Promise<any> {
    const resp = await this.sfdcBaseService.deleteSObject('CampaignMember', id);
    return resp;
  }

  public async getCampaignMemberByCampaignIdAndLeadId(campaignId: string, leadId: string): Promise<CampaignMember> {
    const campaignMembers = await this.sfdcBaseService.conn.sobject('CampaignMember')
    .select(`Id, CampaignId, LeadId, ContactId`)
    .where({ CampaignId: campaignId, LeadId: leadId })
    .limit(1)
    .execute();
    this.logger.info('campaignMembers', campaignMembers);
    if (campaignMembers && campaignMembers.length > 0) {
      const cm = new CampaignMember();
      cm.Id = campaignMembers[0].Id;
      cm.CampaignId = campaignMembers[0].CampaignId;
      cm.LeadId = campaignMembers[0].LeadId;
      cm.ContactId = campaignMembers[0].ContactId;
      return cm;
    } else {
      return null;
    }
  }
}

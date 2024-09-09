import { Injectable } from '@nestjs/common';
import { SfdcBaseService } from '../sfdc-base/sfdc-base.service';
import { Campaign, CampaignMember } from '../../model/Campaign';
import { LoggerService } from '../../../../core/logger/logger.service';

@Injectable()
export class SfdcCampaignService {
  constructor(
    private readonly sfdcBaseService: SfdcBaseService,
    private readonly logger: LoggerService
  ) {}

  public async getCampaignByName(name: string): Promise<Campaign | null> {
    const resp = await this.sfdcBaseService.getSObjectRecordsByField('Campaign', 'Name', name);
    return resp?.records?.[0] as Campaign | null;
  }

  public async getCampaignsByName(names: string[]): Promise<Campaign[]> {
    // make safe for SOQL
    const sanitizedNames = names.map((name) => name.replace(/'/g, "\\'"));
    const query = `SELECT Id, Name, IsActive FROM Campaign WHERE Name IN ('${sanitizedNames.join("','")}')`;
    const resp = await this.sfdcBaseService.getQuery(query);
    return resp?.records as Campaign[] || [];
  }

  public async getCampaignMembersByCampaignId(campaignId: string): Promise<CampaignMember[]> {
    const campaignMembers = await this.sfdcBaseService.conn
      .sobject('CampaignMember')
      .select(`Id, CampaignId, LeadId, ContactId`)
      .where({ CampaignId: campaignId })
      .execute();
    return campaignMembers as CampaignMember[];
  }

  public async deleteCampaignMemberByCampaignIdAndLeadId(campaignId: string, leadId: string): Promise<string | any> {
    const cm = await this.getCampaignMemberByCampaignIdAndLeadId(campaignId, leadId);
    if (cm) {
      return await this.sfdcBaseService.deleteSObject('CampaignMember', cm.Id);
    } 
    return `No CampaignMember found for CampaignId: ${campaignId} and LeadId: ${leadId}`;
  }

  public async deleteCampaignMemberById(id: string): Promise<any> {
    return await this.sfdcBaseService.deleteSObject('CampaignMember', id);
  }

  public async getCampaignMemberByCampaignIdAndLeadId(campaignId: string, leadId: string): Promise<CampaignMember | null> {
    const campaignMembers = await this.sfdcBaseService.conn
      .sobject('CampaignMember')
      .select(`Id, CampaignId, LeadId, ContactId`)
      .where({ CampaignId: campaignId, LeadId: leadId })
      .limit(1)
      .execute();
      
    this.logger.info('campaignMembers', campaignMembers);
    
    if (campaignMembers?.length) {
      return {
        Id: campaignMembers[0].Id,
        CampaignId: campaignMembers[0].CampaignId,
        LeadId: campaignMembers[0].LeadId,
        ContactId: campaignMembers[0].ContactId,
      } as CampaignMember;
    }
    return null;
  }
}
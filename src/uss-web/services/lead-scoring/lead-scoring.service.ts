import { Injectable } from '@nestjs/common';
import { SfdcCampaignService } from '../../../backend/sfdc/services/sfdc-campaign/sfdc-campaign.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { Campaign } from '../../../backend/sfdc/model/Campaign';
import { RequestForQuote } from '../../models/request-for-quote.model';
import { LeadScoringAlgorithm } from './lead-scoring-algorithm';
import { CacheService } from '../../../core/cache/cache.service';

@Injectable()
export class LeadScoringService {
  private priorityCampaigns = [
    'Web RFQ Leads - Priority 1',
    'Web RFQ Leads - Priority 2',
  ];
  private priority1campaignId = '';
  private priority2campaignId = '';
  private campaignsLoaded = false;

  constructor(
    private logger: LoggerService,
    private sfdcCampaignService: SfdcCampaignService,
    private cacheService: CacheService,
  ) {}

  // making async in case we move to an external service
  async calculateProbabiltyAndPriority(rfq: RequestForQuote): Promise<{priority: number, winProbability: number}> {
    const algorithmResp = await LeadScoringAlgorithm.calculateProbabiltyAndPriority(rfq);
    return algorithmResp;
  }

  async getPriorityCampaignForRFQ(rfq: RequestForQuote): Promise<string> {
    // get campaigns if not loaded
    if (!this.campaignsLoaded || this.priority1campaignId === '' || this.priority2campaignId === '') {
      await this.getCampaignsForScoring();
    }
    // get priority/probability
    let resp = await this.calculateProbabiltyAndPriority(rfq);
    let priority = resp.priority;
    // get campaign id
    let campaignId = '';
    if (priority === 1) {
      campaignId = this.priority1campaignId;
    } else if (priority === 2) {
      campaignId = this.priority2campaignId;
    }
    
    return campaignId
  }

  public async deleteIrrelevantCampaignMembers(leadId: string, priorityGroup: string): Promise<any> {
    if (!this.campaignsLoaded || this.priority1campaignId === '' || this.priority2campaignId === '') {
      await this.getCampaignsForScoring();
    }
    let campaignIdToDelete = '';
    if (priorityGroup === '1') {
      campaignIdToDelete = this.priority2campaignId;
    } else if (priorityGroup === '2') {
      campaignIdToDelete = this.priority1campaignId;
    } else {
      this.logger.error('Invalid priority group', priorityGroup);
      return;
    }
    const resp = await this.sfdcCampaignService.deleteCampaignMemberByCampaignIdAndLeadId(campaignIdToDelete, leadId);
    return resp;    
  }

  async getCampaignsForScoring() {
    // check cache
    let campaigns: Campaign[] = [];
    const cachedCampaigns = await this.cacheService.get<Campaign[]>('lead-scoring-campaigns');
    if (!cachedCampaigns || cachedCampaigns.length === 0) {
      campaigns = await this.sfdcCampaignService.getCampaignsByName(
        this.priorityCampaigns,
      );
      this.cacheService.set('lead-scoring-campaigns', campaigns, 3600).then(
        (resp) => {this.logger.info('lead-scoring-campaigns cache set', resp);},
      );
    } else {
      campaigns = cachedCampaigns;
    }
    // assuming that names will sort by priority
    if (campaigns && campaigns.length >= 2) {
      campaigns?.sort((a, b) => a.Name?.localeCompare(b.Name));
      this.priority1campaignId = campaigns[0]?.Id;
      this.priority2campaignId = campaigns[1]?.Id;
      this.campaignsLoaded = true;
    } else {
      this.logger.error('Unable to load campaigns for lead scoring');
      this.priority1campaignId = '';
      this.priority2campaignId = '';
      this.campaignsLoaded = false;
    }
  }
}

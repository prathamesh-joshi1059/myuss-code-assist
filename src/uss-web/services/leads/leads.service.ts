import { Injectable } from '@nestjs/common';
import { SfdcLeadService } from '../../../backend/sfdc/services/sfdc-lead/sfdc-lead.service';
import { RFQtoLeadMapper } from '../../mappers/salesforce/rfq-to-lead.mapper';
import { RequestForQuote } from '../../models/request-for-quote.model';
import { LeadScoringService } from '../lead-scoring/lead-scoring.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { GoogleMapsService } from '../../../backend/google/google-maps/google-maps.service';

@Injectable()
export class LeadsService {
  constructor(
    private readonly sfdcLeadsService: SfdcLeadService,
    private readonly leadScoringService: LeadScoringService,
    private readonly googleMapsService: GoogleMapsService,
    private readonly logger: LoggerService,
  ) {}

  public async createOrUpdateLeadForRfq(rfq: RequestForQuote): Promise<string | undefined> {
    // map the RFQ to a Lead
    const lead = RFQtoLeadMapper.mapRFQtoSFDCLead(rfq);
    
    // add the state to the Lead
    const state = await this.googleMapsService.getStateNameByZip(lead.PostalCode);
    lead.State = state?.substring(0, 80);

    // get the priority campaign for the RFQ
    this.logger.info('Getting priority campaign for started', new Date());
    try {
      lead.USF_Campaign__c = await this.leadScoringService.getPriorityCampaignForRFQ(rfq);
    } catch (error) {
      this.logger.error('Error getting priority campaign', error);
    }
    this.logger.info('Getting priority campaign for finished', new Date());

    // create or update the Lead
    let createdLeadId: string | undefined;
    try {
      createdLeadId = await this.sfdcLeadsService.createOrUpdateLead(lead);
      this.logger.info('Lead created or updated', createdLeadId);
    } catch (error) {
      this.logger.error('Error creating or updating lead', error);
    }

    return createdLeadId;
  }
}
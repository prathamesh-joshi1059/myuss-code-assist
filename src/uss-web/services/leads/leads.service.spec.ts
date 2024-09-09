import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../../core/logger/logger.service';

import { SfdcCampaignService } from '../../../backend/sfdc/services/sfdc-campaign/sfdc-campaign.service';
import { SfdcLeadService } from '../../../backend/sfdc/services/sfdc-lead/sfdc-lead.service';
import { SfdcBaseService } from '../../../backend/sfdc/services/sfdc-base/sfdc-base.service';

import { LeadsService } from './leads.service';
import { LeadScoringService } from '../lead-scoring/lead-scoring.service';
import { GoogleMapsService } from '../../../backend/google/google-maps/google-maps.service';
import { CacheService } from '../../../core/cache/cache.service';
// mocks
jest.mock('../../../backend/sfdc/services/sfdc-campaign/sfdc-campaign.service');
jest.mock('../../../backend/sfdc/services/sfdc-lead/sfdc-lead.service');
jest.mock('../../../backend/sfdc/services/sfdc-base/sfdc-base.service');
jest.mock('../lead-scoring/lead-scoring.service');
jest.mock('../../../backend/google/google-maps/google-maps.service');
jest.mock('../../../core/cache/cache.service');

describe('LeadsService', () => {
  let service: LeadsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeadsService,
        SfdcBaseService,
        SfdcLeadService,
        ConfigService,
        LoggerService,
        LeadScoringService,
        SfdcCampaignService,
        GoogleMapsService,
        CacheService,
      ],
    }).compile();

    service = module.get<LeadsService>(LeadsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

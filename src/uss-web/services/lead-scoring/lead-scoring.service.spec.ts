import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

import { LoggerService } from '../../../core/logger/logger.service';
import { CacheService } from '../../../core/cache/cache.service';

import { SfdcBaseService } from '../../../backend/sfdc/services/sfdc-base/sfdc-base.service';
import { SfdcCampaignService } from '../../../backend/sfdc/services/sfdc-campaign/sfdc-campaign.service';

import { LeadScoringService } from './lead-scoring.service';
// mocks
jest.mock('../../../backend/sfdc/services/sfdc-base/sfdc-base.service');
jest.mock('../../../backend/sfdc/services/sfdc-campaign/sfdc-campaign.service');
jest.mock('../../../core/cache/cache.service');

describe('LeadScoringService', () => {
  let service: LeadScoringService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeadScoringService,
        LoggerService,
        SfdcBaseService,
        SfdcCampaignService,
        ConfigService,
        CacheService,
      ],
    }).compile();

    service = module.get<LeadScoringService>(LeadScoringService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

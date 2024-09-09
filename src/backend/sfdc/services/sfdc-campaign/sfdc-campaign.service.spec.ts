import { Test, TestingModule } from '@nestjs/testing';
import { SfdcCampaignService } from './sfdc-campaign.service';
import { SfdcBaseService } from '../sfdc-base/sfdc-base.service';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../../../core/logger/logger.service';

describe('SfdcCampaignService', () => {
  let service: SfdcCampaignService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SfdcCampaignService, SfdcBaseService, ConfigService, LoggerService],
    }).compile();

    service = module.get<SfdcCampaignService>(SfdcCampaignService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

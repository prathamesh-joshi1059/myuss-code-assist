import { Test, TestingModule } from '@nestjs/testing';
import { SfdcLeadService } from './sfdc-lead.service';
import { SfdcBaseService } from '../sfdc-base/sfdc-base.service';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../../../core/logger/logger.service';

describe('SfdcLeadService', () => {
  let service: SfdcLeadService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SfdcLeadService, SfdcBaseService, ConfigService, LoggerService],
    }).compile();

    service = module.get<SfdcLeadService>(SfdcLeadService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

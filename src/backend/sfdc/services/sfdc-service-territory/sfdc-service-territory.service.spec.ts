import { Test, TestingModule } from '@nestjs/testing';
import { SfdcServiceTerritoryService } from './sfdc-service-territory.service';
import { SfdcBaseService } from '../sfdc-base/sfdc-base.service';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../../../core/logger/logger.service';

describe('SfdcServiceTerritoryService', () => {
  let service: SfdcServiceTerritoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SfdcServiceTerritoryService, 
        SfdcBaseService, 
        ConfigService,
        LoggerService,
      ],
    }).compile();

    service = module.get<SfdcServiceTerritoryService>(SfdcServiceTerritoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { CPQPriceRulesEngineService } from './cpq-price-rules-engine.service';
import { LoggerService } from '../../../../../core/logger/logger.service';
jest.mock('../../../../../core/logger/logger.service');
import { SfdcBaseService } from '../../sfdc-base/sfdc-base.service';
jest.mock('../../sfdc-base/sfdc-base.service');

describe('CpqPriceRulesEngineService', () => {
  let service: CPQPriceRulesEngineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SfdcBaseService,
        LoggerService,
        CPQPriceRulesEngineService
      ],
    }).compile();

    service = module.get<CPQPriceRulesEngineService>(CPQPriceRulesEngineService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

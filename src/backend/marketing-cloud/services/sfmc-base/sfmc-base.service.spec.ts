import { Test, TestingModule } from '@nestjs/testing';
import { SfmcBaseService } from './sfmc-base.service';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../../../core/logger/logger.service';
describe('SfmcBaseService', () => {
  let service: SfmcBaseService;

  // Mock Config Service
  let mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SfmcBaseService,
        LoggerService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<SfmcBaseService>(SfmcBaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

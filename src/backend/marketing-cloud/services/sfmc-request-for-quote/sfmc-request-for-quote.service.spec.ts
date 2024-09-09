import { Test, TestingModule } from '@nestjs/testing';
import { SfmcRequestForQuoteService } from './sfmc-request-for-quote.service';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../../../core/logger/logger.service';
import { SfmcBaseService } from '../sfmc-base/sfmc-base.service';

describe('SfmcRequestForQuoteService', () => {
  let service: SfmcRequestForQuoteService;
   // Mock Config Service
   let mockConfigService = {
    get: jest.fn(),
  };
  // Mock the SfdcBaseService
  let mockSfdcService = {
    login: jest.fn(),
    getQuery: jest.fn(),
    updateSObject: jest.fn(),
    getMetadata: jest.fn(),
    createSObject: jest.fn(),
    updateSObjectByExternalId: jest.fn(),
    getSObjectById: jest.fn(),
    getSObjectRecordsByField: jest.fn(),
    getSObjectByIds: jest.fn(),
    getApex: jest.fn(),
    patchApex: jest.fn(),
    getDocumentBodyJSF: jest.fn(),
    postApex: jest.fn(),
    getDocumentBody: jest.fn(),
  };

  // Mock Logger Service
  let mockLoggerService = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),

  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SfmcRequestForQuoteService,
        { provide: SfmcBaseService, useValue: mockSfdcService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: LoggerService, useValue: mockLoggerService }],
    }).compile();

    service = module.get<SfmcRequestForQuoteService>(
      SfmcRequestForQuoteService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

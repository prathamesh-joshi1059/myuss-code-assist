import { Test, TestingModule } from '@nestjs/testing';
import { SfdcProductService } from './sfdc-product.service';
import { SfdcBaseService } from '../sfdc-base/sfdc-base.service';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../../../core/logger/logger.service';

describe('SfdcProductService', () => {
  let service: SfdcProductService;

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
      providers: [
        SfdcProductService,
        { provide: SfdcBaseService, useValue: mockSfdcService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: LoggerService, useValue: mockLoggerService },
      ],
    }).compile();
    SfdcBaseService;

    service = module.get<SfdcProductService>(SfdcProductService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

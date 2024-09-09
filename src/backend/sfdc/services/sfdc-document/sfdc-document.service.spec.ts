import { Test, TestingModule } from '@nestjs/testing';
import { SfdcDocumentService } from './sfdc-document.service';
import { LoggerService } from '../../../../core/logger/logger.service';
import { ConfigService } from '@nestjs/config';
import { SfdcBaseService } from '../sfdc-base/sfdc-base.service';

describe('SfdcDocumentService', () => {
  let service: SfdcDocumentService;

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SfdcDocumentService,
        LoggerService,
        { provide: SfdcBaseService, useValue: mockSfdcService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<SfdcDocumentService>(SfdcDocumentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { SfdcMetadataService } from './sfdc-metadata.service';
import { ConfigService } from '@nestjs/config';

import { SfdcBaseService } from '../sfdc-base/sfdc-base.service';
import { LoggerService } from '../../../../core/logger/logger.service';

describe('SfdcMetadataService', () => {
  let service: SfdcMetadataService;

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

  let mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoggerService,
        SfdcMetadataService,
        {
          provide: SfdcBaseService,
          useValue: mockSfdcService,
        },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<SfdcMetadataService>(SfdcMetadataService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

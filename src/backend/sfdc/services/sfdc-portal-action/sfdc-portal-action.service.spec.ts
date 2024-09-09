import { Test, TestingModule } from '@nestjs/testing';
import { SfdcPortalActionService } from './sfdc-portal-action.service';
import { ConfigService } from '@nestjs/config';
import { SfdcBaseService } from '../sfdc-base/sfdc-base.service';

describe('SfdcPortalActionService', () => {
  let service: SfdcPortalActionService;

  // Mock SfdcBaseService
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

  // Mock Config Service

  let mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SfdcPortalActionService,
        { provide: SfdcBaseService, useValue: mockSfdcService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<SfdcPortalActionService>(SfdcPortalActionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

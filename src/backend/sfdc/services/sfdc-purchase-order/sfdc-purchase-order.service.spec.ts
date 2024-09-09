import { Test, TestingModule } from '@nestjs/testing';
import { SfdcPurchaseOrderService } from './sfdc-purchase-order.service';
import { SfdcBaseService } from '../sfdc-base/sfdc-base.service';
import { ConfigService } from '@nestjs/config';

describe('SfdcPurchaseOrderService', () => {
  let service: SfdcPurchaseOrderService;


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
        SfdcPurchaseOrderService,
        { provide: SfdcBaseService, useValue: mockSfdcService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<SfdcPurchaseOrderService>(SfdcPurchaseOrderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

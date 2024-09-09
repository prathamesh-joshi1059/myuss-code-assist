import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

import { LoggerService } from '../../../core/logger/logger.service';

import { SfdcPurchaseOrderService } from '../../../backend/sfdc/services/sfdc-purchase-order/sfdc-purchase-order.service';
import { SfdcBaseService } from '../../../backend/sfdc/services/sfdc-base/sfdc-base.service';

import { PurchaseOrderService } from './purchase-order.service';

describe('PurchaseOrderService', () => {
  let service: PurchaseOrderService;


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

  // Mock SfdcPurchaseOrderService
  let mockSfdcPurchaseOrderService = {
    getPurchaseOrders: jest.fn(),
    getPurchaseOrderById: jest.fn(),
    getPurchaseOrdersByAccountId: jest.fn(),
    createPurchaseOrder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseOrderService,
       {provide: ConfigService, useValue: mockConfigService},
       {provide:SfdcBaseService, useValue: mockSfdcService},
       {provide:SfdcPurchaseOrderService, useValue: mockSfdcPurchaseOrderService},
      ],
    }).compile();

    service = module.get<PurchaseOrderService>(PurchaseOrderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

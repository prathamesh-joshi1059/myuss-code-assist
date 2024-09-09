import { Test, TestingModule } from '@nestjs/testing';
import { SfdcContractService } from './sfdc-contract.service';
import { ConfigService } from '@nestjs/config';
import { SfdcBaseService } from '../sfdc-base/sfdc-base.service';
import { LoggerService } from '../../../../core/logger/logger.service';
import { PaymentMethodsService } from '../../../../myuss/services/payment/payment-methods.service';
import {StripeService} from "../../../../backend/stripe/services/stripe/stripe.service";
import { SfdcAccountService } from '../sfdc-account/sfdc-account.service';
import { TrackUserActionService } from '../../../../core/track-user-action/track-user-action-service';

describe('SfdcContractService', () => {
  let service: SfdcContractService;

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
        SfdcContractService,
        PaymentMethodsService,
        StripeService,
        SfdcAccountService,
        TrackUserActionService,
        { provide: SfdcBaseService, useValue: mockSfdcService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: LoggerService, useValue: mockLoggerService },
      ],
    }).compile();

    service = module.get<SfdcContractService>(SfdcContractService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { ConfigService } from '@nestjs/config';
import { SfdcBaseService } from '../../../backend/sfdc/services/sfdc-base/sfdc-base.service';
import { mock } from 'node:test';
 import { LoggerService } from '../../../core/logger/logger.service';
import { SfdcContractService } from '../../../backend/sfdc/services/sfdc-contract/sfdc-contract.service';
import { PaymentMethodsService } from '../payment/payment-methods.service';
import { StripeService } from '../../../backend/stripe/services/stripe/stripe.service';
import {NotificationReqDTO} from "../../controllers/notification/dto/notification-req.dto";

describe('NotificationService', () => {
  let service: NotificationService;

  //Mock Config Service
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

  // Mock SfdcContractService
  let mockSfdcContractService = {
    getContractDetails: jest.fn(),
    getContractByOrderIdAndZIP:jest.fn(),
    getContractDetailsSoql:jest.fn(),
    fetchContracts:jest.fn(),
    getActiveOrderCount:jest.fn(),
    fetchContractIds: jest.fn(),
    fetchNotification: jest.fn(),
  }

  // Mock Logger Service
  let mockLoggerService = {
    debug: jest.fn(),
    error: jest.fn(),
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  };


 


  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
    
        PaymentMethodsService,
        StripeService,
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
        {
          provide: SfdcContractService,
          useValue: mockSfdcContractService,
        },
        { provide: SfdcBaseService, useValue: mockSfdcService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();
       
       

    service = module.get<NotificationService>(NotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('Should return notification data as a array', async () => {
    // Arrange

    const request: NotificationReqDTO = {
      accountId: '0018I00000jIg0sQAC'
    } 

   
    

    const SfdcContractresponse = {
      
      records: [
        {
          QuoteNo: '509261',
          QuoteId: '0WO8I000000E2pZWAS',
          Status: 'Service',
          Date: '2023-02-01T05:01:00.000+0000',
          SiteAddress: {
            Street: 'test street 1',
            City: 'WESTBOROUGH',
            State: 'MA',
            Zip_Code: '01581',
            Position: {
              lat: 42.2665985,
              lng: -71.6167017,
            },
          },
        },
        {
          QuoteNo: '509261',
          QuoteId: '0WO8I000000E2paWAC',
          Status: 'Service',
          Date: '2023-02-04T05:01:00.000+0000',
          SiteAddress: {
            Street: 'test street 1',
            City: 'WESTBOROUGH',
            State: 'MA',
            Zip_Code: '01581',
            Position: {
              lat: 42.2665985,
              lng: -71.6167017,
            },
          },
        },
        {
          QuoteNo: '',
          QuoteId: '0WO8I000000VrPCWA0',
          Status: 'Service',
          Date: '2023-03-17T04:00:00.000+0000',
          SiteAddress: {
            Street: '',
            City: '',
            State: '',
            Zip_Code: '',
            Position: {
              lat: 0,
              lng: 0,
            },
          },
        },
      ],
    };

    // Act
    mockSfdcContractService.fetchNotification.mockReturnValue(SfdcContractresponse);
    const result = await service.fetchNotification(request.accountId);

    // Assert
    expect(result.message).toMatch('Success');
  });

  // Notification not found

  it('Should return notification not found', async () => {
    // Arrange

    const request: NotificationReqDTO = {
      accountId: '0018I00000jIg0sQAC'
    } 

    const SfdcContractresponse = {
      records: [],
    };

    // Act
    mockSfdcContractService.fetchNotification.mockReturnValue(SfdcContractresponse);
    const result = await service.fetchNotification(request.accountId);

    // Assert
    expect(result.message).toMatch('Data not found');
  }
  );

 
});

import { Test, TestingModule } from '@nestjs/testing';
import { ContractController } from './contract.controller';
import { ContractService } from '../../services/contract/contract.service';
import { SfdcContractService } from '../../../backend/sfdc/services/sfdc-contract/sfdc-contract.service';
import { ConfigService } from '@nestjs/config';
import { SfdcBaseService } from '../../../backend/sfdc/services/sfdc-base/sfdc-base.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { CacheService } from '../../../core/cache/cache.service';
import {Auth0MyUSSAPIService} from "../../../backend/auth0/services/auth0-myuss-api/auth0-myuss-api.service";
import { UserService } from '../../../myuss/services/user/user.service';
import { StripeService } from '../../../backend/stripe/services/stripe/stripe.service';
import { PaymentMethodsService } from '../../services/payment/payment-methods.service';
import { HttpService } from '@nestjs/axios';
import { SfdcUssPortalUserService } from '../../../backend/sfdc/services/sfdc-uss-portal-user/sfdc-uss-portal-user.service';
import { SfdcQuoteService } from '../../../backend/sfdc/services/sfdc-quote/sfdc-quote.service';
import { SfdcDocumentService } from '../../../backend/sfdc/services/sfdc-document/sfdc-document.service';
import { SfdcAccountService } from '../../../backend/sfdc/services/sfdc-account/sfdc-account.service';
import {GetContractDetailsDto, ContractQueryReqDto} from "../contract/dto/contract-req.dto";
import { Auth0ManagementAPIService } from '../../../backend/auth0/services/auth0-management-api/auth0-management-api.service';

describe('ContractController', () => {
  let controller: ContractController;

  let mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
  }

  let mockContractService = {
    getContractDetails: jest.fn(),
    fetchContracts: jest.fn(),
    getActiveOrderCount: jest.fn(),
  };

  let mockPaymentMethodsService = {
    getStripeCustomer: jest.fn(),
    createStripeCustomer: jest.fn(),
    getPaymentMethods: jest.fn(),
    getPaymentDetails: jest.fn(),
    createSetupIntent: jest.fn(),
  };

   // Mock the SfdcContractService
   let mockSfdcContractService = {
    getContractDetails: jest.fn(),
    getContractDetailsSoql: jest.fn(),
    fetchContracts: jest.fn(),
    getActiveOrderCount: jest.fn(),
    fetchContractIds: jest.fn(),
    fetchNotification: jest.fn(),
    getContractByOrderIdAndZIP: jest.fn(),
    getAssetLocations: jest.fn(),
  };

  let mockUserService = {
    getContacts:jest.fn(),
    getAddresses:jest.fn(),
    fetchUsersDetails:jest.fn(),
    hasAccessToAccountold:jest.fn(),
    fetchDrafts:jest.fn(),
    fetchArchivedDrafts:jest.fn(),
    fetchSuspendedDrafts:jest.fn(),
    fetchProfile:jest.fn(),
    createUser:jest.fn(),
    updateUser:jest.fn(),
    updateCache:jest.fn(),
    hasAccessToAccount:jest.fn(),

  }

  
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContractController],
      providers: [
        SfdcBaseService,
        ConfigService,
        LoggerService,
        Auth0MyUSSAPIService,
        Auth0ManagementAPIService,
        {
            provide: ContractService,
            useValue: mockContractService,
        },
        
        StripeService,
        {
            provide:UserService,
            useValue:mockUserService
        },
       {
            provide: PaymentMethodsService,
            useValue: mockPaymentMethodsService,
       },
       {
        provide: SfdcContractService,
        useValue: mockSfdcContractService,
       },
        HttpService,
        SfdcUssPortalUserService,
        SfdcQuoteService,
        SfdcDocumentService,
        SfdcAccountService,
       
        { provide: 'AXIOS_INSTANCE_TOKEN', useValue: {} },
        { provide: CacheService, useValue: mockCacheService },

      ],
    }).compile();

    controller = module.get<ContractController>(ContractController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
  
 
  
  
});

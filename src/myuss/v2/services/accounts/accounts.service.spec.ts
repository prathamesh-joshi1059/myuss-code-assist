import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../../../core/logger/logger.service';
import { CacheService } from '../../../../core/cache/cache.service';
jest.mock('../../../../core/cache/cache.service');
import { SfdcDocumentService } from '../../../../backend/sfdc/services/sfdc-document/sfdc-document.service';
import { HttpService } from '@nestjs/axios';
import { PaymentMethodsService } from '../../../../myuss/services/payment/payment-methods.service';
import { StripeService } from '../../../../backend/stripe/services/stripe/stripe.service';
import { Auth0UserService } from '../../../../backend/auth0/services/auth0-user/auth0-user.service';
import { Auth0ManagementAPIService } from '../../../../backend/auth0/services/auth0-management-api/auth0-management-api.service';
import { UserService } from '../../../../myuss/services/user/user.service';
import { FirestoreService } from '../../../../backend/google/firestore/firestore.service';
import { TrackUserActionService } from '../../../../core/track-user-action/track-user-action-service';
import { AccountsServiceV2 } from './accounts.service';

describe('AccountsServiceV2', () => {
  let service: AccountsServiceV2;

  // Mock SfdcDocument Service
  let mockSfdcDocumentService = {
    getDocument: jest.fn(),
    getDocumentBody: jest.fn(),
  };

  // Mock Config Service
  let mockConfigService = {
    get: jest.fn(),
  };

  // Mock Logger Service
  let mockLoggerService = {
    log: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  };

  // Mock Http Service
  let mockHttpService = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
    head: jest.fn(),
    request: jest.fn(),
  };
  // mock SfdcQuoteService
  let mockSfdcQuoteService = {
    fetchDraftsV2: jest.fn()
  };
  const mockSnapshot = {
    data: jest.fn(() => ({ yourMockedData: 'example' })),
  };
  // const mockQuotesDocsFromFirestore = [mockSnapshot, mockSnapshot];
  //Mock Firestore Service
  let mockFirestoreService = {
    getCollection: jest.fn(),
    getCollectionDocs: jest.fn(),
    getCollectionDocsByFieldName: jest.fn(),
    getDocument: jest.fn(),
    createDocument: jest.fn(),
    updateDocument: jest.fn(),
    deleteDocument: jest.fn(),
    upsertDocument: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        AccountsServiceV2,
        CacheService,
        PaymentMethodsService,
        StripeService,
        TrackUserActionService,
        Auth0UserService,
        Auth0ManagementAPIService,
        {
          provide: FirestoreService,
          useValue: mockFirestoreService,
        },
        { provide: SfdcDocumentService, useValue: mockSfdcDocumentService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: HttpService, useValue: mockHttpService },
        { provide: 'AXIOS_INSTANCE_TOKEN', useValue: {} },
      ],
    }).compile();

    service = module.get<AccountsServiceV2>(AccountsServiceV2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  //fetch draft updated unit tests - success
   it('Should return drfats ', async () => {
    //Arrange
    const serviceResponse = {
      status: 1000,
      message: "Success",
      data: {
        unitServicesStep1: [
        ],
        viewQuoteStep2: [
        ],
        siteDetailsStep3: [
          {
            projectDetails: null,
            firestorePaymentMethodId: "",
            isAutoPay: true,
            id: "a6OVA0000005KkT2AU",
            lastModifiedDate: "2024-07-18T12:52:28.000+0000",
            name: "Q-520556",
            shippingAddress: "1350 Northwest 14th Stree - Miami - FL",
            zipcode: "33125",
            billAddress: {
              lat: 0,
              lng: 0,
            },
            shipAddress: {
              lat: 25.78727,
              lng: -80.21777,
            },
            currentStatus: 3,
            status: "Approved",
            siteComplete: false,
            billingComplete: false,
            paymentMethodId: null,
            isCheckPaymentMethod: false,
            paymentMode: "creditDebit",
            source: "MyUSS",
          },
        ],
        billingPaymentDetailsStep4: [
          {
            projectDetails: null,
            firestorePaymentMethodId: "",
            isAutoPay: true,
            id: "a6OVA0000005KhF2AU",
            lastModifiedDate: "2024-07-18T12:51:03.000+0000",
            name: "Q-520554",
            shippingAddress: "1350 Northwest 14th Stree - Miami - FL",
            zipcode: "33125",
            billAddress: {
              lat: 0,
              lng: 0,
            },
            shipAddress: {
              lat: 25.78727,
              lng: -80.21777,
            },
            currentStatus: 4,
            status: "Approved",
            siteComplete: true,
            billingComplete: false,
            paymentMethodId: null,
            isCheckPaymentMethod: false,
            paymentMode: "creditDebit",
            source: "MyUSS",
          },
        ],
        orderConfirmStep5: [
        ],
        drafts: [
          {
            projectDetails: null,
            firestorePaymentMethodId: "",
            isAutoPay: true,
            id: "a6OVA0000005KkT2AU",
            lastModifiedDate: "2024-07-18T12:52:28.000+0000",
            name: "Q-520556",
            shippingAddress: "1350 Northwest 14th Stree - Miami - FL",
            zipcode: "33125",
            billAddress: {
              lat: 0,
              lng: 0,
            },
            shipAddress: {
              lat: 25.78727,
              lng: -80.21777,
            },
            currentStatus: 3,
            status: "Approved",
            siteComplete: false,
            billingComplete: false,
            paymentMethodId: null,
            isCheckPaymentMethod: false,
            paymentMode: "creditDebit",
            source: "MyUSS",
          },
          {
            projectDetails: null,
            firestorePaymentMethodId: "",
            isAutoPay: true,
            id: "a6OVA0000005KhF2AU",
            lastModifiedDate: "2024-07-18T12:51:03.000+0000",
            name: "Q-520554",
            shippingAddress: "1350 Northwest 14th Stree - Miami - FL",
            zipcode: "33125",
            billAddress: {
              lat: 0,
              lng: 0,
            },
            shipAddress: {
              lat: 25.78727,
              lng: -80.21777,
            },
            currentStatus: 4,
            status: "Approved",
            siteComplete: true,
            billingComplete: false,
            paymentMethodId: null,
            isCheckPaymentMethod: false,
            paymentMode: "creditDebit",
            source: "MyUSS",
          },
        ],
      },
    }
    const request = {
      userId: ['0018I00000k1WugQAE+000' + 12],
    };
    const SFDCQuoteServiceResp = [
      {
        attributes: {
          type: "SBQQ__Quote__c",
          url: "/services/data/v58.0/sobjects/SBQQ__Quote__c/a6OVA0000005KkT2AU",
        },
        Id: "a6OVA0000005KkT2AU",
        LastModifiedDate: "2024-07-18T12:52:28.000+0000",
        Name: "Q-520556",
        SBQQ__Status__c: "Approved",
        Shipping_Address__r: {
          attributes: {
            type: "USF_Address__c",
            url: "/services/data/v58.0/sobjects/USF_Address__c/a8xVA000000Upl3YAC",
          },
          Address_Latitude_Longitude__Latitude__s: 25.78727,
          Address_Latitude_Longitude__Longitude__s: -80.21777,
          Name: "1350 Northwest 14th Stree - Miami - FL",
        },
        Serviceable_Zip_Code__r: {
          attributes: {
            type: "Serviceable_Zip_Code__c",
            url: "/services/data/v58.0/sobjects/Serviceable_Zip_Code__c/a6yVA0000000E7bYAE",
          },
          Zip_Code__c: "33125",
        },
        Site_Complete__c: false,
        Billing_Complete__c: false,
        Payment_Method_Id__c: null,
        isCheckPaymentMethod__c: false,
        SBQQ__Ordered__c: false,
        CreatedBy: {
          attributes: {
            type: "User",
            url: "/services/data/v58.0/sobjects/User/0058I000002oBmXQAU",
          },
          Name: "MyUSS System User",
        },
        Bill_To_Address__r: null,
        Payment_Mode__c: "creditDebit",
        SBQQ__Opportunity2__c: "006VA000005ZrJVYA0",
        SBQQ__Opportunity2__r: {
          attributes: {
            type: "Opportunity",
            url: "/services/data/v58.0/sobjects/Opportunity/006VA000005ZrJVYA0",
          },
          USF_Project__r: null,
        },
      },
      {
        attributes: {
          type: "SBQQ__Quote__c",
          url: "/services/data/v58.0/sobjects/SBQQ__Quote__c/a6OVA0000005KhF2AU",
        },
        Id: "a6OVA0000005KhF2AU",
        LastModifiedDate: "2024-07-18T12:51:03.000+0000",
        Name: "Q-520554",
        SBQQ__Status__c: "Approved",
        Shipping_Address__r: {
          attributes: {
            type: "USF_Address__c",
            url: "/services/data/v58.0/sobjects/USF_Address__c/a8xVA000000Upl3YAC",
          },
          Address_Latitude_Longitude__Latitude__s: 25.78727,
          Address_Latitude_Longitude__Longitude__s: -80.21777,
          Name: "1350 Northwest 14th Stree - Miami - FL",
        },
        Serviceable_Zip_Code__r: {
          attributes: {
            type: "Serviceable_Zip_Code__c",
            url: "/services/data/v58.0/sobjects/Serviceable_Zip_Code__c/a6yVA0000000E7bYAE",
          },
          Zip_Code__c: "33125",
        },
        Site_Complete__c: true,
        Billing_Complete__c: false,
        Payment_Method_Id__c: null,
        isCheckPaymentMethod__c: false,
        SBQQ__Ordered__c: false,
        CreatedBy: {
          attributes: {
            type: "User",
            url: "/services/data/v58.0/sobjects/User/0058I000002oBmXQAU",
          },
          Name: "MyUSS System User",
        },
        Bill_To_Address__r: null,
        Payment_Mode__c: "creditDebit",
        SBQQ__Opportunity2__c: "006VA000005ZrD3YAK",
        SBQQ__Opportunity2__r: {
          attributes: {
            type: "Opportunity",
            url: "/services/data/v58.0/sobjects/Opportunity/006VA000005ZrD3YAK",
          },
          USF_Project__r: null,
        },
      },
    ]
    const FirestoreResp = null;
    (mockSfdcQuoteService.fetchDraftsV2 as jest.Mock).mockResolvedValueOnce(SFDCQuoteServiceResp);
    (mockFirestoreService.getCollectionDocsByFieldName as jest.Mock).mockResolvedValueOnce([]);

    const result = await service.fetchDraftsV2(['001VA000007nwekYAA'],'',status='');
    expect(result).toHaveProperty('status', 1000);
    expect(result).toHaveProperty('message', 'Success');
    expect(result.data).toEqual(serviceResponse.data);
  });
  //fetch draft updated unit tests - fails
  it('Should return error', async () => {
    const SfdcServiceResp = null;
    const FirestoreResp = null;
    const serviceResponse = { status: 1041, message: 'Error while fetching quotes',data : [] };
    mockSfdcQuoteService.fetchDraftsV2.mockResolvedValueOnce(SfdcServiceResp);
    mockFirestoreService.getCollectionDocsByFieldName.mockResolvedValueOnce(FirestoreResp);
    const result = await service.fetchDraftsV2(['001VA000007nwekYAA'],'',status='');

    expect(result.message).toBe('Error while fetching quotes');
    expect(result).toMatchObject(serviceResponse);
  });

});

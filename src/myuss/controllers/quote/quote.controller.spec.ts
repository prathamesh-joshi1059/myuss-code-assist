import { Test, TestingModule } from '@nestjs/testing';
import { QuoteController } from './quote.controller';
import { QuoteService } from '../../../myuss/services/quote/quote.service';
import { UserService } from '../../../myuss/services/user/user.service';
import { LoggerService } from '../../../core/logger/logger.service';
jest.mock('../../../core/logger/logger.service');
import { CacheService } from '../../../core/cache/cache.service';
jest.mock('../../../core/cache/cache.service');
import { SfdcBaseService } from '../../../backend/sfdc/services/sfdc-base/sfdc-base.service';
import { SfdcRFQService } from '../../../backend/sfdc/services/sfdc-rfq/sfdc-rfq.service';
import { Auth0MyUSSAPIService } from '../../../backend/auth0/services/auth0-myuss-api/auth0-myuss-api.service';
import { HttpService } from '@nestjs/axios';
import { CreateInitialQuoteReqDTO } from './dto/create-initial-quote-req.dto';
import { AddProductAndCalculateReqDTO } from './dto/add-product-calculate-req.dto';
import { ProductsService } from '../../../myuss/services/products/products.service';
import { SfdcServiceableZipCodeService } from '../../../backend/sfdc/services/sfdc-serviceable-zip-code/sfdc-serviceable-zip-code.service';
import { SfdcQuoteService } from '../../../backend/sfdc/services/sfdc-quote/sfdc-quote.service';
import { SiteDetailsReqDTO } from './dto/save-site-details-req-dto';
import { AddressDetailsDTO, BillingDetailsReqDTO } from './dto/save-billing-details-req-dto';
import { ConfirmQuoteReqDTO } from './dto/confirm-quote-req-dto';
import { AddressDTO, ContactDTO } from '../../../common/dto/address.req_res_dto';
import { AccountsService } from '../../../myuss/services/accounts/accounts.service';

describe('QuoteController', () => {
  let controller: QuoteController;

  let mockUserService = {
    getContacts: jest.fn(),
    getAddresses: jest.fn(),
    fetchProfile: jest.fn(),
    fetchQuotes: jest.fn(),
    getProducts: jest.fn(),
  };
  let mockQuoteService = {
    createInitialQuote: jest.fn(),
    addProductAndCalculate: jest.fn(),
    createAndSaveQuoteDocument: jest.fn(),
    getQuoteDocumentBody: jest.fn(),
    getQuoteDetails: jest.fn(),
    updateQuoteStatus: jest.fn(),
    saveSiteDetails: jest.fn(),
    saveBillingDetails: jest.fn(),
    confirmQuote: jest.fn(),
    getQuote: jest.fn(),
    saveUnitServicesDraft: jest.fn(),
    updateQuoteStatusDraft: jest.fn(),
    saveSiteDetailsDraft: jest.fn(),
    getBillingDetails: jest.fn(),
    addPaymentMethod: jest.fn(),
    getQuoteStatus: jest.fn(),
    createCartLevelQuoteLines: jest.fn(),
    createShortTermQuoteLineIfNeeded: jest.fn(),
    updateSiteDetails: jest.fn(),
    addProductAndSave: jest.fn(),
    handleCache: jest.fn(),
    getQuoteDetailsById: jest.fn(),
    updateBillingAddress: jest.fn(),
    approveQuote:jest.fn(),
  };
  let mockLoggerService = {
    get: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };
  let mockSfdcBaseService = {
    get: jest.fn(),
    getQuery: jest.fn(),
  };
  let mockSfdcRfqService = {
    getRFQ: jest.fn(),
    getRFQbyGUID: jest.fn(),
    createRFQ: jest.fn(),
    updateRFQByGUID: jest.fn(),
    updateSiteContact: jest.fn(),
  };
  let mockAuth0MachineToMachineService = {
    get: jest.fn(),
  };
  let mockHttpService = {
    get: jest.fn(),
    post: jest.fn(),
  };
  let mockProductsService = {
    getProducts: jest.fn(),
    getStandardPricebook: jest.fn(),
  };
  let mockSfdcServiceableZipCodeService = {
    checkServiceableZipcode: jest.fn(),
  };
  let mockSfdcQuoteService = {
    createQuote: jest.fn(),
    getQuoteStatus: jest.fn(),
    createOpportunity: jest.fn(),
    getQuoteLineIds: jest.fn(),
    deleteQuoteLinesByIds: jest.fn(),
    getQuoteDetails: jest.fn(),
    updateQuoteStatus: jest.fn(),
    updateSiteContact: jest.fn(),
    updateSiteAddress: jest.fn(),
    updateBillingAddress: jest.fn(),
    confirmQuote: jest.fn(),
  };
  let mockAccountService ={
    updateBillingAddress: jest.fn(),
    getAccount: jest.fn(),
    checkQuoteIdInAccount: jest.fn(),
    getContacts:  jest.fn(),
    checkDuplicateAddress: jest.fn(),
    fetchDrafts: jest.fn(),
    fetchArchivedDrafts: jest.fn(),
    fetchSuspendedDrafts: jest.fn(),
  }

  //mock Cache Service
  let mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    reset: jest.fn(),
    allKeys: jest.fn(),
  };

  //after code refactor step0 create initialquote
  let createInitialQuoteSuccessRequest: CreateInitialQuoteReqDTO = {
    projectId:"",
    accountId: '0018I00000jKcrEQAS',
    contactId: '0038I00000fotGnQAI',
    orderType: 'Recurring without End Date',
    zipcode: '02446',
    billTiming: 'Bill in Advance',
    billingPeriod: '28 Day Bill Period',
    customerType: 'Business',
    businessType: 'Other Business',
    prodSubType: 'Renewable',
    addressExist: true,
    addressId: 'a8x8I000000CozVQAS',
    address: {
      accountId: '0018I00000hZ635QAC',
      city: 'Boston',
      country: 'US',
      shipToAddress: true,
      state: 'MA',
      street: '118 Flanders Rd',
      zipcode: '01581',
      siteName: 'Test Site Name',
      latitude: 42.3601,
      longitude: 71.0589,
      billToAddress: false,
    },
    requestId: '1234567890',
  };
  let createInitialQuoteRequestSuccessResponse = {
    status: 1000,
    message: 'Success',
    data: {
      quoteId: 'a6O8I000000HDlUUAW',
      addressId: 'a8x8I000000CozVQAS',
    },
  };
  let createInitialQuoteFailRequest: CreateInitialQuoteReqDTO = {
    projectId: "",
    accountId: '',
    contactId: '0038I00000fotGnQAI',
    orderType: 'Recurring without End Date',
    zipcode: '02446',
    billTiming: 'Bill in Advance',
    billingPeriod: '28 Day Bill Period',
    customerType: 'Business',
    businessType: 'Other Business',
    prodSubType: 'Renewable',
    addressExist: true,
    addressId: 'a8x8I000000CozVQAS',
    address: {
      accountId: '0018I00000hZ635QAC',
      city: 'Boston',
      country: 'US',
      shipToAddress: true,
      state: 'MA',
      street: '118 Flanders Rd',
      zipcode: '01581',
      siteName: 'Test Site Name',
      latitude: 42.3601,
      longitude: 71.0589,
      billToAddress: false,
    },
    requestId: '1234567890',
  };
  let createInitialQuoteRequestFailResponse = {
    status: 1005,
    message: 'Fail',
    data: {},
  };
  //after code refactor step1 add product and calculate
  let addProductAndCalculateSuccessRequest: AddProductAndCalculateReqDTO = {
    "quoteId": "a6OVA0000005KNt2AM",
    "startDate": "2024-08-23",
    "endDate": "2049-12-31",
    "orderType": "Recurring without End Date",
    "duration": "4-6 Months",
    "billTiming": "Bill in Advance",
    "billingPeriod": "28 Day Bill Period",
    "customerType": "Business",
    "businessType": "Entertainment",
    "contactId": "0038I00000i2g4bQAA",
    "accountId": "0018I00000k1WugQAE",
    "estimatedEndDate": "2024-12-27",
    "prodSubType": "Renewable",
    "addressId": "a8x8I000000CqwdQAC",
    "zipcode": "92116",
    "productDetails": [
      {
        "productIdBundle": "01t3m00000PPH5MAAX",
        "productOptionSkuBundle": "",
        "bundleSummery": "Restroom Bundle",
        "bundleQty": 1,
        "productIdService": "01t3m00000POgudAAD",
        "productOptionSkuService": "a6D8I0000008aNLUAY",
        "serviceSummery": "1 Service 2 Days per Week",
        "productIdAsset": "01t3m00000NTiw6AAD",
        "productOptionSkuAsset": "a6D8I0000008aKcUAI",
        "assetSummary": "Standard Restroom",
        "additionalProduct": [
          {
            "productIdAS": "01t3m00000POgweAAD",
            "productOptionSkuAS": "a6D8I0000008aPZUAY",
            "aSSummery": "Stake and Secure Restroom",
            "aSTaxCode": ""
          },
          {
            "productIdAS": "01t3m00000OAZY4AAP",
            "productOptionSkuAS": "a6D8I0000008aS1UAI",
            "aSSummery": "Restroom Lock and Key",
            "aSTaxCode": ""
          },
          {
            "productIdAS": "01t6O000006aeezQAA",
            "productOptionSkuAS": "a6D8I0000008aSfUAI",
            "aSSummery": "Toilet Seat Cover Refill at time of service",
            "aSTaxCode": ""
          },
          {
            "productIdAS": "01t3m00000POgwKAAT",
            "productOptionSkuAS": "a6D8I0000008aSlUAI",
            "aSSummery": "Sanitation Containment Tray",
            "aSTaxCode": ""
          }
        ],
        "serviceTaxcode": '',
        "assetTaxcode": '',
        "pricebookEntryIdBundle": '',
        "pricebookEnteryIdService": '',
        "pricebookEnteryIdAsset": ''
      },
      {
        "productIdBundle": "01t3m00000PPH5MAAX",
        "productOptionSkuBundle": "",
        "bundleSummery": "Restroom Bundle",
        "bundleQty": 3,
        "productIdService": "01t3m00000NTivwAAD",
        "productOptionSkuService": "a6D8I0000008aRVUAY",
        "serviceSummery": "1 Service 1 Day per Week",
        "productIdAsset": "01t3m00000NTiw6AAD",
        "productOptionSkuAsset": "a6D8I0000008aKcUAI",
        "assetSummary": "Standard Restroom",
        "additionalProduct": [
          {
            "productIdAS": "01t3m00000POgw6AAD",
            "productOptionSkuAS": "a6D8I0000008aMGUAY",
            "aSSummery": "Hand Sanitizer Refill",
            "aSTaxCode": ""
          },
          {
            "productIdAS": "01t3m00000POgwKAAT",
            "productOptionSkuAS": "a6D8I0000008aSlUAI",
            "aSSummery": "Sanitation Containment Tray",
            "aSTaxCode": ""
          }
        ],
        "serviceTaxcode": '',
        "assetTaxcode": '',
        "pricebookEntryIdBundle": '',
        "pricebookEnteryIdService": '',
        "pricebookEnteryIdAsset": ''
      }
    ]
  }
  let addProductAndCalculateSuccessResponse = {
    status: 1000,
    message: 'Success',
    data: {
      quoteId: 'a6O8I000000HDlUUAW',
    },
  };
  let addProductAndCalculateFailRequest: AddProductAndCalculateReqDTO = {
    quoteId: '',
    accountId: '',
    contactId: '',
    startDate: '',
    endDate: '',
    orderType: '',
    zipcode: '',
    duration: '',
    billTiming: '',
    billingPeriod: '',
    customerType: '',
    businessType: '',
    prodSubType: '',
    productDetails: [],
    addressId: '',
    estimatedEndDate: ''
  };
  //after code refactor generate quote document success
  let generateQuoteDocumentSuccessResponse = {
    status: 1000,
    message: 'Success',
    data: {
      quoteId: 'a6O8I000000HDlUUAW',
    },
  };
  let generateQuoteDocumentFailResponse = {
    status: 1005,
    message: 'Fail',
    data: {},
  };
  let addProductAndCalculateFailResponse = {
    status: 1005,
    message: 'Fail',
    data: {},
  };
  //after code refactor get quote details success
  let getQuoteDetailsSuccessResponse = {
    success: true,
    message: 'Success',
    status: 1000,
    data: {
      quoteId: 'a6O8I000000HDw3UAG',
      quoteName: 'Q-514151',
      currentStatus: 6,
      startDate: '2023-11-27',
      endDate: '2023-11-28',
      lineItems: [
        {
          bundleId: '01t3m00000PPH5MAAX',
          type: 'Bundle',
          name: 'Restroom Bundle',
          service: [
            {
              id: '01t3m00000NTivwAAD',
              serviceName: '1 Svc 1 Day Wk',
              serviceProductCode: '112-2001',
              servideOptionalId: 'a6D8I0000008aRVUAY',
              quantity: 1,
            },
          ],
          asset: [
            {
              id: '01t3m00000NTiw6AAD',
              assetName: 'Std Rest',
              assetProductCode: '111-1001',
              assetOptionalId: 'a6D8I0000008aKcUAI',
              quantity: 1,
            },
          ],
          ancillaryService: [
            {
              id: '01t6O000006aeezQAA',
              ancillaryServiceName: 'Toilet Seat Cover Refill',
              ancillaryServiceProductCode: '112-2209',
              ancillaryServiceOptionalId: 'a6D8I0000008aSfUAI',
              quantity: 1,
            },
          ],
          pAndD: [
            {
              id: '01t3m00000POgxNAAT',
              pAndDServiceName: 'Pick Rest per Unit',
              pAndDServiceNameProductCode: '113-3010',
              quantity: 1,
            },
            {
              id: '01t3m00000POgxIAAT',
              pAndDServiceName: 'Del Rest per Unit',
              pAndDServiceNameProductCode: '113-3009',
              quantity: 1,
            },
          ],
        },
      ],
      documentId: '0158I000000lU6LQAU',
      siteAddress: {
        addressId: 'a8x8I000000CpqUQAS',
        name: '135 Pleasant Street, Broo - Brookline - MA',
        country: 'US',
        city: 'Brookline',
        zipcode: '02446',
        state: 'MA',
        siteStartTime: '01:30:00.125Z',
        siteEndTime: '13:30:00.125Z',
        gateCode: 'Gate 1',
        instructions: 'Near Security cabin',
        information: null,
        latitude: 42.34715,
        longitude: -71.11782,
        clearanceRequired: true,
        idRequired: true,
      },
      siteContact: {
        contactId: '0038I00000fqNgwQAE',
        firstName: 'Maria2',
        lastName: 'Jackson2',
        phone: '9202232000',
        email: 'gaurav.narvekar+86@zingworks.in',
      },
      billingAddress: {
        address: 'San Diego, CA 92116, USA - San Diego - CA',
        city: 'San Diego',
        state: 'CA',
        zipcode: '92116',
      },
      billingContact: {
        contactId: '0038I00000fqEukQAE',
        firstName: 'Maria',
        lastName: 'Jackson',
        phone: '9202232000',
        email: 'gaurav.narvekar+86@zingworks.in',
      },
      emailToCC: ['test1@gmail.com', null, null, null, null, null],
      poNumber: 'PO-1234',
    },
  };
  //after code refactor get quote details fail
  let getQuoteDetailsFailResponse = {
    status: 1005,
    message: 'Fail',
    data: {},
  };
  //after code refactor save status accept/reject success
  let updateQuoteStatusSuccessResponse = {
    status: 1000,
    message: 'Success',
  };
  //after code refactor save status accept/reject fail
  let updateQuoteStatusFailResponse = {
    status: 1005,
    message: 'Fail',
  };
  //after code refactor save site details success
  let saveSiteDetailsSuccessResponse = {
    status: 1000,
    message: 'Success',
    data: {
      quoteId: 'a6O8I000000HE7qUAG',
    },
  };
 
  //after code refactor save billing details success
  let saveBillingDetailsSuccessResponse = {
    status: 1000,
    message: 'Success',
    data: {
      quoteId: 'a6O8I000000HE7qUAG',
    },
  };
  //after code refactor save billing details fail
  let saveBillingDetailsFailResponse = {
    status: 1005,
    message: 'Fail',
    data: {},
  };
  //after code refactor save billing details request
  let saveBillingDetailsRequest = {
    address: {},
    quoteId: 'a6O8I000000HG7FUAW',
    addressRefId: 'a8x8I000000CqgzQAC',
    addressExist: true,
    emailIds: [],
    contactRefId: '0038I00000fqEukQAE',
    poNumber: '',
    accountId: '0018I00000jyo1TQAQ',
  };
  //after code refactor confirm quote success
  let confirmQuoteSuccessResponse = {
    status: 1000,
    message: 'Success',
    data: {},
  };
  //after code refactor confirm quote fail
  let confirmQuoteFailResponse = {
    status: 1005,
    message: 'Fail',
    data: {},
  };
  //after code refactor confirm quote request
  let confirmQuoteRequest = {
    quoteId: 'a6O8I000000HG7FUAW',
    isAutoPay: true,
    paymentMethodId: 'pm_1OHpTsKX1Bgoxru0yhwk8zZS',
  };

  //This block will run before each unit test
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuoteController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: QuoteService,
          useValue: mockQuoteService,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
        {
          provide: AccountsService,
          useValue: mockAccountService,
        },
        {
          provide: SfdcBaseService,
          useValue: mockSfdcBaseService,
        },
        {
          provide: SfdcRFQService,
          useValue: mockSfdcRfqService,
        },
        {
          provide: Auth0MyUSSAPIService,
          useValue: mockAuth0MachineToMachineService,
        },
        {
          provide: SfdcServiceableZipCodeService,
          useValue: mockSfdcServiceableZipCodeService,
        },
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
        {
          provide: SfdcQuoteService,
          useValue: mockSfdcQuoteService,
        },
        { provide: HttpService, useValue: mockHttpService },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    controller = module.get<QuoteController>(QuoteController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
  //step0 create initialquote success
  it('Should return quoteId', async () => {
    let req = {
      user: {
        sub: '1234567890',
      },
    };
    let userDetailModelResp = {
      emailVerified: true,
      ussPortalUserId: 'aHQ8I000000L6WeWAK',
      email: 'gaurav.narvekar+86@zingworks.in',
      firstName: 'Gaurav +86',
      lastName: 'Jackson',
      phone: '9202232000',
      id: '0038I00000fqEukQAE',
      accountId: '0018I00000jyo1TQAQ',
      accountName: 'MyUSS Zingworks Test99 Account',
      autoPayRequirement: 'N/A',
      businessType: 'Entertainment',
      customerType: 'Business',
      emailForCC: ['test1@gmail.com', 'test2@gmail.com', 'test3@gmail.com'],
      contactId: '0038I00000fqEukQAE',
      accountNumber: 'ACT-01640876',
      accounts: [
        {
          contactId: '0038I00000fqEukQAE',
          firstName: 'Gaurav +86',
          lastName: 'Jackson',
          phone: '9202232000',
          email: 'gaurav.narvekar+86@zingworks.in',
          accountId: '0018I00000jyo1TQAQ',
          accountName: 'MyUSS Zingworks Test99 Account',
          accountNumber: 'ACT-01640876',
          autoPayRequirement: 'N/A',
          businessType: 'Entertainment',
          customerType: 'Business',
          emailForCC: ['test1@gmail.com', 'test2@gmail.com', 'test3@gmail.com'],
          myussEnabled: true,
          myussQuotesEnabled: true,
          myussHomeEnabled: true,
          myussEasyPayEnabled: true,
          myussBillingEnabled: true,
          myussOrdersEnabled: true,
          myussCasesEnabled: true,
          myussProjectsEnabled: true,
          poRequired: false,
        },
      ],
      myussEnabled: true,
      myussQuotesEnabled: true,
      myussHomeEnabled: true,
      myussEasyPayEnabled: true,
      myussBillingEnabled: true,
      myussOrdersEnabled: true,
      myussCasesEnabled: true,
      myussProjectsEnabled: true,
      poRequired: false,
      accountDetails: [],
    };

    let mockResponseGetStandardPricebook = {
      Id: '01s1N000007nDwhQAE',
      Name: 'Standard Price Book',
      IsActive: true,
      IsStandard: true,
      Description: null,
    };
    let mockResponseCheckServiceableZipcode = {
      Id: 'a6y8I0000004bqKQAQ',
      Zip_Code__c: '02446',
      Containment_Tray_Required__c: 'No',
      Out_of_Footprint__c: false,
    };
    let mockResponseCreateOpportunity = { id: '0068I000007NxAnQAK', success: true, errors: [] };
    let mockResponseCreateQuote = { id: 'a6O8I000000HG6CUAW', success: true, errors: [] };

    mockCacheService.get.mockResolvedValue(JSON.stringify(userDetailModelResp));
    mockProductsService.getStandardPricebook.mockResolvedValue(mockResponseGetStandardPricebook);

    mockSfdcServiceableZipCodeService.checkServiceableZipcode.mockResolvedValue(mockResponseCheckServiceableZipcode);

    mockSfdcQuoteService.createOpportunity.mockResolvedValue(mockResponseCreateOpportunity);

    mockSfdcQuoteService.createQuote.mockResolvedValue(mockResponseCreateQuote);

    mockQuoteService.createInitialQuote.mockResolvedValue(createInitialQuoteRequestSuccessResponse);

    const result = await controller.createInitialQuote(req, createInitialQuoteSuccessRequest, '0018I00000jyo1TQAQ');
    expect(result.message).toMatch('Success');
    expect(result.data).toHaveProperty('quoteId');
  });
  //step0 create initialquote fail
  it('Should return fail', async () => {
    let req = {
      user: {
        sub: '1234567890',
      },
    };

    let mockResponseGetStandardPricebook = {
      Id: '01s1N000007nDwhQAE',
      Name: 'Standard Price Book',
      IsActive: true,
      IsStandard: true,
      Description: null,
    };
    let mockResponseCheckServiceableZipcode = {
      Id: 'a6y8I0000004bqKQAQ',
      Zip_Code__c: '02446',
      Containment_Tray_Required__c: 'No',
      Out_of_Footprint__c: false,
    };
    let mockResponseCreateOpportunity = { id: '0068I000007NxAnQAK', success: true, errors: [] };
    let mockResponseCreateQuote = { id: 'a6O8I000000HG6CUAW', success: false, errors: [] };

    mockProductsService.getStandardPricebook.mockResolvedValue(mockResponseGetStandardPricebook);

    mockSfdcServiceableZipCodeService.checkServiceableZipcode.mockResolvedValue(mockResponseCheckServiceableZipcode);

    mockSfdcQuoteService.createOpportunity.mockResolvedValue(mockResponseCreateOpportunity);

    mockSfdcQuoteService.createQuote.mockResolvedValue(mockResponseCreateQuote);

    mockQuoteService.createInitialQuote.mockResolvedValue(createInitialQuoteRequestFailResponse);

    const result = await controller.createInitialQuote(req, createInitialQuoteFailRequest, '0018I00000jyo1TQAQ');
    expect(result.message).toMatch('Fail');
  });
  //step1 add product and calculate success
  it('Should return quoteId', async () => {
    let req = {
      user: {
        sub: '1234567890',
      },
    };
    let userDetailModelResp = {
      emailVerified: true,
      ussPortalUserId: 'aHQ8I000000L6WeWAK',
      email: 'gaurav.narvekar+86@zingworks.in',
      firstName: 'Gaurav +86',
      lastName: 'Jackson',
      phone: '9202232000',
      id: '0038I00000fqEukQAE',
      accountId: '0018I00000jyo1TQAQ',
      accountName: 'MyUSS Zingworks Test99 Account',
      autoPayRequirement: 'N/A',
      businessType: 'Entertainment',
      customerType: 'Business',
      emailForCC: ['test1@gmail.com', 'test2@gmail.com', 'test3@gmail.com'],
      contactId: '0038I00000fqEukQAE',
      accountNumber: 'ACT-01640876',
      accounts: [
        {
          contactId: '0038I00000fqEukQAE',
          firstName: 'Gaurav +86',
          lastName: 'Jackson',
          phone: '9202232000',
          email: 'gaurav.narvekar+86@zingworks.in',
          accountId: '0018I00000jyo1TQAQ',
          accountName: 'MyUSS Zingworks Test99 Account',
          accountNumber: 'ACT-01640876',
          autoPayRequirement: 'N/A',
          businessType: 'Entertainment',
          customerType: 'Business',
          emailForCC: ['test1@gmail.com', 'test2@gmail.com', 'test3@gmail.com'],
          myussEnabled: true,
          myussQuotesEnabled: true,
          myussHomeEnabled: true,
          myussEasyPayEnabled: true,
          myussBillingEnabled: true,
          myussOrdersEnabled: true,
          myussCasesEnabled: true,
          myussProjectsEnabled: true,
          poRequired: false,
        },
      ],
      myussEnabled: true,
      myussQuotesEnabled: true,
      myussHomeEnabled: true,
      myussEasyPayEnabled: true,
      myussBillingEnabled: true,
      myussOrdersEnabled: true,
      myussCasesEnabled: true,
      myussProjectsEnabled: true,
      poRequired: false,
      accountDetails: [],
    };

    let mockResponseGetQuoteLineIds = [
      'a6K8I000000I9dKUAS',
      'a6K8I000000I9dLUAS',
      'a6K8I000000I9dMUAS',
      'a6K8I000000I9dNUAS',
      'a6K8I000000I9dOUAS',
      'a6K8I000000I9dPUAS',
      'a6K8I000000I9dQUAS',
      'a6K8I000000I9dRUAS',
      'a6K8I000000I9dSUAS',
    ];
    let mockResponseDeleteQuoteLinesByIds = {};
    let mockResponseCreateShortTermQuoteLineIfNeeded = undefined;
    let mockResponseGetProducts = [
      {
        Id: '01t3m00000POh0HAAT',
        ProductCode: '123-3009',
        Name: 'Del Hand per Unit',
        ProductType__c: 'P n D',
        Requires_Parent_Asset__c: true,
        AVA_SFCPQ__TaxCode__c: 'FR010000',
        ProductCategory__c: 'Hand Cleaning',
        Asset_Summary__c: 'Non-fees Sanitation',
        Description2__c: 'Delivery Hand Cleaning - Per Unit Charge',
        PricebookEntries: [{ Id: '01u3m00000O2tWWAAZ' }],
      },
      {
        Id: '01t3m00000POh0MAAT',
        ProductCode: '123-3010',
        Name: 'Pick Hand per Unit',
        ProductType__c: 'P n D',
        Requires_Parent_Asset__c: true,
        AVA_SFCPQ__TaxCode__c: 'FR010000',
        ProductCategory__c: 'Hand Cleaning',
        Asset_Summary__c: 'Non-fees Sanitation',
        Description2__c: 'Pickup Hand Cleaning - Per Unit Charge',
        PricebookEntries: [{ Id: '01u3m00000O2tVKAAZ' }],
      },
      {
        Id: '01t3m00000PPH5MAAX',
        ProductCode: '110-0000',
        Name: 'Restroom Bundle',
        ProductType__c: 'Bundle',
        Requires_Parent_Asset__c: false,
        AVA_SFCPQ__TaxCode__c: null,
        ProductCategory__c: null,
        Asset_Summary__c: null,
        Description2__c: 'Restroom Bundle Configuration',
        SBQQ__Options__r: [
          {
            Id: 'a6D8I0000008aKcUAI',
            SBQQ__OptionalSKU__c: '01t3m00000NTiw6AAD',
            SBQQ__OptionalSKU__r: {
              Id: '01t3m00000NTiw6AAD',
              ProductCode: '111-1001',
              Name: 'Std Rest',
              ProductType__c: 'Asset',
            },
            AdditionalOptions__c: null,
          },
          {
            Id: 'a6D8I0000008aMGUAY',
            SBQQ__OptionalSKU__c: '01t3m00000POgw6AAD',
            SBQQ__OptionalSKU__r: {
              Id: '01t3m00000POgw6AAD',
              ProductCode: '112-2208',
              Name: 'Hand Sani Refill',
              ProductType__c: 'Ancillary Services',
            },
            AdditionalOptions__c: null,
          },
          {
            Id: 'a6D8I0000008aV2UAI',
            SBQQ__OptionalSKU__c: '01t3m00000POgxNAAT',
            SBQQ__OptionalSKU__r: {
              Id: '01t3m00000POgxNAAT',
              ProductCode: '113-3010',
              Name: 'Pick Rest per Unit',
              ProductType__c: 'P n D',
            },
            AdditionalOptions__c: null,
          },
          {
            Id: 'a6D8I0000008aSoUAI',
            SBQQ__OptionalSKU__c: '01t3m00000POgwPAAT',
            SBQQ__OptionalSKU__r: {
              Id: '01t3m00000POgwPAAT',
              ProductCode: '113-1802',
              Name: 'Rest Hasp',
              ProductType__c: 'Ancillary Asset',
            },
            AdditionalOptions__c: null,
          },
          {
            Id: 'a6D8I0000008aSlUAI',
            SBQQ__OptionalSKU__c: '01t3m00000POgwKAAT',
            SBQQ__OptionalSKU__r: {
              Id: '01t3m00000POgwKAAT',
              ProductCode: '113-1801',
              Name: 'Containment Tray',
              ProductType__c: 'Ancillary Asset',
            },
            AdditionalOptions__c: null,
          },
          {
            Id: 'a6D8I0000008aSfUAI',
            SBQQ__OptionalSKU__c: '01t6O000006aeezQAA',
            SBQQ__OptionalSKU__r: {
              Id: '01t6O000006aeezQAA',
              ProductCode: '112-2209',
              Name: 'Toilet Seat Cover Refill',
              ProductType__c: 'Ancillary Services',
            },
            AdditionalOptions__c: null,
          },
          {
            Id: 'a6D8I0000008aS1UAI',
            SBQQ__OptionalSKU__c: '01t3m00000OAZY4AAP',
            SBQQ__OptionalSKU__r: {
              Id: '01t3m00000OAZY4AAP',
              ProductCode: '113-1803',
              Name: 'Rest Lock and Key',
              ProductType__c: 'Ancillary Asset',
            },
            AdditionalOptions__c: null,
          },
          {
            Id: 'a6D8I0000008aRVUAY',
            SBQQ__OptionalSKU__c: '01t3m00000NTivwAAD',
            SBQQ__OptionalSKU__r: {
              Id: '01t3m00000NTivwAAD',
              ProductCode: '112-2001',
              Name: '1 Svc 1 Day Wk',
              ProductType__c: 'Service',
            },
            AdditionalOptions__c: null,
          },
          {
            Id: 'a6D8I0000008aMRUAY',
            SBQQ__OptionalSKU__c: '01t3m00000POgxIAAT',
            SBQQ__OptionalSKU__r: {
              Id: '01t3m00000POgxIAAT',
              ProductCode: '113-3009',
              Name: 'Del Rest per Unit',
              ProductType__c: 'P n D',
            },
            AdditionalOptions__c: null,
          },
          {
            Id: 'a6D8I0000008aMUUAY',
            SBQQ__OptionalSKU__c: '01t3m00000POgwUAAT',
            SBQQ__OptionalSKU__r: {
              Id: '01t3m00000POgwUAAT',
              ProductCode: '113-2201',
              Name: 'Install / Setup Rest',
              ProductType__c: 'Ancillary Services',
            },
            AdditionalOptions__c: null,
          },
          {
            Id: 'a6D8I0000008aNLUAY',
            SBQQ__OptionalSKU__c: '01t3m00000POgudAAD',
            SBQQ__OptionalSKU__r: {
              Id: '01t3m00000POgudAAD',
              ProductCode: '112-2002',
              Name: '1 Svc 2 Days Wk',
              ProductType__c: 'Service',
            },
            AdditionalOptions__c: null,
          },
          {
            Id: 'a6D8I0000008aPZUAY',
            SBQQ__OptionalSKU__c: '01t3m00000POgweAAD',
            SBQQ__OptionalSKU__r: {
              Id: '01t3m00000POgweAAD',
              ProductCode: '113-2203',
              Name: 'Stake Secure Rest',
              ProductType__c: 'Ancillary Services',
            },
            AdditionalOptions__c: null,
          },
        ],
        PricebookEntries: [{ Id: '01u3m00000O2tSBAAZ' }],
      },
      {
        Id: '01t3m00000PPH5RAAX',
        ProductCode: '120-0000',
        Name: 'Hand Cleaning Bundle',
        ProductType__c: 'Bundle',
        Requires_Parent_Asset__c: false,
        AVA_SFCPQ__TaxCode__c: null,
        ProductCategory__c: null,
        Asset_Summary__c: null,
        Description2__c: 'Hand Cleaning Bundle Configuration',
        SBQQ__Options__r: [
          {
            Id: 'a6D8I0000008aK1UAI',
            SBQQ__OptionalSKU__c: '01t3m00000NTix0AAD',
            SBQQ__OptionalSKU__r: {
              Id: '01t3m00000NTix0AAD',
              ProductCode: '122-2001',
              Name: '1 Svc 1 Day Wk',
              ProductType__c: 'Service',
            },
            AdditionalOptions__c: null,
          },
          {
            Id: 'a6D8I0000008aJdUAI',
            SBQQ__OptionalSKU__c: '01t3m00000POh0HAAT',
            SBQQ__OptionalSKU__r: {
              Id: '01t3m00000POh0HAAT',
              ProductCode: '123-3009',
              Name: 'Del Hand per Unit',
              ProductType__c: 'P n D',
            },
            AdditionalOptions__c: null,
          },
          {
            Id: 'a6D8I0000008aN6UAI',
            SBQQ__OptionalSKU__c: '01t3m00000POh0MAAT',
            SBQQ__OptionalSKU__r: {
              Id: '01t3m00000POh0MAAT',
              ProductCode: '123-3010',
              Name: 'Pick Hand per Unit',
              ProductType__c: 'P n D',
            },
            AdditionalOptions__c: null,
          },
          {
            Id: 'a6D8I0000008aMdUAI',
            SBQQ__OptionalSKU__c: '01t3m00000POgyHAAT',
            SBQQ__OptionalSKU__r: {
              Id: '01t3m00000POgyHAAT',
              ProductCode: '123-2203',
              Name: 'Stake Secure Hand',
              ProductType__c: 'Ancillary Services',
            },
            AdditionalOptions__c: null,
          },
          {
            Id: 'a6D8I0000008aKyUAI',
            SBQQ__OptionalSKU__c: '01t3m00000NTiuFAAT',
            SBQQ__OptionalSKU__r: {
              Id: '01t3m00000NTiuFAAT',
              ProductCode: '121-1102',
              Name: '2 Stn Hand Sink',
              ProductType__c: 'Asset',
            },
            AdditionalOptions__c: null,
          },
          {
            Id: 'a6D8I0000008aKAUAY',
            SBQQ__OptionalSKU__c: '01t3m00000POgwKAAT',
            SBQQ__OptionalSKU__r: {
              Id: '01t3m00000POgwKAAT',
              ProductCode: '113-1801',
              Name: 'Containment Tray',
              ProductType__c: 'Ancillary Asset',
            },
            AdditionalOptions__c: null,
          },
          {
            Id: 'a6D8I0000008aUwUAI',
            SBQQ__OptionalSKU__c: '01t3m00000POgyQAAT',
            SBQQ__OptionalSKU__r: {
              Id: '01t3m00000POgyQAAT',
              ProductCode: '122-2002',
              Name: '1 Svc 2 Days Wk',
              ProductType__c: 'Service',
            },
            AdditionalOptions__c: null,
          },
        ],
        PricebookEntries: [{ Id: '01u3m00000O2tSEAAZ' }],
      },
      {
        Id: '01t3m00000QxhSvAAJ',
        ProductCode: 'ShortTerm',
        Name: 'Short Term Order',
        ProductType__c: 'Ancillary',
        Requires_Parent_Asset__c: false,
        AVA_SFCPQ__TaxCode__c: null,
        ProductCategory__c: null,
        Asset_Summary__c: null,
        Description2__c: '**DO NOT USE** Backend Product Only',
        PricebookEntries: [{ Id: '01u3m00000Of9DrAAJ' }],
      },
      {
        Id: '01t6O000006aeezQAA',
        ProductCode: '112-2209',
        Name: 'Toilet Seat Cover Refill',
        ProductType__c: 'Ancillary Services',
        Requires_Parent_Asset__c: false,
        AVA_SFCPQ__TaxCode__c: 'SANISERV',
        ProductCategory__c: 'Restroom',
        Asset_Summary__c: 'Group C Sanitation',
        Description2__c: 'Toilet Seat Cover Refill at time of service',
        PricebookEntries: [{ Id: '01u6O00000SIUkAQAX' }],
      },
      {
        Id: '01t3m00000NTivwAAD',
        ProductCode: '112-2001',
        Name: '1 Svc 1 Day Wk',
        ProductType__c: 'Service',
        Requires_Parent_Asset__c: true,
        AVA_SFCPQ__TaxCode__c: 'SANISERV',
        ProductCategory__c: 'Restroom',
        Asset_Summary__c: 'Group A Sanitation',
        Description2__c: '1 Service 1 Day per Week',
        PricebookEntries: [{ Id: '01u3m00000O2tTsAAJ' }],
      },
      {
        Id: '01t3m00000NTiw6AAD',
        ProductCode: '111-1001',
        Name: 'Std Rest',
        ProductType__c: 'Asset',
        Requires_Parent_Asset__c: false,
        AVA_SFCPQ__TaxCode__c: 'SANIRENT',
        ProductCategory__c: 'Restroom',
        Asset_Summary__c: 'Standard Restroom',
        Description2__c: 'Standard Restroom',
        PricebookEntries: [{ Id: '01u3m00000O2tTvAAJ' }],
      },
      {
        Id: '01t3m00000NTix0AAD',
        ProductCode: '122-2001',
        Name: '1 Svc 1 Day Wk',
        ProductType__c: 'Service',
        Requires_Parent_Asset__c: true,
        AVA_SFCPQ__TaxCode__c: 'SANISERV',
        ProductCategory__c: 'Hand Cleaning',
        Asset_Summary__c: 'Group A Sanitation',
        Description2__c: '1 Service 1 Day per Week',
        PricebookEntries: [{ Id: '01u3m00000O2tUDAAZ' }],
      },
      {
        Id: '01t3m00000OAZY4AAP',
        ProductCode: '113-1803',
        Name: 'Rest Lock and Key',
        ProductType__c: 'Ancillary Asset',
        Requires_Parent_Asset__c: false,
        AVA_SFCPQ__TaxCode__c: 'SANIRENT',
        ProductCategory__c: 'Restroom',
        Asset_Summary__c: 'Non-fees Sanitation',
        Description2__c: 'Restroom Lock and Key',
        PricebookEntries: [{ Id: '01u3m00000QcVoTAAV' }],
      },
      {
        Id: '01t3m00000POgudAAD',
        ProductCode: '112-2002',
        Name: '1 Svc 2 Days Wk',
        ProductType__c: 'Service',
        Requires_Parent_Asset__c: true,
        AVA_SFCPQ__TaxCode__c: 'SANISERV',
        ProductCategory__c: 'Restroom',
        Asset_Summary__c: 'Group A Sanitation',
        Description2__c: '1 Service 2 Days per Week',
        PricebookEntries: [{ Id: '01u3m00000O2tYTAAZ' }],
      },
      {
        Id: '01t3m00000POgw6AAD',
        ProductCode: '112-2208',
        Name: 'Hand Sani Refill',
        ProductType__c: 'Ancillary Services',
        Requires_Parent_Asset__c: false,
        AVA_SFCPQ__TaxCode__c: 'SANISERV',
        ProductCategory__c: 'Restroom',
        Asset_Summary__c: 'Group C Sanitation',
        Description2__c: 'Hand Sanitizer Refill',
        PricebookEntries: [{ Id: '01u3m00000O2tVmAAJ' }],
      },
      {
        Id: '01t3m00000POgwKAAT',
        ProductCode: '113-1801',
        Name: 'Containment Tray',
        ProductType__c: 'Ancillary Asset',
        Requires_Parent_Asset__c: false,
        AVA_SFCPQ__TaxCode__c: 'SANIRENT',
        ProductCategory__c: 'Restroom',
        Asset_Summary__c: 'Non-fees Sanitation',
        Description2__c: 'Sanitation Containment Tray',
        PricebookEntries: [{ Id: '01u3m00000O2tVnAAJ' }],
      },
      {
        Id: '01t3m00000POgwPAAT',
        ProductCode: '113-1802',
        Name: 'Rest Hasp',
        ProductType__c: 'Ancillary Asset',
        Requires_Parent_Asset__c: false,
        AVA_SFCPQ__TaxCode__c: 'SANIRENT',
        ProductCategory__c: 'Restroom',
        Asset_Summary__c: 'Non-fees Sanitation',
        Description2__c: 'Restroom Hasp',
        PricebookEntries: [{ Id: '01u3m00000O2tV1AAJ' }],
      },
      {
        Id: '01t3m00000POgwUAAT',
        ProductCode: '113-2201',
        Name: 'Install / Setup Rest',
        ProductType__c: 'Ancillary Services',
        Requires_Parent_Asset__c: true,
        AVA_SFCPQ__TaxCode__c: 'SI020100',
        ProductCategory__c: 'Restroom',
        Asset_Summary__c: 'Non-fees Sanitation',
        Description2__c: 'Install and Setup Restroom',
        PricebookEntries: [{ Id: '01u3m00000O2tSqAAJ' }],
      },
      {
        Id: '01t3m00000POgweAAD',
        ProductCode: '113-2203',
        Name: 'Stake Secure Rest',
        ProductType__c: 'Ancillary Services',
        Requires_Parent_Asset__c: false,
        AVA_SFCPQ__TaxCode__c: 'SANISERV',
        ProductCategory__c: 'Restroom',
        Asset_Summary__c: 'A la carte Sanitation',
        Description2__c: 'Stake and Secure Restroom',
        PricebookEntries: [{ Id: '01u3m00000O2tSrAAJ' }],
      },
      {
        Id: '01t3m00000POgwjAAD',
        ProductCode: '113-3001',
        Name: 'Del Sani Standard',
        ProductType__c: 'P n D',
        Requires_Parent_Asset__c: false,
        AVA_SFCPQ__TaxCode__c: 'FR010000',
        ProductCategory__c: 'Restroom',
        Asset_Summary__c: 'Cart-level P&D Sanitation',
        Description2__c: 'Delivery Sanitation - Standard',
        PricebookEntries: [{ Id: '01u3m00000O2tXOAAZ' }],
      },
      {
        Id: '01t3m00000POgwyAAD',
        ProductCode: '113-3005',
        Name: 'Pick Sani Standard',
        ProductType__c: 'P n D',
        Requires_Parent_Asset__c: false,
        AVA_SFCPQ__TaxCode__c: 'FR010000',
        ProductCategory__c: 'Restroom',
        Asset_Summary__c: 'Cart-level P&D Sanitation',
        Description2__c: 'Pickup Sanitation - Standard',
        PricebookEntries: [{ Id: '01u3m00000O2tWOAAZ' }],
      },
      {
        Id: '01t3m00000POgxIAAT',
        ProductCode: '113-3009',
        Name: 'Del Rest per Unit',
        ProductType__c: 'P n D',
        Requires_Parent_Asset__c: true,
        AVA_SFCPQ__TaxCode__c: 'FR010000',
        ProductCategory__c: 'Restroom',
        Asset_Summary__c: 'Non-fees Sanitation',
        Description2__c: 'Delivery Restroom - Per Unit Charge',
        PricebookEntries: [{ Id: '01u3m00000O2tVpAAJ' }],
      },
      {
        Id: '01t3m00000POgxNAAT',
        ProductCode: '113-3010',
        Name: 'Pick Rest per Unit',
        ProductType__c: 'P n D',
        Requires_Parent_Asset__c: true,
        AVA_SFCPQ__TaxCode__c: 'FR010000',
        ProductCategory__c: 'Restroom',
        Asset_Summary__c: 'Non-fees Sanitation',
        Description2__c: 'Pickup Restroom - Per Unit Charge',
        PricebookEntries: [{ Id: '01u3m00000O2tWPAAZ' }],
      },
      {
        Id: '01t3m00000POgyHAAT',
        ProductCode: '123-2203',
        Name: 'Stake Secure Hand',
        ProductType__c: 'Ancillary Services',
        Requires_Parent_Asset__c: true,
        AVA_SFCPQ__TaxCode__c: 'SANISERV',
        ProductCategory__c: 'Hand Cleaning',
        Asset_Summary__c: 'A la carte Sanitation',
        Description2__c: 'Stake and Secure Hand Cleaning',
        PricebookEntries: [{ Id: '01u3m00000O2tWVAAZ' }],
      },
      {
        Id: '01t3m00000POgyQAAT',
        ProductCode: '122-2002',
        Name: '1 Svc 2 Days Wk',
        ProductType__c: 'Service',
        Requires_Parent_Asset__c: true,
        AVA_SFCPQ__TaxCode__c: 'SANISERV',
        ProductCategory__c: 'Hand Cleaning',
        Asset_Summary__c: 'Group A Sanitation',
        Description2__c: '1 Service 2 Days per Week',
        PricebookEntries: [{ Id: '01u3m00000O2tYVAAZ' }],
      },
      {
        Id: '01t3m00000NTiuFAAT',
        ProductCode: '121-1102',
        Name: '2 Stn Hand Sink',
        ProductType__c: 'Asset',
        Requires_Parent_Asset__c: false,
        AVA_SFCPQ__TaxCode__c: 'SANIRENT',
        ProductCategory__c: 'Hand Cleaning',
        Asset_Summary__c: '2 Station Hand Cleaning',
        Description2__c: '2 Station Hand Wash Sink',
        PricebookEntries: [{ Id: '01u3m00000O2tTSAAZ' }],
      },
    ];
    let mockResponseCartLevelQuoteLines: [
      {
        SBQQ__Quote__c: 'a6O8I000000HG7FUAW';
        SBQQ__Bundle__c: false;
        SBQQ__RequiredBy__c: null;
        SBQQ__StartDate__c: '2023-12-27';
        SBQQ__EndDate__c: '2049-12-31';
        SBQQ__Product__c: '01t3m00000POgwyAAD';
        SBQQ__ProductOption__c: null;
        SBQQ__PricebookEntryId__c: '01u3m00000O2tWOAAZ';
        SBQQ__ProductSubscriptionType__c: 'Renewable';
        SBQQ__Quantity__c: 1;
        SBQQ__TaxCode__c: 'FR010000';
        SBQQ__SubscriptionPricing__c: 'Fixed Price';
        SBQQ__SubscriptionType__c: 'Renewable';
        Prod_Subscription_Type__c: 'Renewable';
        QuantityUnitOfMeasure__c: 'Each';
        Requires_Parent_Asset__c: false;
        Sort_Order__c: '50000000000006';
        USF_Address__c: 'a8x8I000000CpqUQAS';
        CustomerOwned__c: false;
        AdditionalOptions__c: null;
        Asset_Summary__c: 'Cart-level P&D Sanitation';
      },
      {
        SBQQ__Quote__c: 'a6O8I000000HG7FUAW';
        SBQQ__Bundle__c: false;
        SBQQ__RequiredBy__c: null;
        SBQQ__StartDate__c: '2023-12-27';
        SBQQ__EndDate__c: '2049-12-31';
        SBQQ__Product__c: '01t3m00000POgwjAAD';
        SBQQ__ProductOption__c: null;
        SBQQ__PricebookEntryId__c: '01u3m00000O2tXOAAZ';
        SBQQ__ProductSubscriptionType__c: 'Renewable';
        SBQQ__Quantity__c: 1;
        SBQQ__TaxCode__c: 'FR010000';
        SBQQ__SubscriptionPricing__c: 'Fixed Price';
        SBQQ__SubscriptionType__c: 'Renewable';
        Prod_Subscription_Type__c: 'Renewable';
        QuantityUnitOfMeasure__c: 'Each';
        Requires_Parent_Asset__c: false;
        Sort_Order__c: '50000000000008';
        USF_Address__c: 'a8x8I000000CpqUQAS';
        CustomerOwned__c: false;
        AdditionalOptions__c: null;
        Asset_Summary__c: 'Cart-level P&D Sanitation';
      },
    ];
    mockCacheService.get.mockResolvedValue(JSON.stringify(userDetailModelResp));

    mockSfdcQuoteService.getQuoteLineIds.mockResolvedValue(mockResponseGetQuoteLineIds);

    mockSfdcQuoteService.deleteQuoteLinesByIds.mockResolvedValue(mockResponseDeleteQuoteLinesByIds);

    mockProductsService.getProducts.mockResolvedValue(mockResponseGetProducts);

    mockQuoteService.createCartLevelQuoteLines.mockResolvedValue(mockResponseCartLevelQuoteLines);

    mockQuoteService.createShortTermQuoteLineIfNeeded.mockResolvedValue(mockResponseCreateShortTermQuoteLineIfNeeded);

    mockQuoteService.addProductAndSave.mockResolvedValue(addProductAndCalculateSuccessResponse);

    const result = await controller.addProductAndSave(req, addProductAndCalculateSuccessRequest);
    expect(result.message).toMatch('Success');
    expect(result.data).toHaveProperty('quoteId');
  });
  //step1 add product and calculate fail
  it('Should return fail', async () => {
    let QuoteServiceResp = {
      success: false,
      status: 1009,
      message: 'Unexpected JSON at 0',
      data: {},
    };

    let userDetailModelResp = {
      emailVerified: true,
      ussPortalUserId: '',
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      id: '',
      accountId: '',
      accountName: '',
      autoPayRequirement: '',
      businessType: '',
      customerType: '',
      emailForCC: [],
      contactId: '',
      accountNumber: '',
      accounts: [
        {
          contactId: '',
          firstName: '',
          lastName: '',
          phone: '',
          email: '',
          accountId: '',
          accountName: '',
          accountNumber: '',
          autoPayRequirement: '',
          businessType: '',
          customerType: '',
          emailForCC: [],
          myussEnabled: true,
          myussQuotesEnabled: true,
          myussHomeEnabled: true,
          myussEasyPayEnabled: true,
          myussBillingEnabled: true,
          myussOrdersEnabled: true,
          myussCasesEnabled: true,
          myussProjectsEnabled: true,
          poRequired: false,
        },
      ],
      myussEnabled: true,
      myussQuotesEnabled: true,
      myussHomeEnabled: true,
      myussEasyPayEnabled: true,
      myussBillingEnabled: true,
      myussOrdersEnabled: true,
      myussCasesEnabled: true,
      myussProjectsEnabled: true,
      poRequired: false,
      accountDetails: [],
    };

    mockCacheService.get.mockResolvedValue(JSON.stringify(userDetailModelResp));

    mockQuoteService.addProductAndSave.mockResolvedValue(QuoteServiceResp);
    const result = await controller.addProductAndSave({}, addProductAndCalculateFailRequest);
    expect(result.message).toMatch('Unexpected JSON at 0');
  });
  //step2 generate quote document success
  it('Should return quoteId', async () => {
    let req = {
      user: {
        sub: '123',
      },
    };

    let body = {
      requestId: '456',
    };
    let userDetailModelResp = {
      emailVerified: true,
      ussPortalUserId: 'aHQ8I000000L6WeWAK',
      email: 'gaurav.narvekar+86@zingworks.in',
      firstName: 'Gaurav +86',
      lastName: 'Jackson',
      phone: '9202232000',
      id: '0038I00000fqEukQAE',
      accountId: '0018I00000jyo1TQAQ',
      accountName: 'MyUSS Zingworks Test99 Account',
      autoPayRequirement: 'N/A',
      businessType: 'Entertainment',
      customerType: 'Business',
      emailForCC: ['test1@gmail.com', 'test2@gmail.com', 'test3@gmail.com'],
      contactId: '0038I00000fqEukQAE',
      accountNumber: 'ACT-01640876',
      accounts: [
        {
          contactId: '0038I00000fqEukQAE',
          firstName: 'Gaurav +86',
          lastName: 'Jackson',
          phone: '9202232000',
          email: 'gaurav.narvekar+86@zingworks.in',
          accountId: '0018I00000jyo1TQAQ',
          accountName: 'MyUSS Zingworks Test99 Account',
          accountNumber: 'ACT-01640876',
          autoPayRequirement: 'N/A',
          businessType: 'Entertainment',
          customerType: 'Business',
          emailForCC: ['test1@gmail.com', 'test2@gmail.com', 'test3@gmail.com'],
          myussEnabled: true,
          myussQuotesEnabled: true,
          myussHomeEnabled: true,
          myussEasyPayEnabled: true,
          myussBillingEnabled: true,
          myussOrdersEnabled: true,
          myussCasesEnabled: true,
          myussProjectsEnabled: true,
          poRequired: false,
        },
      ],
      myussEnabled: true,
      myussQuotesEnabled: true,
      myussHomeEnabled: true,
      myussEasyPayEnabled: true,
      myussBillingEnabled: true,
      myussOrdersEnabled: true,
      myussCasesEnabled: true,
      myussProjectsEnabled: true,
      poRequired: false,
      accountDetails: [],
    };
    let cacheResp = {
      resp: {
        success: true,
        status: 1000,
        message: 'eligible for new request',
        data: {},
      },
      isEligibleForNewRequest: true,
    };
    mockQuoteService.handleCache.mockResolvedValue(cacheResp);
    mockCacheService.get.mockResolvedValue(JSON.stringify(userDetailModelResp));

    mockQuoteService.createAndSaveQuoteDocument.mockResolvedValue(generateQuoteDocumentSuccessResponse);

    const result = await controller.createQuoteDocument(req,'015VA000000IYUfYAO','0018I00000k1WugQAE',"true", body);
    expect(result.message).toMatch('Success');
    expect(result.data).toHaveProperty('quoteId');
  });
  //step2 generate quote document fail
  it('Should return fail', async () => {
    let req = {
      user: {
        sub: '123',
      },
    };
    let body = {};
    let cacheResp = {
      resp: {
        success: true,
        status: 1000,
        message: 'eligible for new request',
        data: {},
      },
      isEligibleForNewRequest: true,
    };
    mockQuoteService.handleCache.mockResolvedValue(cacheResp);

    mockQuoteService.createAndSaveQuoteDocument.mockResolvedValue(generateQuoteDocumentFailResponse);

    const result = await controller.createQuoteDocument(req,'015VA000000IYUfYAO', '0018I00000k1WugQAE','true', body);
    expect(result.message).toMatch('Fail');
  });
  //get quote details success
  it('Should return quote details', async () => {
    let mockGetQuoteDetails = {
      attributes: {
        type: 'SBQQ__Quote__c',
        url: '/services/data/v58.0/sobjects/SBQQ__Quote__c/a6O8I000000HG7FUAW',
      },
      Id: 'a6O8I000000HG7FUAW',
      Name: 'Q-515131',
      Site_Complete__c: false,
      Reference_Number__c: '515131',
      BillCycleDay__c: null,
      Billing_Approval_Status__c: 'Not Submitted',
      Billing_Complete__c: false,
      isCheckPaymentMethod__c: false,
      Billing_Period__c: '28 Day Bill Period',
      Charge_Type__c: 'Recurring',
      Bill_Timing__c: 'Bill in Advance',
      EEC_Percent__c: 0,
      ESF_Percent__c: 0,
      Fuel_Surcharge_Percent__c: 14.9,
      InvoiceDeliveryMethod__c: 'Email',
      LastBillingDate__c: null,
      Location_Code__c: 'FOX',
      Bill_To_Contact_Email__c: null,
      SBQQ__Status__c: 'Draft',
      Order_Type__c: 'Recurring without End Date',
      Facility_Name__c: null,
      Subdivision_Name__c: null,
      AutoPay__c: true,
      Payment_Method_Id__c: null,
      SBQQ__StartDate__c: '2023-12-27',
      SBQQ__EndDate__c: '2049-12-31',
      Duration__c: '24+ Months',
      SBQQ__Account__c: '0018I00000jyo1TQAQ',
      CreatedDate: '2023-12-22T08:26:39.000+0000',
      LastModifiedDate: '2023-12-22T08:28:32.000+0000',
      SBQQ__Account__r: {
        attributes: {
          type: 'Account',
          url: '/services/data/v58.0/sobjects/Account/0018I00000jyo1TQAQ',
        },
        Bill_to_Email_Address_1__c: 'test1@gmail.com',
        Bill_to_Email_Address_2__c: null,
        Bill_to_Email_Address_3__c: null,
        Bill_to_Email_Address_4__c: null,
        Bill_to_Email_Address_5__c: null,
        Bill_to_Email_Address_6__c: null,
      },
      Purchase_Order__r: null,
      SBQQ__LineItems__r: {
        totalSize: 3,
        done: true,
        records: [
          {
            attributes: {
              type: 'SBQQ__QuoteLine__c',
              url: '/services/data/v58.0/sobjects/SBQQ__QuoteLine__c/a6K8I000000I9dVUAS',
            },
            Id: 'a6K8I000000I9dVUAS',
            Product_Type__c: 'Bundle',
            SBQQ__Product__r: {
              attributes: {
                type: 'Product2',
                url: '/services/data/v58.0/sobjects/Product2/01t3m00000PPH5MAAX',
              },
              Id: '01t3m00000PPH5MAAX',
              ProductCode: '110-0000',
              Name: 'Restroom Bundle',
              Description: 'Restroom Bundle Configuration',
            },
            SBQQ__Quantity__c: 1,
            Tax__c: null,
            Taxable_Line__c: 'N',
            AVA_SFCPQ__TaxAmount__c: null,
            SBQQ__Quote_Lines__r: {
              totalSize: 6,
              done: true,
              records: [
                {
                  attributes: {
                    type: 'SBQQ__QuoteLine__c',
                    url: '/services/data/v58.0/sobjects/SBQQ__QuoteLine__c/a6K8I000000I9dYUAS',
                  },
                  Id: 'a6K8I000000I9dYUAS',
                  Product_Type__c: 'Ancillary Services',
                  SBQQ__ProductOption__r: {
                    attributes: {
                      type: 'SBQQ__ProductOption__c',
                      url: '/services/data/v58.0/sobjects/SBQQ__ProductOption__c/a6D8I0000008aSfUAI',
                    },
                    Id: 'a6D8I0000008aSfUAI',
                  },
                  SBQQ__Product__r: {
                    attributes: {
                      type: 'Product2',
                      url: '/services/data/v58.0/sobjects/Product2/01t6O000006aeezQAA',
                    },
                    Id: '01t6O000006aeezQAA',
                    ProductCode: '112-2209',
                    Name: 'Toilet Seat Cover Refill',
                    Description: 'Toilet Seat Cover Refill at time of service',
                  },
                  SBQQ__Quantity__c: 1,
                  Tax__c: 0,
                  Taxable_Line__c: 'N',
                  AVA_SFCPQ__TaxAmount__c: null,
                },
                {
                  attributes: {
                    type: 'SBQQ__QuoteLine__c',
                    url: '/services/data/v58.0/sobjects/SBQQ__QuoteLine__c/a6K8I000000I9dZUAS',
                  },
                  Id: 'a6K8I000000I9dZUAS',
                  Product_Type__c: 'Ancillary Asset',
                  SBQQ__ProductOption__r: {
                    attributes: {
                      type: 'SBQQ__ProductOption__c',
                      url: '/services/data/v58.0/sobjects/SBQQ__ProductOption__c/a6D8I0000008aS1UAI',
                    },
                    Id: 'a6D8I0000008aS1UAI',
                  },
                  SBQQ__Product__r: {
                    attributes: {
                      type: 'Product2',
                      url: '/services/data/v58.0/sobjects/Product2/01t3m00000OAZY4AAP',
                    },
                    Id: '01t3m00000OAZY4AAP',
                    ProductCode: '113-1803',
                    Name: 'Rest Lock and Key',
                    Description: 'Restroom Lock and Key',
                  },
                  SBQQ__Quantity__c: 1,
                  Tax__c: 0,
                  Taxable_Line__c: 'N',
                  AVA_SFCPQ__TaxAmount__c: null,
                },
                {
                  attributes: {
                    type: 'SBQQ__QuoteLine__c',
                    url: '/services/data/v58.0/sobjects/SBQQ__QuoteLine__c/a6K8I000000I9ddUAC',
                  },
                  Id: 'a6K8I000000I9ddUAC',
                  Product_Type__c: 'P n D',
                  SBQQ__ProductOption__r: {
                    attributes: {
                      type: 'SBQQ__ProductOption__c',
                      url: '/services/data/v58.0/sobjects/SBQQ__ProductOption__c/a6D8I0000008aV2UAI',
                    },
                    Id: 'a6D8I0000008aV2UAI',
                  },
                  SBQQ__Product__r: {
                    attributes: {
                      type: 'Product2',
                      url: '/services/data/v58.0/sobjects/Product2/01t3m00000POgxNAAT',
                    },
                    Id: '01t3m00000POgxNAAT',
                    ProductCode: '113-3010',
                    Name: 'Pick Rest per Unit',
                    Description: 'Pickup Restroom - Per Unit Charge',
                  },
                  SBQQ__Quantity__c: 1,
                  Tax__c: 0,
                  Taxable_Line__c: 'N',
                  AVA_SFCPQ__TaxAmount__c: null,
                },
                {
                  attributes: {
                    type: 'SBQQ__QuoteLine__c',
                    url: '/services/data/v58.0/sobjects/SBQQ__QuoteLine__c/a6K8I000000I9dbUAC',
                  },
                  Id: 'a6K8I000000I9dbUAC',
                  Product_Type__c: 'Service',
                  SBQQ__ProductOption__r: {
                    attributes: {
                      type: 'SBQQ__ProductOption__c',
                      url: '/services/data/v58.0/sobjects/SBQQ__ProductOption__c/a6D8I0000008aRVUAY',
                    },
                    Id: 'a6D8I0000008aRVUAY',
                  },
                  SBQQ__Product__r: {
                    attributes: {
                      type: 'Product2',
                      url: '/services/data/v58.0/sobjects/Product2/01t3m00000NTivwAAD',
                    },
                    Id: '01t3m00000NTivwAAD',
                    ProductCode: '112-2001',
                    Name: '1 Svc 1 Day Wk',
                    Description: '1 Service 1 Day per Week',
                  },
                  SBQQ__Quantity__c: 1,
                  Tax__c: 0,
                  Taxable_Line__c: 'N',
                  AVA_SFCPQ__TaxAmount__c: null,
                },
                {
                  attributes: {
                    type: 'SBQQ__QuoteLine__c',
                    url: '/services/data/v58.0/sobjects/SBQQ__QuoteLine__c/a6K8I000000I9dcUAC',
                  },
                  Id: 'a6K8I000000I9dcUAC',
                  Product_Type__c: 'P n D',
                  SBQQ__ProductOption__r: {
                    attributes: {
                      type: 'SBQQ__ProductOption__c',
                      url: '/services/data/v58.0/sobjects/SBQQ__ProductOption__c/a6D8I0000008aMRUAY',
                    },
                    Id: 'a6D8I0000008aMRUAY',
                  },
                  SBQQ__Product__r: {
                    attributes: {
                      type: 'Product2',
                      url: '/services/data/v58.0/sobjects/Product2/01t3m00000POgxIAAT',
                    },
                    Id: '01t3m00000POgxIAAT',
                    ProductCode: '113-3009',
                    Name: 'Del Rest per Unit',
                    Description: 'Delivery Restroom - Per Unit Charge',
                  },
                  SBQQ__Quantity__c: 1,
                  Tax__c: 0,
                  Taxable_Line__c: 'N',
                  AVA_SFCPQ__TaxAmount__c: null,
                },
                {
                  attributes: {
                    type: 'SBQQ__QuoteLine__c',
                    url: '/services/data/v58.0/sobjects/SBQQ__QuoteLine__c/a6K8I000000I9daUAC',
                  },
                  Id: 'a6K8I000000I9daUAC',
                  Product_Type__c: 'Asset',
                  SBQQ__ProductOption__r: {
                    attributes: {
                      type: 'SBQQ__ProductOption__c',
                      url: '/services/data/v58.0/sobjects/SBQQ__ProductOption__c/a6D8I0000008aKcUAI',
                    },
                    Id: 'a6D8I0000008aKcUAI',
                  },
                  SBQQ__Product__r: {
                    attributes: {
                      type: 'Product2',
                      url: '/services/data/v58.0/sobjects/Product2/01t3m00000NTiw6AAD',
                    },
                    Id: '01t3m00000NTiw6AAD',
                    ProductCode: '111-1001',
                    Name: 'Std Rest',
                    Description: 'Standard Restroom',
                  },
                  SBQQ__Quantity__c: 1,
                  Tax__c: 0,
                  Taxable_Line__c: 'N',
                  AVA_SFCPQ__TaxAmount__c: null,
                },
              ],
            },
          },
          {
            attributes: {
              type: 'SBQQ__QuoteLine__c',
              url: '/services/data/v58.0/sobjects/SBQQ__QuoteLine__c/a6K8I000000I9dWUAS',
            },
            Id: 'a6K8I000000I9dWUAS',
            Product_Type__c: 'P n D',
            SBQQ__Product__r: {
              attributes: {
                type: 'Product2',
                url: '/services/data/v58.0/sobjects/Product2/01t3m00000POgwyAAD',
              },
              Id: '01t3m00000POgwyAAD',
              ProductCode: '113-3005',
              Name: 'Pick Sani Standard',
              Description: 'Pickup Sanitation - Standard',
            },
            SBQQ__Quantity__c: 1,
            Tax__c: 0,
            Taxable_Line__c: 'N',
            AVA_SFCPQ__TaxAmount__c: null,
            SBQQ__Quote_Lines__r: null,
          },
          {
            attributes: {
              type: 'SBQQ__QuoteLine__c',
              url: '/services/data/v58.0/sobjects/SBQQ__QuoteLine__c/a6K8I000000I9dXUAS',
            },
            Id: 'a6K8I000000I9dXUAS',
            Product_Type__c: 'P n D',
            SBQQ__Product__r: {
              attributes: {
                type: 'Product2',
                url: '/services/data/v58.0/sobjects/Product2/01t3m00000POgwjAAD',
              },
              Id: '01t3m00000POgwjAAD',
              ProductCode: '113-3001',
              Name: 'Del Sani Standard',
              Description: 'Delivery Sanitation - Standard',
            },
            SBQQ__Quantity__c: 1,
            Tax__c: 0,
            Taxable_Line__c: 'N',
            AVA_SFCPQ__TaxAmount__c: null,
            SBQQ__Quote_Lines__r: null,
          },
        ],
      },
      PrimarySiteContact__r: null,
      Ship_To_Contact__r: null,
      SBQQ__PrimaryContact__r: {
        attributes: {
          type: 'Contact',
          url: '/services/data/v58.0/sobjects/Contact/0038I00000fqEukQAE',
        },
        Id: '0038I00000fqEukQAE',
        Phone: '9202232000',
        Email: 'gaurav.narvekar+86@zingworks.in',
        FirstName: 'Maria',
        LastName: 'Jackson',
        MailingStreet: null,
        MailingCity: null,
        MailingState: null,
        MailingStateCode: null,
        MailingPostalCode: null,
      },
      Bill_To_Address__r: null,
      Shipping_Address__r: {
        attributes: {
          type: 'USF_Address__c',
          url: '/services/data/v58.0/sobjects/USF_Address__c/a8x8I000000CpqUQAS',
        },
        Id: 'a8x8I000000CpqUQAS',
        USF_Account__c: '0018I00000jyo1TQAQ',
        Name: '135 Pleasant Street, Broo - Brookline - MA',
        NF_Parent_USF_Address__c: null,
        USF_Street__c: '135 Pleasant Street, Brookline, MA, USA',
        USF_City__c: 'Brookline',
        USF_State__c: 'MA',
        USF_Zip_Code__c: '02446',
        USF_Country__c: 'US',
        Address_Latitude_Longitude__Latitude__s: 42.34715,
        Address_Latitude_Longitude__Longitude__s: -71.11782,
        Is_Primary__c: false,
        USF_Ship_To_Address__c: true,
        USF_Bill_To_Address__c: false,
        NF_Is_Parent__c: true,
        Address_Validated__c: true,
        GeoCode_Accuracy__c: 'Address',
        Site_Name__c: '135 Pleasant Street, Brookline, MA, USA',
        NF_Site_Hours_Start_Time__c: null,
        NF_Site_Hours_End_Time__c: null,
        NF_Arrival_Start_Time__c: null,
        NF_Arrival_End_Time__c: null,
        NF_Gate_Code__c: 'Gate 5',
        NF_Access_instructions__c: null,
        NF_Key_Instructions__c: null,
        NF_Other_Instructions__c: null,
        NF_Placement__c: 'test',
        NF_Background_Check__c: true,
        NF_Clearance_Required__c: true,
      },
      NF_Quoted_Jobsites__r: {
        totalSize: 1,
        done: true,
        records: [
          {
            attributes: {
              type: 'NF_Quoted_Jobsite__c',
              url: '/services/data/v58.0/sobjects/NF_Quoted_Jobsite__c/aFJ8I0000006PiDWAU',
            },
            Id: 'aFJ8I0000006PiDWAU',
            Name: 'QJ-261443',
            NF_Quote__c: 'a6O8I000000HG7FUAW',
            NF_End_Date__c: '2049-12-31',
            NF_Start_Date__c: '2023-12-27',
            NF_Quote_Line__c: 'a6K8I000000I9dVUAS',
            NF_USF_Address__r: {
              attributes: {
                type: 'USF_Address__c',
                url: '/services/data/v58.0/sobjects/USF_Address__c/a8x8I000000CpqUQAS',
              },
              Id: 'a8x8I000000CpqUQAS',
              USF_Account__c: '0018I00000jyo1TQAQ',
              Name: '135 Pleasant Street, Broo - Brookline - MA',
              NF_Parent_USF_Address__c: null,
              USF_Street__c: '135 Pleasant Street, Brookline, MA, USA',
              USF_City__c: 'Brookline',
              USF_State__c: 'MA',
              USF_Zip_Code__c: '02446',
              USF_Country__c: 'US',
              Address_Latitude_Longitude__Latitude__s: 42.34715,
              Address_Latitude_Longitude__Longitude__s: -71.11782,
              Is_Primary__c: false,
              USF_Ship_To_Address__c: true,
              USF_Bill_To_Address__c: false,
              NF_Is_Parent__c: true,
              Address_Validated__c: true,
              GeoCode_Accuracy__c: 'Address',
              Site_Name__c: '135 Pleasant Street, Brookline, MA, USA',
              NF_Site_Hours_Start_Time__c: null,
              NF_Site_Hours_End_Time__c: null,
              NF_Arrival_Start_Time__c: null,
              NF_Arrival_End_Time__c: null,
              NF_Gate_Code__c: 'Gate 5',
              NF_Access_instructions__c: null,
              NF_Key_Instructions__c: null,
              NF_Other_Instructions__c: null,
              NF_Background_Check__c: true,
              NF_Clearance_Required__c: true,
              NF_Placement__c: 'test',
            },
          },
        ],
      },
      SBQQ__R00N70000001lX7YEAU__r: null,
    };

    mockSfdcQuoteService.getQuoteDetails.mockResolvedValue(mockGetQuoteDetails);
    mockQuoteService.getQuoteDetailsById.mockResolvedValue(getQuoteDetailsSuccessResponse);

    const result = await controller.getQuote('a6O8I000000HDlUUAW');
    expect(result.message).toMatch('Success');
    expect(result.data).toHaveProperty('quoteId');
    expect(result.data).toHaveProperty('lineItems');
    expect(result.data).toHaveProperty('siteAddress');
    expect(result.data).toHaveProperty('siteContact');
    expect(result.data).toHaveProperty('billingAddress');
    expect(result.data).toHaveProperty('billingContact');
    expect(result.data).toHaveProperty('emailToCC');
    expect(result.data).toHaveProperty('poNumber');
  });
  //get quote details fail
  it('Should return fail', async () => {
    let mockGetQuoteDetails = {
      attributes: {
        type: 'SBQQ__Quote__c',
        url: '/services/data/v58.0/sobjects/SBQQ__Quote__c/a6O8I000000HG7FUAW',
      },
      Id: 'a6O8I000000HG7FUAW',
      Name: 'Q-515131',
      Site_Complete__c: false,
      Reference_Number__c: '515131',
      BillCycleDay__c: null,
      Billing_Approval_Status__c: 'Not Submitted',
      Billing_Complete__c: false,
      isCheckPaymentMethod__c: false,
      Billing_Period__c: '28 Day Bill Period',
      Charge_Type__c: 'Recurring',
      Bill_Timing__c: 'Bill in Advance',
      EEC_Percent__c: 0,
      ESF_Percent__c: 0,
      Fuel_Surcharge_Percent__c: 14.9,
      InvoiceDeliveryMethod__c: 'Email',
      LastBillingDate__c: null,
      Location_Code__c: 'FOX',
      Bill_To_Contact_Email__c: null,
      SBQQ__Status__c: 'Draft',
      Order_Type__c: 'Recurring without End Date',
      Facility_Name__c: null,
      Subdivision_Name__c: null,
      AutoPay__c: true,
      Payment_Method_Id__c: null,
      SBQQ__StartDate__c: '2023-12-27',
      SBQQ__EndDate__c: '2049-12-31',
      Duration__c: '24+ Months',
      SBQQ__Account__c: '0018I00000jyo1TQAQ',
      CreatedDate: '2023-12-22T08:26:39.000+0000',
      LastModifiedDate: '2023-12-22T08:28:32.000+0000',
      SBQQ__Account__r: {
        attributes: {
          type: 'Account',
          url: '/services/data/v58.0/sobjects/Account/0018I00000jyo1TQAQ',
        },
        Bill_to_Email_Address_1__c: 'test1@gmail.com',
        Bill_to_Email_Address_2__c: null,
        Bill_to_Email_Address_3__c: null,
        Bill_to_Email_Address_4__c: null,
        Bill_to_Email_Address_5__c: null,
        Bill_to_Email_Address_6__c: null,
      },
      Purchase_Order__r: null,
      SBQQ__LineItems__r: {
        totalSize: 3,
        done: true,
        records: [
          {
            attributes: {
              type: 'SBQQ__QuoteLine__c',
              url: '/services/data/v58.0/sobjects/SBQQ__QuoteLine__c/a6K8I000000I9dVUAS',
            },
            Id: 'a6K8I000000I9dVUAS',
            Product_Type__c: 'Bundle',
            SBQQ__Product__r: {
              attributes: {
                type: 'Product2',
                url: '/services/data/v58.0/sobjects/Product2/01t3m00000PPH5MAAX',
              },
              Id: '01t3m00000PPH5MAAX',
              ProductCode: '110-0000',
              Name: 'Restroom Bundle',
              Description: 'Restroom Bundle Configuration',
            },
            SBQQ__Quantity__c: 1,
            Tax__c: null,
            Taxable_Line__c: 'N',
            AVA_SFCPQ__TaxAmount__c: null,
            SBQQ__Quote_Lines__r: {
              totalSize: 6,
              done: true,
              records: [
                {
                  attributes: {
                    type: 'SBQQ__QuoteLine__c',
                    url: '/services/data/v58.0/sobjects/SBQQ__QuoteLine__c/a6K8I000000I9dYUAS',
                  },
                  Id: 'a6K8I000000I9dYUAS',
                  Product_Type__c: 'Ancillary Services',
                  SBQQ__ProductOption__r: {
                    attributes: {
                      type: 'SBQQ__ProductOption__c',
                      url: '/services/data/v58.0/sobjects/SBQQ__ProductOption__c/a6D8I0000008aSfUAI',
                    },
                    Id: 'a6D8I0000008aSfUAI',
                  },
                  SBQQ__Product__r: {
                    attributes: {
                      type: 'Product2',
                      url: '/services/data/v58.0/sobjects/Product2/01t6O000006aeezQAA',
                    },
                    Id: '01t6O000006aeezQAA',
                    ProductCode: '112-2209',
                    Name: 'Toilet Seat Cover Refill',
                    Description: 'Toilet Seat Cover Refill at time of service',
                  },
                  SBQQ__Quantity__c: 1,
                  Tax__c: 0,
                  Taxable_Line__c: 'N',
                  AVA_SFCPQ__TaxAmount__c: null,
                },
                {
                  attributes: {
                    type: 'SBQQ__QuoteLine__c',
                    url: '/services/data/v58.0/sobjects/SBQQ__QuoteLine__c/a6K8I000000I9dZUAS',
                  },
                  Id: 'a6K8I000000I9dZUAS',
                  Product_Type__c: 'Ancillary Asset',
                  SBQQ__ProductOption__r: {
                    attributes: {
                      type: 'SBQQ__ProductOption__c',
                      url: '/services/data/v58.0/sobjects/SBQQ__ProductOption__c/a6D8I0000008aS1UAI',
                    },
                    Id: 'a6D8I0000008aS1UAI',
                  },
                  SBQQ__Product__r: {
                    attributes: {
                      type: 'Product2',
                      url: '/services/data/v58.0/sobjects/Product2/01t3m00000OAZY4AAP',
                    },
                    Id: '01t3m00000OAZY4AAP',
                    ProductCode: '113-1803',
                    Name: 'Rest Lock and Key',
                    Description: 'Restroom Lock and Key',
                  },
                  SBQQ__Quantity__c: 1,
                  Tax__c: 0,
                  Taxable_Line__c: 'N',
                  AVA_SFCPQ__TaxAmount__c: null,
                },
                {
                  attributes: {
                    type: 'SBQQ__QuoteLine__c',
                    url: '/services/data/v58.0/sobjects/SBQQ__QuoteLine__c/a6K8I000000I9ddUAC',
                  },
                  Id: 'a6K8I000000I9ddUAC',
                  Product_Type__c: 'P n D',
                  SBQQ__ProductOption__r: {
                    attributes: {
                      type: 'SBQQ__ProductOption__c',
                      url: '/services/data/v58.0/sobjects/SBQQ__ProductOption__c/a6D8I0000008aV2UAI',
                    },
                    Id: 'a6D8I0000008aV2UAI',
                  },
                  SBQQ__Product__r: {
                    attributes: {
                      type: 'Product2',
                      url: '/services/data/v58.0/sobjects/Product2/01t3m00000POgxNAAT',
                    },
                    Id: '01t3m00000POgxNAAT',
                    ProductCode: '113-3010',
                    Name: 'Pick Rest per Unit',
                    Description: 'Pickup Restroom - Per Unit Charge',
                  },
                  SBQQ__Quantity__c: 1,
                  Tax__c: 0,
                  Taxable_Line__c: 'N',
                  AVA_SFCPQ__TaxAmount__c: null,
                },
                {
                  attributes: {
                    type: 'SBQQ__QuoteLine__c',
                    url: '/services/data/v58.0/sobjects/SBQQ__QuoteLine__c/a6K8I000000I9dbUAC',
                  },
                  Id: 'a6K8I000000I9dbUAC',
                  Product_Type__c: 'Service',
                  SBQQ__ProductOption__r: {
                    attributes: {
                      type: 'SBQQ__ProductOption__c',
                      url: '/services/data/v58.0/sobjects/SBQQ__ProductOption__c/a6D8I0000008aRVUAY',
                    },
                    Id: 'a6D8I0000008aRVUAY',
                  },
                  SBQQ__Product__r: {
                    attributes: {
                      type: 'Product2',
                      url: '/services/data/v58.0/sobjects/Product2/01t3m00000NTivwAAD',
                    },
                    Id: '01t3m00000NTivwAAD',
                    ProductCode: '112-2001',
                    Name: '1 Svc 1 Day Wk',
                    Description: '1 Service 1 Day per Week',
                  },
                  SBQQ__Quantity__c: 1,
                  Tax__c: 0,
                  Taxable_Line__c: 'N',
                  AVA_SFCPQ__TaxAmount__c: null,
                },
                {
                  attributes: {
                    type: 'SBQQ__QuoteLine__c',
                    url: '/services/data/v58.0/sobjects/SBQQ__QuoteLine__c/a6K8I000000I9dcUAC',
                  },
                  Id: 'a6K8I000000I9dcUAC',
                  Product_Type__c: 'P n D',
                  SBQQ__ProductOption__r: {
                    attributes: {
                      type: 'SBQQ__ProductOption__c',
                      url: '/services/data/v58.0/sobjects/SBQQ__ProductOption__c/a6D8I0000008aMRUAY',
                    },
                    Id: 'a6D8I0000008aMRUAY',
                  },
                  SBQQ__Product__r: {
                    attributes: {
                      type: 'Product2',
                      url: '/services/data/v58.0/sobjects/Product2/01t3m00000POgxIAAT',
                    },
                    Id: '01t3m00000POgxIAAT',
                    ProductCode: '113-3009',
                    Name: 'Del Rest per Unit',
                    Description: 'Delivery Restroom - Per Unit Charge',
                  },
                  SBQQ__Quantity__c: 1,
                  Tax__c: 0,
                  Taxable_Line__c: 'N',
                  AVA_SFCPQ__TaxAmount__c: null,
                },
                {
                  attributes: {
                    type: 'SBQQ__QuoteLine__c',
                    url: '/services/data/v58.0/sobjects/SBQQ__QuoteLine__c/a6K8I000000I9daUAC',
                  },
                  Id: 'a6K8I000000I9daUAC',
                  Product_Type__c: 'Asset',
                  SBQQ__ProductOption__r: {
                    attributes: {
                      type: 'SBQQ__ProductOption__c',
                      url: '/services/data/v58.0/sobjects/SBQQ__ProductOption__c/a6D8I0000008aKcUAI',
                    },
                    Id: 'a6D8I0000008aKcUAI',
                  },
                  SBQQ__Product__r: {
                    attributes: {
                      type: 'Product2',
                      url: '/services/data/v58.0/sobjects/Product2/01t3m00000NTiw6AAD',
                    },
                    Id: '01t3m00000NTiw6AAD',
                    ProductCode: '111-1001',
                    Name: 'Std Rest',
                    Description: 'Standard Restroom',
                  },
                  SBQQ__Quantity__c: 1,
                  Tax__c: 0,
                  Taxable_Line__c: 'N',
                  AVA_SFCPQ__TaxAmount__c: null,
                },
              ],
            },
          },
          {
            attributes: {
              type: 'SBQQ__QuoteLine__c',
              url: '/services/data/v58.0/sobjects/SBQQ__QuoteLine__c/a6K8I000000I9dWUAS',
            },
            Id: 'a6K8I000000I9dWUAS',
            Product_Type__c: 'P n D',
            SBQQ__Product__r: {
              attributes: {
                type: 'Product2',
                url: '/services/data/v58.0/sobjects/Product2/01t3m00000POgwyAAD',
              },
              Id: '01t3m00000POgwyAAD',
              ProductCode: '113-3005',
              Name: 'Pick Sani Standard',
              Description: 'Pickup Sanitation - Standard',
            },
            SBQQ__Quantity__c: 1,
            Tax__c: 0,
            Taxable_Line__c: 'N',
            AVA_SFCPQ__TaxAmount__c: null,
            SBQQ__Quote_Lines__r: null,
          },
          {
            attributes: {
              type: 'SBQQ__QuoteLine__c',
              url: '/services/data/v58.0/sobjects/SBQQ__QuoteLine__c/a6K8I000000I9dXUAS',
            },
            Id: 'a6K8I000000I9dXUAS',
            Product_Type__c: 'P n D',
            SBQQ__Product__r: {
              attributes: {
                type: 'Product2',
                url: '/services/data/v58.0/sobjects/Product2/01t3m00000POgwjAAD',
              },
              Id: '01t3m00000POgwjAAD',
              ProductCode: '113-3001',
              Name: 'Del Sani Standard',
              Description: 'Delivery Sanitation - Standard',
            },
            SBQQ__Quantity__c: 1,
            Tax__c: 0,
            Taxable_Line__c: 'N',
            AVA_SFCPQ__TaxAmount__c: null,
            SBQQ__Quote_Lines__r: null,
          },
        ],
      },
      PrimarySiteContact__r: null,
      Ship_To_Contact__r: null,
      SBQQ__PrimaryContact__r: {
        attributes: {
          type: 'Contact',
          url: '/services/data/v58.0/sobjects/Contact/0038I00000fqEukQAE',
        },
        Id: '0038I00000fqEukQAE',
        Phone: '9202232000',
        Email: 'gaurav.narvekar+86@zingworks.in',
        FirstName: 'Maria',
        LastName: 'Jackson',
        MailingStreet: null,
        MailingCity: null,
        MailingState: null,
        MailingStateCode: null,
        MailingPostalCode: null,
      },
      Bill_To_Address__r: null,
      Shipping_Address__r: {
        attributes: {
          type: 'USF_Address__c',
          url: '/services/data/v58.0/sobjects/USF_Address__c/a8x8I000000CpqUQAS',
        },
        Id: 'a8x8I000000CpqUQAS',
        USF_Account__c: '0018I00000jyo1TQAQ',
        Name: '135 Pleasant Street, Broo - Brookline - MA',
        NF_Parent_USF_Address__c: null,
        USF_Street__c: '135 Pleasant Street, Brookline, MA, USA',
        USF_City__c: 'Brookline',
        USF_State__c: 'MA',
        USF_Zip_Code__c: '02446',
        USF_Country__c: 'US',
        Address_Latitude_Longitude__Latitude__s: 42.34715,
        Address_Latitude_Longitude__Longitude__s: -71.11782,
        Is_Primary__c: false,
        USF_Ship_To_Address__c: true,
        USF_Bill_To_Address__c: false,
        NF_Is_Parent__c: true,
        Address_Validated__c: true,
        GeoCode_Accuracy__c: 'Address',
        Site_Name__c: '135 Pleasant Street, Brookline, MA, USA',
        NF_Site_Hours_Start_Time__c: null,
        NF_Site_Hours_End_Time__c: null,
        NF_Arrival_Start_Time__c: null,
        NF_Arrival_End_Time__c: null,
        NF_Gate_Code__c: 'Gate 5',
        NF_Access_instructions__c: null,
        NF_Key_Instructions__c: null,
        NF_Other_Instructions__c: null,
        NF_Placement__c: 'test',
        NF_Background_Check__c: true,
        NF_Clearance_Required__c: true,
      },
      NF_Quoted_Jobsites__r: {
        totalSize: 1,
        done: true,
        records: [
          {
            attributes: {
              type: 'NF_Quoted_Jobsite__c',
              url: '/services/data/v58.0/sobjects/NF_Quoted_Jobsite__c/aFJ8I0000006PiDWAU',
            },
            Id: 'aFJ8I0000006PiDWAU',
            Name: 'QJ-261443',
            NF_Quote__c: 'a6O8I000000HG7FUAW',
            NF_End_Date__c: '2049-12-31',
            NF_Start_Date__c: '2023-12-27',
            NF_Quote_Line__c: 'a6K8I000000I9dVUAS',
            NF_USF_Address__r: {
              attributes: {
                type: 'USF_Address__c',
                url: '/services/data/v58.0/sobjects/USF_Address__c/a8x8I000000CpqUQAS',
              },
              Id: 'a8x8I000000CpqUQAS',
              USF_Account__c: '0018I00000jyo1TQAQ',
              Name: '135 Pleasant Street, Broo - Brookline - MA',
              NF_Parent_USF_Address__c: null,
              USF_Street__c: '135 Pleasant Street, Brookline, MA, USA',
              USF_City__c: 'Brookline',
              USF_State__c: 'MA',
              USF_Zip_Code__c: '02446',
              USF_Country__c: 'US',
              Address_Latitude_Longitude__Latitude__s: 42.34715,
              Address_Latitude_Longitude__Longitude__s: -71.11782,
              Is_Primary__c: false,
              USF_Ship_To_Address__c: true,
              USF_Bill_To_Address__c: false,
              NF_Is_Parent__c: true,
              Address_Validated__c: true,
              GeoCode_Accuracy__c: 'Address',
              Site_Name__c: '135 Pleasant Street, Brookline, MA, USA',
              NF_Site_Hours_Start_Time__c: null,
              NF_Site_Hours_End_Time__c: null,
              NF_Arrival_Start_Time__c: null,
              NF_Arrival_End_Time__c: null,
              NF_Gate_Code__c: 'Gate 5',
              NF_Access_instructions__c: null,
              NF_Key_Instructions__c: null,
              NF_Other_Instructions__c: null,
              NF_Background_Check__c: true,
              NF_Clearance_Required__c: true,
              NF_Placement__c: 'test',
            },
          },
        ],
      },
      SBQQ__R00N70000001lX7YEAU__r: null,
    };

    mockSfdcQuoteService.getQuoteDetails.mockResolvedValue(mockGetQuoteDetails);

    mockQuoteService.getQuoteDetailsById.mockResolvedValue(getQuoteDetailsFailResponse);

    const result = await controller.getQuote('');
    expect(result.message).toMatch('Fail');
    expect(result.status).toBe(1006);
  });
  //save status success
  it('Should return success', async () => {
    let req = {
      user: {
        sub: '123',
      },
    };
    let mockUpdateQuoteStatus = { id: 'a6O8I000000HG7FUAW', success: true, errors: [] };

    mockSfdcQuoteService.updateQuoteStatus.mockResolvedValue(mockUpdateQuoteStatus);

    mockQuoteService.updateQuoteStatus.mockResolvedValue(updateQuoteStatusSuccessResponse);

    const result = await controller.updateQuoteStatus(req, {
      quoteId: 'a6O8I000000HG7FUAW', status: 'Approved',
      rejectReason: '',
      rejectReasonFeedback:''
    });
    expect(result.message).toMatch('Success');
  });
  //save status fail
  it('Should return fail', async () => {
    let req = {
      user: {
        sub: '123',
      },
    };
    let mockUpdateQuoteStatus = { id: 'a6O8I000000HG7FUAW', success: false, errors: [] };

    mockSfdcQuoteService.updateQuoteStatus.mockResolvedValue(mockUpdateQuoteStatus);

    mockQuoteService.updateQuoteStatus.mockResolvedValue(updateQuoteStatusFailResponse);

    const result = await controller.updateQuoteStatus(req, {
      quoteId: '', status: '',
      rejectReason: '',
      rejectReasonFeedback:''
    });
    expect(result.message).toMatch('Fail');
  });

  // Save site details success
  it('Should return site details', async () => {
    let Request: SiteDetailsReqDTO = {
      requestId: '',
      startDate: '',
      endDate: '',
      contactData: new ContactDTO(),
      addressData: new AddressDTO(),
      quoteId: '',
      contactId: '',
      addressId: '',
      contactExist: false,
      subSites: [],
      ussPortalUserId: ''
    };

    let req = {
      user: {
        sub: '123',
      },
    };

    let userDetailModelResp = {
      emailVerified: true,
      ussPortalUserId: 'aHQ8I000000L6WeWAK',
      email: 'gaurav.narvekar+86@zingworks.in',
      firstName: 'Gaurav +86',
      lastName: 'Jackson',
      phone: '9202232000',
      id: '0038I00000fqEukQAE',
      accountId: '0018I00000jyo1TQAQ',
      accountName: 'MyUSS Zingworks Test99 Account',
      autoPayRequirement: 'N/A',
      businessType: 'Entertainment',
      customerType: 'Business',
      emailForCC: ['test1@gmail.com', 'test2@gmail.com', 'test3@gmail.com'],
      contactId: '0038I00000fqEukQAE',
      accountNumber: 'ACT-01640876',
      accounts: [
        {
          contactId: '0038I00000fqEukQAE',
          firstName: 'Gaurav +86',
          lastName: 'Jackson',
          phone: '9202232000',
          email: 'gaurav.narvekar+86@zingworks.in',
          accountId: '0018I00000jyo1TQAQ',
          accountName: 'MyUSS Zingworks Test99 Account',
          accountNumber: 'ACT-01640876',
          autoPayRequirement: 'N/A',
          businessType: 'Entertainment',
          customerType: 'Business',
          emailForCC: ['test1@gmail.com', 'test2@gmail.com', 'test3@gmail.com'],
          myussEnabled: true,
          myussQuotesEnabled: true,
          myussHomeEnabled: true,
          myussEasyPayEnabled: true,
          myussBillingEnabled: true,
          myussOrdersEnabled: true,
          myussCasesEnabled: true,
          myussProjectsEnabled: true,
          poRequired: false,
        },
      ],
      myussEnabled: true,
      myussQuotesEnabled: true,
      myussHomeEnabled: true,
      myussEasyPayEnabled: true,
      myussBillingEnabled: true,
      myussOrdersEnabled: true,
      myussCasesEnabled: true,
      myussProjectsEnabled: true,
      poRequired: false,
      accountDetails: [],
    };

    let saveSiteDetailsResp = {
      success: true,
      status: 1000,
      message: 'Success',
      data: {
        requestId: '$2a$10$H.SkwEj/HuzrXwgsoLDsR.x3TnB8CE7QWeiuJ3T9UdDu0HU.t/Xhrz',
        startDate: '2024-03-22',
        endDate: '2024-04-22',
        contactData: {
          firstName: 'Rohini3',
          lastName: 'Nagtilak',
          email: 'rohini.nagtilak+3@zingworks.in',
          phone: '6767454534',
          accountId: '0018I00000jyo1TQAQ',
        },
        addressData: {
          gateCode: '',
          information: '',
          instructions: 'Near gate1.',
          siteEndTime: '',
          siteStartTime: '',
          idRequired: false,
          clearanceRequired: false,
          shipToContact: '003VA000004EDNaYAO',
          siteContact: '003VA000004EDNaYAO',
        },
        quoteId: 'a6OVA0000001gMz2AI',
        contactRefId: '003VA000004EDNaYAO',
        addressRefId: 'a8xVA000000CMzFYAW',
        contactExist: true,
        subSites: [
          {
            "addressId" : "a8xVA000000Do73YAC",
            "siteName" : "Site First",
            bundles: [
              {
                qty: 1,
                bundleId: '01t3m00000PPH5MAAX',
                bundleName: 'Restroom Bundle',
                assetId: '01t3m00000NTiw6AAD',
                assetName: 'Standard Restroom',
                serviceId: '01t3m00000POgudAAD',
                serviceName: '1 Service 2 Days per Week',
                quoteLineId: 'a6KVA00000032Of2AI',
              },
              {
                qty: 1,
                bundleId: '01t3m00000PPH5RAAX',
                bundleName: 'Hand Cleaning Bundle',
                assetId: '01t3m00000NTiuFAAT',
                assetName: '2 Station Hand Wash Sink',
                serviceId: '01t3m00000POgyQAAT',
                serviceName: '1 Service 2 Days per Week',
                quoteLineId: 'a6KVA00000032Og2AI',
              },
              {
                qty: 1,
                bundleId: '01t3m00000PPH5WAAX',
                bundleName: 'Tank Bundle',
                assetId: '01t3m00000POh0vAAD',
                assetName: '250 Gallon Waste Holding Tank',
                serviceId: '01t3m00000POgyIAAT',
                serviceName: '1 Service 2 Days per Week',
                quoteLineId: 'a6KVA00000032Oh2AI',
              },
            ],
          },
          {
            "addressId" : "a8xVA000000E2efYAC",
            "siteName" : "Site Second",
            bundles: [
              {
                qty: 1,
                bundleId: '01t3m00000PPH5MAAX',
                bundleName: 'Restroom Bundle',
                assetId: '01t3m00000NTiw6AAD',
                assetName: 'Standard Restroom',
                serviceId: '01t3m00000POgudAAD',
                serviceName: '1 Service 2 Days per Week',
                quoteLineId: 'a6KVA00000032Of2AI',
              },
              {
                qty: 1,
                bundleId: '01t3m00000PPH5RAAX',
                bundleName: 'Hand Cleaning Bundle',
                assetId: '01t3m00000NTiuFAAT',
                assetName: '2 Station Hand Wash Sink',
                serviceId: '01t3m00000POgyQAAT',
                serviceName: '1 Service 2 Days per Week',
                quoteLineId: 'a6KVA00000032Og2AI',
              },
            ],
            contactExist: true,
            contactRefId: '0038I00000fqNgwQAE',
            contactData: {
              firstName: 'Maria2',
              lastName: 'Jackson2',
              email: 'gaurav.narvekar+86@zingworks.in',
              phone: '+9202232000',
              accountId: '0018I00000jyo1TQAQ',
            },
          },
        ],
      },
    };

    mockCacheService.get.mockResolvedValue(JSON.stringify(userDetailModelResp));
    mockQuoteService.updateSiteDetails.mockResolvedValue(saveSiteDetailsResp);
    const result = await controller.saveSiteDetails(Request, req);
    expect(result.message).toMatch('Success');
  });
  //save site details fail
  it('Should return fail', async () => {
    let req = {
      user: {
        sub: '123',
      },
    };
    let userDetailModelResp = {
      emailVerified: true,
      ussPortalUserId: 'aHQ8I000000L6WeWAK',
      email: 'gaurav.narvekar+86@zingworks.in',
      firstName: 'Gaurav +86',
      lastName: 'Jackson',
      phone: '9202232000',
      id: '0038I00000fqEukQAE',
      accountId: '0018I00000jyo1TQAQ',
      accountName: 'MyUSS Zingworks Test99 Account',
      autoPayRequirement: 'N/A',
      businessType: 'Entertainment',
      customerType: 'Business',
      emailForCC: ['test1@gmail.com', 'test2@gmail.com', 'test3@gmail.com'],
      contactId: '0038I00000fqEukQAE',
      accountNumber: 'ACT-01640876',
      accounts: [
        {
          contactId: '0038I00000fqEukQAE',
          firstName: 'Gaurav +86',
          lastName: 'Jackson',
          phone: '9202232000',
          email: 'gaurav.narvekar+86@zingworks.in',
          accountId: '0018I00000jyo1TQAQ',
          accountName: 'MyUSS Zingworks Test99 Account',
          accountNumber: 'ACT-01640876',
          autoPayRequirement: 'N/A',
          businessType: 'Entertainment',
          customerType: 'Business',
          emailForCC: ['test1@gmail.com', 'test2@gmail.com', 'test3@gmail.com'],
          myussEnabled: true,
          myussQuotesEnabled: true,
          myussHomeEnabled: true,
          myussEasyPayEnabled: true,
          myussBillingEnabled: true,
          myussOrdersEnabled: true,
          myussCasesEnabled: true,
          myussProjectsEnabled: true,
          poRequired: false,
        },
      ],
      myussEnabled: true,
      myussQuotesEnabled: true,
      myussHomeEnabled: true,
      myussEasyPayEnabled: true,
      myussBillingEnabled: true,
      myussOrdersEnabled: true,
      myussCasesEnabled: true,
      myussProjectsEnabled: true,
      poRequired: false,
      accountDetails: [],
    };
    let saveSiteDetailsResp = {
      success: false,
      status: 1009,
      message: 'Failed to update site details',
      data: {},
    };
    let Request: SiteDetailsReqDTO = {
      requestId: '',
      startDate: '',
      endDate: '',
      contactData: new ContactDTO(),
      addressData: new AddressDTO(),
      quoteId: '',
      contactId: '',
      addressId: '',
      contactExist: false,
      subSites: [],
      ussPortalUserId: ''
    };

    mockCacheService.get.mockResolvedValue(JSON.stringify(userDetailModelResp));
    mockQuoteService.updateSiteDetails.mockResolvedValue(saveSiteDetailsResp);
    const result = await controller.saveSiteDetails(Request, req);
    expect(result.message).toMatch('Fail');
  });
  //save bill details success
  it('Should return success for stroring billing details ', async () => {
    let req = {
      user: {
        sub: '123',
      },
    };
    let saveBillingDetailsRequest: BillingDetailsReqDTO = {
      requestId: '',
      quoteId: '',
      accountId: '',
      contactRefId: '',
      addressRefId: '',
      addressExist: false,
      newBillingAddressForAccount: false,
      address: new AddressDetailsDTO(),
      poNumber: '',
      emailIds: [],
      paymentMethodId: '',
      isAutoPay: false,
      secondaryContactData: new ContactDTO,
      secondaryContactExist: false,
      secondaryContactId: ''
    };
    let userDetailModelResp = {
      emailVerified: true,
      ussPortalUserId: 'aHQ8I000000L6WeWAK',
      email: 'gaurav.narvekar+86@zingworks.in',
      firstName: 'Gaurav +86',
      lastName: 'Jackson',
      phone: '9202232000',
      id: '0038I00000fqEukQAE',
      accountId: '0018I00000jyo1TQAQ',
      accountName: 'MyUSS Zingworks Test99 Account',
      autoPayRequirement: 'N/A',
      businessType: 'Entertainment',
      customerType: 'Business',
      emailForCC: ['test1@gmail.com', 'test2@gmail.com', 'test3@gmail.com'],
      contactId: '0038I00000fqEukQAE',
      accountNumber: 'ACT-01640876',
      accounts: [
        {
          contactId: '0038I00000fqEukQAE',
          firstName: 'Gaurav +86',
          lastName: 'Jackson',
          phone: '9202232000',
          email: 'gaurav.narvekar+86@zingworks.in',
          accountId: '0018I00000jyo1TQAQ',
          accountName: 'MyUSS Zingworks Test99 Account',
          accountNumber: 'ACT-01640876',
          autoPayRequirement: 'N/A',
          businessType: 'Entertainment',
          customerType: 'Business',
          emailForCC: ['test1@gmail.com', 'test2@gmail.com', 'test3@gmail.com'],
          myussEnabled: true,
          myussQuotesEnabled: true,
          myussHomeEnabled: true,
          myussEasyPayEnabled: true,
          myussBillingEnabled: true,
          myussOrdersEnabled: true,
          myussCasesEnabled: true,
          myussProjectsEnabled: true,
          poRequired: false,
        },
      ],
      myussEnabled: true,
      myussQuotesEnabled: true,
      myussHomeEnabled: true,
      myussEasyPayEnabled: true,
      myussBillingEnabled: true,
      myussOrdersEnabled: true,
      myussCasesEnabled: true,
      myussProjectsEnabled: true,
      poRequired: false,
      accountDetails: [],
    };
    let mockUpdateBillingAddress = true;
    mockCacheService.get.mockResolvedValue(JSON.stringify(userDetailModelResp));

    mockSfdcQuoteService.updateBillingAddress.mockResolvedValue(mockUpdateBillingAddress);

    mockQuoteService.updateBillingAddress.mockResolvedValue(saveBillingDetailsSuccessResponse);

    const result = await controller.saveBillingDetails(req, saveBillingDetailsRequest);
    expect(result.message).toMatch('Success');
  });
  //save bill details fail
  it('Should return fail', async () => {
    let req = {
      user: {
        sub: '123',
      },
    };
    let Request: BillingDetailsReqDTO = {
      quoteId: '',
      requestId: '',
      accountId: '',
      contactRefId: '',
      addressRefId: '',
      addressExist: false,
      newBillingAddressForAccount: false,
      address: new AddressDetailsDTO(),
      poNumber: '',
      emailIds: [],
      paymentMethodId: '',
      isAutoPay: false,
      secondaryContactData: new ContactDTO,
      secondaryContactExist: false,
      secondaryContactId: ''
    };
    let QuoteServiceResp = {
      success: false,
      status: 1005,
      message: 'Fail',
      data: {},
    };
    let mockUpdateBillingAddress = false;

    // mockSfdcQuoteService.updateBillingAddress.mockResolvedValue(mockUpdateBillingAddress);

    mockQuoteService.updateBillingAddress.mockResolvedValue(QuoteServiceResp);

    const result = await controller.saveBillingDetails(req, Request);
    expect(result.message).toMatch('Fail');
  });
  //confirm quote success
  it('Should return success', async () => {
    let req = {
      user: {
        sub: '123',
      },
    };
  let confirmQuoteRequest: ConfirmQuoteReqDTO = {
    requestId: '',
    quoteId: '',
    paymentMethodId: '',
    isAutoPay: undefined,
    projectStatus: '',
    projectId: ''
  }
    let mockConfirmQuote = '8018I0000020nGGQAY';
    let approveQuoteSuccessResponse = {
      success: true,
      status: 1000,
      message: 'Success',
      data:{}
    };
    
    let userDetailModelResp = {
      emailVerified: true,
      ussPortalUserId: 'aHQ8I000000L6WeWAK',
      email: 'gaurav.narvekar+86@zingworks.in',
      firstName: 'Gaurav +86',
      lastName: 'Jackson',
      phone: '9202232000',
      id: '0038I00000fqEukQAE',
      accountId: '0018I00000jyo1TQAQ',
      accountName: 'MyUSS Zingworks Test99 Account',
      autoPayRequirement: 'N/A',
      businessType: 'Entertainment',
      customerType: 'Business',
      emailForCC: ['test1@gmail.com', 'test2@gmail.com', 'test3@gmail.com'],
      contactId: '0038I00000fqEukQAE',
      accountNumber: 'ACT-01640876',
      accounts: [
        {
          contactId: '0038I00000fqEukQAE',
          firstName: 'Gaurav +86',
          lastName: 'Jackson',
          phone: '9202232000',
          email: 'gaurav.narvekar+86@zingworks.in',
          accountId: '0018I00000jyo1TQAQ',
          accountName: 'MyUSS Zingworks Test99 Account',
          accountNumber: 'ACT-01640876',
          autoPayRequirement: 'N/A',
          businessType: 'Entertainment',
          customerType: 'Business',
          emailForCC: ['test1@gmail.com', 'test2@gmail.com', 'test3@gmail.com'],
          myussEnabled: true,
          myussQuotesEnabled: true,
          myussHomeEnabled: true,
          myussEasyPayEnabled: true,
          myussBillingEnabled: true,
          myussOrdersEnabled: true,
          myussCasesEnabled: true,
          myussProjectsEnabled: true,
          poRequired: false,
        },
      ],
      myussEnabled: true,
      myussQuotesEnabled: true,
      myussHomeEnabled: true,
      myussEasyPayEnabled: true,
      myussBillingEnabled: true,
      myussOrdersEnabled: true,
      myussCasesEnabled: true,
      myussProjectsEnabled: true,
      poRequired: false,
      accountDetails: [],
    };
    mockCacheService.get.mockResolvedValue(JSON.stringify(userDetailModelResp));

    mockQuoteService.approveQuote.mockResolvedValue(approveQuoteSuccessResponse);
    
    mockSfdcQuoteService.confirmQuote.mockResolvedValue(mockConfirmQuote);  

    
    mockQuoteService.confirmQuote.mockResolvedValue(confirmQuoteSuccessResponse);

    const result = await controller.confirmQuote(req , confirmQuoteRequest,'0018I00000jyo1TQAQ');
    expect(result.message).toMatch('Success');
  });
  //confirm quote - when cache response isEligibleforNewRequest is false
  it('Should return Please wait, your previous request is in process. message', async () => {
    let req = {
      user: {
        sub: '123',
      },
    };
  let confirmQuoteRequest: ConfirmQuoteReqDTO = {
    requestId: 'qwer123',
    quoteId: '',
    paymentMethodId: '',
    isAutoPay: undefined,
    projectStatus: '',
    projectId: ''
  }
    let mockConfirmQuote = '8018I0000020nGGQAY';
    let approveQuoteSuccessResponse = {
      success: true,
      status: 1000,
      message: 'Success',
      data:{}
    };
    
    let userDetailModelResp = {
      emailVerified: true,
      ussPortalUserId: 'aHQ8I000000L6WeWAK',
      email: 'gaurav.narvekar+86@zingworks.in',
      firstName: 'Gaurav +86',
      lastName: 'Jackson',
      phone: '9202232000',
      id: '0038I00000fqEukQAE',
      accountId: '0018I00000jyo1TQAQ',
      accountName: 'MyUSS Zingworks Test99 Account',
      autoPayRequirement: 'N/A',
      businessType: 'Entertainment',
      customerType: 'Business',
      emailForCC: ['test1@gmail.com', 'test2@gmail.com', 'test3@gmail.com'],
      contactId: '0038I00000fqEukQAE',
      accountNumber: 'ACT-01640876',
      accounts: [
        {
          contactId: '0038I00000fqEukQAE',
          firstName: 'Gaurav +86',
          lastName: 'Jackson',
          phone: '9202232000',
          email: 'gaurav.narvekar+86@zingworks.in',
          accountId: '0018I00000jyo1TQAQ',
          accountName: 'MyUSS Zingworks Test99 Account',
          accountNumber: 'ACT-01640876',
          autoPayRequirement: 'N/A',
          businessType: 'Entertainment',
          customerType: 'Business',
          emailForCC: ['test1@gmail.com', 'test2@gmail.com', 'test3@gmail.com'],
          myussEnabled: true,
          myussQuotesEnabled: true,
          myussHomeEnabled: true,
          myussEasyPayEnabled: true,
          myussBillingEnabled: true,
          myussOrdersEnabled: true,
          myussCasesEnabled: true,
          myussProjectsEnabled: true,
          poRequired: false,
        },
      ],
      myussEnabled: true,
      myussQuotesEnabled: true,
      myussHomeEnabled: true,
      myussEasyPayEnabled: true,
      myussBillingEnabled: true,
      myussOrdersEnabled: true,
      myussCasesEnabled: true,
      myussProjectsEnabled: true,
      poRequired: false,
      accountDetails: [],
    };
    
    let cacheResp = {
      resp:{
        success: false,
        status: 1018,
        message: 'Please wait, your previous request is in process.',
        data: {},

      }
     
    }
    mockQuoteService.handleCache.mockResolvedValue(cacheResp);
    mockCacheService.get.mockResolvedValue(JSON.stringify(userDetailModelResp));

    mockQuoteService.approveQuote.mockResolvedValue(approveQuoteSuccessResponse);
    
    mockSfdcQuoteService.confirmQuote.mockResolvedValue(mockConfirmQuote);  

    
    mockQuoteService.confirmQuote.mockResolvedValue(confirmQuoteSuccessResponse);

    const result = await controller.confirmQuote(req , confirmQuoteRequest,'');
    expect(result.message).toMatch('Please wait, your previous request is in process.');
  });
  //confirm quote fail
  it('Should return fail', async () => {
    let req = {
      user: {
        sub: '123',
      },
    };
  let confirmQuoteRequest: ConfirmQuoteReqDTO = {
    requestId: '',
    quoteId: '',
    paymentMethodId: '',
    isAutoPay: undefined,
    projectStatus: '',
    projectId: ''
  }
  let userDetailModelResp = {};
  let approveQuoteFailResponse = {
    success: false,
    status: 1006,
    message: 'Fail',
    data: {},
  }
  let cacheResp = {
    resp: {
      success: true,
      status: 1000,
      message: 'Success',
      data: {
        requestId: '$2a$10$H.SkwEj/HuzrXwgsoLDsR.x3TnB8CE7QWeiuJ3T9UdDu0HU.t/Xhrz',
        startDate: '2024-03-22',
        endDate: '2024-04-22',
        contactData: [Object],
        addressData: [Object],
        quoteId: 'a6OVA0000001gMz2AI',
        contactRefId: '003VA000004EDNaYAO',
        addressRefId: 'a8xVA000000CMzFYAW',
        contactExist: true,
        subSites: [Array]
      }
    },
    isEligibleForNewRequest: false
  }
    let mockConfirmQuote = {
      contractId:undefined
    
    };
    mockCacheService.get.mockResolvedValue(JSON.stringify(userDetailModelResp));
    mockQuoteService.handleCache.mockResolvedValue(cacheResp);

    mockQuoteService.approveQuote.mockResolvedValue(approveQuoteFailResponse);
    mockSfdcQuoteService.confirmQuote.mockResolvedValue(mockConfirmQuote);
    mockQuoteService.confirmQuote.mockResolvedValue(confirmQuoteFailResponse);
    

    const result = await controller.confirmQuote(req , confirmQuoteRequest,'');
    expect(result.message).toMatch('Fail');
  });
});

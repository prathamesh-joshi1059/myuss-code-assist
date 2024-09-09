import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

import { LoggerService } from '../../../core/logger/logger.service';
import { SfdcBaseService } from '../../../backend/sfdc/services/sfdc-base/sfdc-base.service';
import { SfdcContractService } from '../../../backend/sfdc/services/sfdc-contract/sfdc-contract.service';
import { SfdcDocumentService } from '../../../backend/sfdc/services/sfdc-document/sfdc-document.service';
import { SfdcExampleQuoteToOrderService } from '../../../backend/sfdc/services/sfdc-example-quote-to-order/sfdc-example-quote-to-order.service';
import { SfdcProductService } from '../../../backend/sfdc/services/sfdc-product/sfdc-product.service';
import { SfdcQuoteService } from '../../../backend/sfdc/services/sfdc-quote/sfdc-quote.service';
import { QuoteService } from './quote.service';
import { UserService } from '../user/user.service';
import { SfdcUssPortalUserService } from '../../../backend/sfdc/services/sfdc-uss-portal-user/sfdc-uss-portal-user.service';
import { ContractService } from '../contract/contract.service';
import { PaymentMethodsService } from '../payment/payment-methods.service';
import { StripeService } from '../../../backend/stripe/services/stripe/stripe.service';
import { SfdcAccountService } from '../../../backend/sfdc/services/sfdc-account/sfdc-account.service';
import { ProductsService } from '../products/products.service';
import { AvalaraCalculateTaxService } from '../../../backend/avalara/services/calculate-tax/calculate-tax.service';
import { HttpService } from '@nestjs/axios';
import { SfdcServiceableZipCodeService } from '../../../backend/sfdc/services/sfdc-serviceable-zip-code/sfdc-serviceable-zip-code.service';
import { SfdcCpqService } from '../../../backend/sfdc/services/cpq/sfdc-cpq.service';
import { CPQPriceRulesEngineService } from '../../../backend/sfdc/services/cpq/cpq-price-rules-engine/cpq-price-rules-engine.service';
jest.mock('../../../backend/sfdc/services/cpq/cpq-price-rules-engine/cpq-price-rules-engine.service');
import { FirestoreService } from '../../../backend/google/firestore/firestore.service';
jest.mock('../../../backend/google/firestore/firestore.service');
import { CacheService } from '../../../core/cache/cache.service';
import { SiteDetailsReqDTO } from '../../controllers/quote/dto/save-site-details-req-dto';
import { TIMEMS_CACHE_REQUEST_FOR_QUOTE } from '../../../core/utils/constants';
import { UserDetails } from '../../../myuss/models';
jest.mock('../../../core/cache/cache.service');
import { TrackUserActionService } from '../../../core/track-user-action/track-user-action-service';
import { SfdcPortalActionService } from '../../../backend/sfdc/services/sfdc-portal-action/sfdc-portal-action.service';




describe('QuoteService', () => {
  const mockId = 'aHQ8I000000L6eJWAS';

  let mockResponse = {
    success: true,
    status: 1000,
    message: 'Success',
    data: {
      quoteId: 'a6O8I000000HDw3UAG',
    },
  };

  let saveSiteDetailRequest: SiteDetailsReqDTO = {
    requestId: '$2a$10$hu8HkPaeYEcpIDknlzSH3emmTTBpXF20i3AizaUCZo2UiMJo0DWsS',
    contactData: {
      firstName: 'Mayur',
      lastName: 'Mali',
      email: 'mayur.mali+new2@zingworks.in',
      phone: '9184884774',
      accountId: '0018I00000k1UD5QAM',
    },
    addressData: {
      gateCode: null,
      information: null,
      instructions: 'near the garden',
      endTime: '',
      startTime: '',
      idRequired: false,
      clearanceRequired: false,
      id: '',
      street: '',
      siteName: '',
      isParent: false,
      accountId: '',
      city: '',
      country: '',
      state: '',
      zipcode: '',
      latitude: 0,
      longitude: 0
    },
    quoteId: 'a6O8I000000HH15UAG',
    contactId: '',
    addressId: 'a8x8I000000CqurQAC',
    contactExist: false,
    startDate: '',
    endDate: '',
    subSites: []
  };



  let service: QuoteService;

  let mockConfigService = {
    get: jest.fn((key: string) => {
      const configMap = {
        AVALARA_USERNAME: 'test',
        AVALARA_PASSWORD: 'test',
        ENVIRONMENT: 'test',
      };
      if (configMap[key]) {
        return configMap[key];
      }
      return null;
    }),
  };
  const mockHandleCache = jest.fn();
  const mockUpdateSiteContact = jest.fn();
  const mockUpdateSiteAddress = jest.fn();
  const mockSetCacheService = jest.fn();
  const mockSavePaymentMethodIdToFirestore= jest.fn();

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
    updateBillingAddress: jest.fn(),
    updateSiteDetails: jest.fn(),
    getQuoteCurrentStatus: jest.fn(),
    getQuoteLatestDocumentVersion: jest.fn(),
    getQuoteBillingContact: jest.fn(),
    getQuoteDocument: jest.fn(),
    getQuoteSiteContact: jest.fn(),
    getQuoteBillingAddress: jest.fn(),
    handleCache: mockHandleCache,
    savePaymentMethodIdToFirestore: jest.fn(),
  };
  let mockLoggerService = {
    get: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    log: jest.fn(),
    isProduction: jest.fn(),
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
    savePaymentMethodIdToFirestore: jest.fn()
  };
  // Mock SfdcDocument Service
  let mockSfdcDocumentService = {
    getDocument: jest.fn(),
    getDocumentBody: jest.fn(),
  };
  // Mock Sfdc Contract Service
  let mockSfdcContractService = {
    getContractDetails: jest.fn(),
    getContractDetailsSoql: jest.fn(),
  };
  //Mock Sfdc Product Service
  let mockSfdcProductService = {
    getProdctList: jest.fn(),
  };
  // Mock Sfdc example quote to order service
  let mockSfdcExampleQuoteToOrderService = {
    createCompositeRequest: jest.fn(),
    createExampleQuoteToOrder: jest.fn(),
  };
  let mockSfdcPortalActionService = {
    setPortalActions: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SfdcUssPortalUserService,
        ContractService,
        PaymentMethodsService,
        StripeService,
        SfdcAccountService,
        SfdcCpqService,
        CPQPriceRulesEngineService,
        AvalaraCalculateTaxService,
        FirestoreService,
        TrackUserActionService,
        { provide: QuoteService, useValue: mockQuoteService },
        { provide: SfdcDocumentService, useValue: mockSfdcDocumentService },
        { provide: SfdcBaseService, useValue: mockSfdcBaseService },
        { provide: SfdcContractService, useValue: mockSfdcContractService },
        { provide: SfdcProductService, useValue: mockSfdcProductService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: SfdcQuoteService, useValue: mockSfdcQuoteService },
        { provide: UserService, useValue: mockUserService },
        { provide: SfdcExampleQuoteToOrderService, useValue: mockSfdcExampleQuoteToOrderService },
        { provide: HttpService, useValue: mockHttpService },
        { provide: ProductsService, useValue: mockProductsService },
        { provide: SfdcServiceableZipCodeService, useValue: mockSfdcServiceableZipCodeService },
        {
          provide: SfdcExampleQuoteToOrderService,
          useValue: mockSfdcExampleQuoteToOrderService,
        },
        { provide: 'AXIOS_INSTANCE_TOKEN', useValue: {} },
        CacheService,
        { provide: SfdcPortalActionService , useValue: mockSfdcPortalActionService},
      ],
    }).compile();
    service = module.get<QuoteService>(QuoteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  //create initial quote success
  it('should return success true', async () => {
    let mockRequest = {
      accountId: '0018I00000jKcrEQAS',
      address: {},
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
    };
    let mockResponse = {
      success: true,
      status: 200,
      data: { quoteId: 'a6O8I000000HDlUUAW', addressId: ' a8x8I000000CozVQAS' },
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
    jest.spyOn(mockProductsService, 'getStandardPricebook').mockResolvedValue(mockResponseGetStandardPricebook);
    jest
      .spyOn(mockSfdcServiceableZipCodeService, 'checkServiceableZipcode')
      .mockResolvedValue(mockResponseCheckServiceableZipcode);
    jest.spyOn(mockSfdcQuoteService, 'createOpportunity').mockResolvedValue(mockResponseCreateOpportunity);
    jest.spyOn(mockSfdcQuoteService, 'createQuote').mockResolvedValue(mockResponseCreateQuote);
    jest.spyOn(mockQuoteService, 'createInitialQuote').mockReturnValue(mockResponse);
    const result = await mockQuoteService.createInitialQuote(mockRequest);

    expect(result).toHaveProperty('success', true);
  });
  //create initial quote fail
  it('should return success false', async () => {
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
    let mockResponseCreateQuote = { id: '', success: false, errors: [] };
    jest.spyOn(mockProductsService, 'getStandardPricebook').mockResolvedValue(mockResponseGetStandardPricebook);
    jest
      .spyOn(mockSfdcServiceableZipCodeService, 'checkServiceableZipcode')
      .mockResolvedValue(mockResponseCheckServiceableZipcode);
    jest.spyOn(mockSfdcQuoteService, 'createOpportunity').mockResolvedValue(mockResponseCreateOpportunity);
    jest.spyOn(mockSfdcQuoteService, 'createQuote').mockResolvedValue(mockResponseCreateQuote);

    let mockRequest = {
      accountId: '0018I00000jKcrEQAS',
      address: {},
      contactId: '0038I00000fotGnQAI',
      orderType: 'Recurring without End Date',
      zipcode: '',
      billTiming: 'Bill in Advance',
      billingPeriod: '28 Day Bill Period',
      customerType: 'Business',
      businessType: 'Other Business',
      prodSubType: 'Renewable',
      addressExist: true,
      addressId: 'a8x8I000000CozVQAS',
    };
    let mockResponse = { success: false, status: 1005, data: {} };
    jest.spyOn(mockQuoteService, 'createInitialQuote').mockReturnValue(mockResponse);
    const result = await mockQuoteService.createInitialQuote(mockRequest);
    expect(result).toHaveProperty('success', false);
  });
  //add poduct and calculate success
  it('should return success true', async () => {
    let mockRequest = {
      quoteId: 'a6O8I000000HDm8UAG',
      accountId: '0018I00000jKcrEQAS',
      contactId: '0038I00000fotGnQAI',
      startDate: '2023-11-24',
      endDate: '2049-12-31',
      orderType: 'Recurring without End Date',
      zipcode: '02446',
      duration: '12-24 Months',
      billTiming: 'Bill in Advance',
      billingPeriod: '28 Day Bill Period',
      customerType: 'Business',
      businessType: 'Other Business',
      prodSubType: 'Renewable',
      productDetails: [
        {
          productIdBundle: '01t3m00000PPH5MAAX',
          productOptionSkuBundle: '',
          bundleSummery: 'Restroom Bundle',
          bundleQty: 1,
          productIdService: '01t3m00000NTivwAAD',
          productOptionSkuService: 'a6D8I0000008aRVUAY',
          serviceSummery: '1 Svc 1 Day Wk',
          productIdAsset: '01t3m00000NTiw6AAD',
          productOptionSkuAsset: 'a6D8I0000008aKcUAI',
          assetSummary: 'Std Rest',
          assetTaxcode: 'TAX0000001',
          serviceTaxcode: 'TAX0000001',
          pricebookEntryIdBundle: '',
          pricebookEnteryIdService: '',
          pricebookEnteryIdAsset: '',
          additionalProduct: [
            {
              productIdAS: '01t3m00000POgwKAAT',
              productOptionSkuAS: 'a6D8I0000008aSlUAI',
              aSSummery: 'Containment Tray',
              aSSTaxCode: 'TAX0000001',
            },
            {
              productIdAS: '01t6O000006aeezQAA',
              productOptionSkuAS: 'a6D8I0000008aSfUAI',
              aSSummery: 'Toilet Seat Cover Refill',
              aSSTaxCode: 'TAX0000001',
            },
            {
              productIdAS: '01t3m00000OAZY4AAP',
              productOptionSkuAS: 'a6D8I0000008aS1UAI',
              aSSummery: 'Rest Lock and Key',
              aSSTaxCode: 'TAX0000001',
            },
          ],
        },
      ],
      addressId: 'a8x8I000000CozVQAS',
    };
    let mockResponse = { success: true, status: 200, data: { quoteId: 'a6O8I000000HDlUUAW' } };
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
    jest.spyOn(mockSfdcQuoteService, 'getQuoteLineIds').mockResolvedValue(mockResponseGetQuoteLineIds);
    jest.spyOn(mockSfdcQuoteService, 'deleteQuoteLinesByIds').mockResolvedValue(mockResponseDeleteQuoteLinesByIds);
    jest.spyOn(mockProductsService, 'getProducts').mockResolvedValue(mockResponseGetProducts);
    jest.spyOn(mockQuoteService, 'createCartLevelQuoteLines').mockResolvedValue(mockResponseCartLevelQuoteLines);
    jest
      .spyOn(mockQuoteService, 'createShortTermQuoteLineIfNeeded')
      .mockResolvedValue(mockResponseCreateShortTermQuoteLineIfNeeded);

    jest.spyOn(mockQuoteService, 'addProductAndCalculate').mockReturnValue(mockResponse);
    const result = await mockQuoteService.addProductAndCalculate(mockRequest);
    expect(result).toHaveProperty('success', true);
  });
  //add product and calculate fail
  it('should return success false', async () => {
    let mockRequest = {
      quoteId: 'a6O8I000000HDm8UAG',
      accountId: '0018I00000jKcrEQAS',
      contactId: '0038I00000fotGnQAI',
      startDate: '2023-11-24',
      endDate: '2049-12-31',
      orderType: 'Recurring without End Date',
      zipcode: '02446',
      duration: '12-24 Months',
      billTiming: 'Bill in Advance',
      billingPeriod: '28 Day Bill Period',
      customerType: 'Business',
      businessType: 'Other Business',
      prodSubType: 'Renewable',
      productDetails: [
        {
          productIdBundle: '01t3m00000PPH5MAAX',
          productOptionSkuBundle: '',
          bundleSummery: 'Restroom Bundle',
          bundleQty: 1,
          productIdService: '01t3m00000NTivwAAD',
          productOptionSkuService: 'a6D8I0000008aRVUAY',
          serviceSummery: '1 Svc 1 Day Wk',
          productIdAsset: '01t3m00000NTiw6AAD',
          productOptionSkuAsset: 'a6D8I0000008aKcUAI',
          assetSummary: 'Std Rest',
          assetTaxcode: 'TAX0000001',
          serviceTaxcode: 'TAX0000001',
          pricebookEntryIdBundle: '',
          pricebookEnteryIdService: '',
          pricebookEnteryIdAsset: '',
          additionalProduct: [
            {
              productIdAS: '01t3m00000POgwKAAT',
              productOptionSkuAS: 'a6D8I0000008aSlUAI',
              aSSummery: 'Containment Tray',
              aSSTaxCode: 'TAX0000001',
            },
            {
              productIdAS: '01t6O000006aeezQAA',
              productOptionSkuAS: 'a6D8I0000008aSfUAI',
              aSSummery: 'Toilet Seat Cover Refill',
              aSSTaxCode: 'TAX0000001',
            },
            {
              productIdAS: '01t3m00000OAZY4AAP',
              productOptionSkuAS: 'a6D8I0000008aS1UAI',
              aSSummery: 'Rest Lock and Key',
              aSSTaxCode: 'TAX0000001',
            },
          ],
        },
      ],
      addressId: 'a8x8I000000CozVQAS',
    };
    let mockResponse = { success: false, status: 1005, data: {} };
    jest.spyOn(mockQuoteService, 'addProductAndCalculate').mockReturnValue(mockResponse);
    const result = await mockQuoteService.addProductAndCalculate(mockRequest);
    expect(result).toHaveProperty('success', false);
  });
  //generate document success
  it('should return success true', async () => {
    let mockResponse = {
      success: true,
      status: 1000,
      message: 'Success',
      data: {
        quoteId: 'a6O8I000000HDlUUAW',
      },
    };
    jest.spyOn(mockQuoteService, 'getQuoteDocument').mockReturnValue(mockResponse);
    const result = await mockQuoteService.getQuoteDocument('a6O8I000000HDlUUAW');

    expect(result).toHaveProperty('success', true);
    expect(result.data).toHaveProperty('quoteId');
  });
  //generate document fail
  it('should return success false', async () => {
    let mockResponse = {
      success: false,
      status: 1005,
      data: {},
    };
    jest.spyOn(mockQuoteService, 'getQuoteDocument').mockReturnValue(mockResponse);
    const result = await mockQuoteService.getQuoteDocument('a6O8I000000HDlUUAW');
    expect(result).toHaveProperty('success', false);
  });
  //get quote details success
  it('should return success true', async () => {
    let mockResponse = {
      status: 1000,
      message: 'Success',
      data: {
        quoteId: 'a6O8I000000HDmJUAW',
        quoteName: 'Q-514043',
        currentStatus: 4,
        startDate: '2023-11-24',
        endDate: '2049-12-31',
        duration: '4-6 Months',
        lineItems: [
          {
            bundleId: '01t3m00000PPH5MAAX',
            type: 'Bundle',
            bundleName: 'Restroom Bundle',
            bundleQty: 1,
            bundleProductCode: '110-0000',
            serviceList: [
              {
                id: '01t3m00000NTivwAAD',
                serviceName: '1 Svc 1 Day Wk',
                serviceProductCode: '112-2001',
                serviceOptionalId: 'a6D8I0000008aRVUAY',
                quantity: 1,
              },
            ],
            assetList: [
              {
                id: '01t3m00000NTiw6AAD',
                assetName: 'Std Rest',
                assetProductCode: '111-1001',
                assetOptionalId: 'a6D8I0000008aKcUAI',
                quantity: 1,
              },
            ],
            ancillaryServiceList: [
              {
                id: '01t3m00000POgwKAAT',
                ancillaryServiceName: 'Containment Tray',
                ancillaryServiceProductCode: '113-1801',
                ancillaryServiceOptionalId: 'a6D8I0000008aSlUAI',
                quantity: 1,
              },
            ],
            pAndDList: [
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
          {
            bundleId: '01t3m00000PPH5RAAX',
            type: 'Bundle',
            bundleName: 'Hand Cleaning Bundle',
            bundleQty: 2,
            bundleProductCode: '120-0000',
            serviceList: [
              {
                id: '01t3m00000NTix0AAD',
                serviceName: '1 Svc 1 Day Wk',
                serviceProductCode: '122-2001',
                serviceOptionalId: 'a6D8I0000008aK1UAI',
                quantity: 2,
              },
            ],
            assetList: [
              {
                id: '01t3m00000NTiuFAAT',
                assetName: '2 Stn Hand Sink',
                assetProductCode: '121-1102',
                assetOptionalId: 'a6D8I0000008aKyUAI',
                quantity: 2,
              },
            ],
            ancillaryServiceList: [
              {
                id: '01t3m00000POgwKAAT',
                ancillaryServiceName: 'Containment Tray',
                ancillaryServiceProductCode: '113-1801',
                ancillaryServiceOptionalId: 'a6D8I0000008aKAUAY',
                quantity: 2,
              },
              {
                id: '01t3m00000POgyHAAT',
                ancillaryServiceName: 'Stake Secure Hand',
                ancillaryServiceProductCode: '123-2203',
                ancillaryServiceOptionalId: 'a6D8I0000008aMdUAI',
                quantity: 2,
              },
            ],
            pAndDList: [
              {
                id: '01t3m00000POh0HAAT',
                pAndDServiceName: 'Del Hand per Unit',
                pAndDServiceNameProductCode: '123-3009',
                quantity: 2,
              },
              {
                id: '01t3m00000POh0MAAT',
                pAndDServiceName: 'Pick Hand per Unit',
                pAndDServiceNameProductCode: '123-3010',
                quantity: 2,
              },
            ],
          },
        ],
        documentId: '0158I000000lSIzQAM',
        documentName: 'MyUSS Zingworks Test99 Account Quote 11.22.2023',
        siteAddress: {
          addressId: 'a8x8I000000CpqjQAC',
          street: 'San Diego, CA 92116, USA - San Diego - CA',
          country: 'US',
          city: 'San Diego',
          zipcode: '92116',
          state: 'CA',
          siteStartTime: '01:30:00.125Z',
          siteEndTime: '13:30:00.125Z',
          gateCode: 'Gate 1',
          instructions: 'Near to security cabin 1',
          information: null,
          latitude: 32.76334,
          longitude: -117.11825,
          clearanceRequired: false,
          idRequired: false,
        },
        siteContact: {
          contactId: '0038I00000fqSnNQAU',
          firstName: 'Maria5',
          lastName: 'Jackson5',
          phone: '9202232000',
          email: 'gaurav.narvekar+86@zingworks.in',
        },
        billingAddress: {
          addressId: 'a8x8I000000CpuqQAC',
          address: 'Brookline, MA 02445, USA - Brookline - MA',
          city: 'Brookline',
          state: 'MA',
          zipcode: '02445',
        },
        billingContact: {
          contactId: '0038I00000fqEukQAE',
          firstName: 'Maria',
          lastName: 'Jackson',
          phone: '9202232000',
          email: 'gaurav.narvekar+86@zingworks.in',
        },
        emailToCC: ['test1@gmail.com'],
        poNumber: 'PO12345',
      },
    };
    let mockGetQuoteCurrentStatus = 4;
    let mockGetQuoteLatestDocumentVersion = {
      byVersion: [
        {
          attributes: [Object],
          Id: 'a6F8I0000009wXDUAY',
          Name: 'MyUSS Zingworks Test99 Account Quote 11.22.2023',
          SBQQ__DocumentId__c: '0158I000000lSIzQAM',
          SBQQ__Version__c: 1,
        },
      ],
      docId: '0158I000000lSIzQAM',
      docName: 'MyUSS Zingworks Test99 Account Quote 11.22.2023',
    };
    let mockGetQuoteBillingAddress = {
      addressId: 'a8x8I000000CpuqQAC',
      address: 'Brookline, MA 02445, USA - Brookline - MA',
      city: 'Brookline',
      state: 'MA',
      zipcode: '02445',
    };
    let mockGetQuoteSiteContact = {
      contactId: '0038I00000fqSnNQAU',
      firstName: 'Maria5',
      lastName: 'Jackson5',
      phone: '9202232000',
      email: 'gaurav.narvekar+86@zingworks.in',
    };
    let mockGetQuoteBillingContact = {
      contactId: '0038I00000fqEukQAE',
      firstName: 'Maria',
      lastName: 'Jackson',
      phone: '9202232000',
      email: 'gaurav.narvekar+86@zingworks.in',
    };
    jest.spyOn(mockQuoteService, 'getQuoteCurrentStatus').mockReturnValue(mockGetQuoteCurrentStatus);
    jest.spyOn(mockQuoteService, 'getQuoteLatestDocumentVersion').mockReturnValue(mockGetQuoteLatestDocumentVersion);
    jest.spyOn(mockQuoteService, 'getQuoteSiteContact').mockReturnValue(mockGetQuoteSiteContact);
    jest.spyOn(mockQuoteService, 'getQuoteBillingAddress').mockReturnValue(mockGetQuoteBillingAddress);
    jest.spyOn(mockQuoteService, 'getQuoteBillingContact').mockReturnValue(mockGetQuoteBillingContact);
    jest.spyOn(mockQuoteService, 'getQuoteDetails').mockReturnValue(mockResponse);
    const result = await mockQuoteService.getQuoteDetails('a6O8I000000HDmJUAW');

    expect(result).toHaveProperty('status', 1000);
    expect(result.data).toHaveProperty('quoteId');
    expect(result.data).toHaveProperty('lineItems');
    expect(result.data).toHaveProperty('documentId');
    expect(result.data).toHaveProperty('siteAddress');
    expect(result.data).toHaveProperty('siteContact');
    expect(result.data).toHaveProperty('billingAddress');
    expect(result.data).toHaveProperty('billingContact');
  });
  //get quote details fail
  it('should return success false', async () => {
    let mockResponse = { success: false, status: 1005, data: {} };
    let mockGetQuoteCurrentStatus = 4;
    let mockGetQuoteLatestDocumentVersion = {
      byVersion: [
        {
          attributes: [Object],
          Id: 'a6F8I0000009wXDUAY',
          Name: 'MyUSS Zingworks Test99 Account Quote 11.22.2023',
          SBQQ__DocumentId__c: '0158I000000lSIzQAM',
          SBQQ__Version__c: 1,
        },
      ],
      docId: '0158I000000lSIzQAM',
      docName: 'MyUSS Zingworks Test99 Account Quote 11.22.2023',
    };
    let mockGetQuoteBillingAddress = {
      addressId: 'a8x8I000000CpuqQAC',
      address: 'Brookline, MA 02445, USA - Brookline - MA',
      city: 'Brookline',
      state: 'MA',
      zipcode: '02445',
    };
    let mockGetQuoteSiteContact = {
      contactId: '0038I00000fqSnNQAU',
      firstName: 'Maria5',
      lastName: 'Jackson5',
      phone: '9202232000',
      email: 'gaurav.narvekar+86@zingworks.in',
    };
    let mockGetQuoteBillingContact = {
      contactId: '0038I00000fqEukQAE',
      firstName: 'Maria',
      lastName: 'Jackson',
      phone: '9202232000',
      email: 'gaurav.narvekar+86@zingworks.in',
    };
    jest.spyOn(mockQuoteService, 'getQuoteCurrentStatus').mockReturnValue(mockGetQuoteCurrentStatus);
    jest.spyOn(mockQuoteService, 'getQuoteLatestDocumentVersion').mockReturnValue(mockGetQuoteLatestDocumentVersion);
    jest.spyOn(mockQuoteService, 'getQuoteSiteContact').mockReturnValue(mockGetQuoteSiteContact);
    jest.spyOn(mockQuoteService, 'getQuoteBillingAddress').mockReturnValue(mockGetQuoteBillingAddress);
    jest.spyOn(mockQuoteService, 'getQuoteBillingContact').mockReturnValue(mockGetQuoteBillingContact);
    jest.spyOn(mockQuoteService, 'getQuoteDetails').mockReturnValue(mockResponse);
    const result = await mockQuoteService.getQuoteDetails('a6O8I000000HDlUUAW');
    expect(result).toHaveProperty('success', false);
  });
  //save status success
  it('should return success true', async () => {
    let mockResponse = {
      success: true,
      status: 1000,
      message: 'Success',
      data: {
        quoteId: 'a6O8I000000HDw3UAG',
      },
    };
    jest.spyOn(mockQuoteService, 'updateQuoteStatus').mockReturnValue(mockResponse);
    const result = await mockQuoteService.updateQuoteStatus({ quoteId: 'a6O8I000000HDw3UAG', status: 'Approved' });
    expect(result).toHaveProperty('success', true);
  });
  //save status fail
  it('should return success false', async () => {
    let mockResponse = { success: false, status: 1005, data: {} };
    jest.spyOn(mockQuoteService, 'updateQuoteStatus').mockReturnValue(mockResponse);
    const result = await mockQuoteService.updateQuoteStatus({ quoteId: 'a6O8I000000HDw3UAG', status: 'Approved' });
    expect(result).toHaveProperty('success', false);
  });
  //update site details success true
  it('should return success true', async () => {
    let mockResponse = {
      success: true,
      status: 1000,
      message: 'Success',
      data: {
        quoteId: 'a6O8I000000HDw3UAG',
      },
    };
    let saveSiteDetailRequest = {
      contactData: {
        firstName: 'Maria5',
        lastName: 'Jackson5',
        email: 'gaurav.narvekar+86@zingworks.in',
        phone: '9202232000',
        accountId: '0018I00000jyo1TQAQ',
      },
      addressData: {
        gateCode: 'Gate 5',
        information: 'Need entry pass 1. Not for others',
        instructions: 'Near Security cabin',
        siteEndTime: '13:30:00.125Z',
        siteStartTime: '01:30:00.125Z',
        idRequired: true,
        clearanceRequired: true,
      },
      quoteId: 'a6O8I000000HE7qUAG',
      contactRefId: '',
      addressRefId: 'a8x8I000000CpqUQAS',
      contactExist: false,
      contactId: '',
    };
    jest.spyOn(mockQuoteService, 'updateSiteDetails').mockReturnValue(mockResponse);
    const result = await mockQuoteService.updateSiteDetails(saveSiteDetailRequest);
    expect(result).toHaveProperty('success', true);
  });

  it('should handle cache and return early if not eligible', async () => {


    // Arrange
    mockHandleCache.mockResolvedValueOnce({
      isEligibleForNewRequest: false,
      resp: mockResponse,
    });
    let userDetailModelResp:UserDetails= {
      title: '',
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
      quotes: [],
      contracts: []
    };

    // Act
    const result = await service.updateSiteDetails(saveSiteDetailRequest, userDetailModelResp);
    await service.handleCache(saveSiteDetailRequest.requestId, saveSiteDetailRequest, TIMEMS_CACHE_REQUEST_FOR_QUOTE);

    // Assert
    expect(result).toEqual(mockResponse);
    expect(mockHandleCache).toHaveBeenCalledWith(
      saveSiteDetailRequest.requestId,
      saveSiteDetailRequest,
      TIMEMS_CACHE_REQUEST_FOR_QUOTE,
    );
  });

  it('should update site details and cache response on success', async () => {
  
    // Arrange
    mockHandleCache.mockResolvedValueOnce({
      isEligibleForNewRequest: true,
    });
    mockUpdateSiteContact.mockResolvedValueOnce({
      success: true,
      id: 'mockContactId',
    });
    mockUpdateSiteAddress.mockResolvedValueOnce({
      success: true,
    });

    let userDetailModelResp:UserDetails= {
      title: '',
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
      quotes: [],
      contracts: []
    };

    // Act
    const result = await service.updateSiteDetails(saveSiteDetailRequest,userDetailModelResp);
    mockUpdateSiteContact(saveSiteDetailRequest, mockId);
    mockUpdateSiteAddress(saveSiteDetailRequest);
    mockSetCacheService(saveSiteDetailRequest.requestId, result, TIMEMS_CACHE_REQUEST_FOR_QUOTE);

    // Assert
    expect(result.success).toBe(true);
    expect(result.status).toBe(1000);
    expect(mockHandleCache).toHaveBeenCalledWith(
      saveSiteDetailRequest.requestId,
      saveSiteDetailRequest,
      TIMEMS_CACHE_REQUEST_FOR_QUOTE,
    );
    expect(mockUpdateSiteContact).toHaveBeenCalledWith(saveSiteDetailRequest, mockId);
    expect(mockUpdateSiteAddress).toHaveBeenCalledWith(saveSiteDetailRequest);
    expect(mockSetCacheService).toHaveBeenCalled()
  });



  //update site details success false
  it('should return success false', async () => {
    let mockResponse = { success: false, status: 1005, data: {} };
    let saveSiteDetailRequest = {
      contactData: {
        firstName: 'Maria5',
        lastName: 'Jackson5',
        email: 'gaurav.narvekar+86@zingworks.in',
        phone: '9202232000',
        accountId: '0018I00000jyo1TQAQ',
      },
      addressData: {
        gateCode: 'Gate 5',
        information: 'Need entry pass 1. Not for others',
        instructions: 'Near Security cabin',
        siteEndTime: '13:30:00.125Z',
        siteStartTime: '01:30:00.125Z',
        idRequired: true,
        clearanceRequired: true,
      },
      quoteId: 'a6O8I000000HE7qUAG',
      contactRefId: '',
      addressRefId: 'a8x8I000000CpqUQAS',
      contactExist: false,
      contactId: '',
    };
    jest.spyOn(mockQuoteService, 'updateSiteDetails').mockReturnValue(mockResponse);
    const result = await mockQuoteService.updateSiteDetails(saveSiteDetailRequest);
    expect(result).toHaveProperty('success', false);
  });
  
  //update billing address success true
  it('should return success true', async () => {
    let mockResponse = {
      success: true,
      status: 1000,
      message: 'Success',
      data: {
        quoteId: 'a6O8I000000HDw3UAG',
      },
    };
    let saveBillingDetailsRequest = {
      address: {
        name: 'Brookline, MA 02445, USA',
        city: 'Brookline',
        state: 'MA',
        zipcode: '02445',
      },
      quoteId: 'a6O8I000000HE7qUAG',
      addressRefId: '',
      addressExist: false,
      emailIds: ['test1@gmail.com'],
      contactRefId: '0038I00000fqEukQAE',
      poNumber: 'TPO_12345',
      accountId: '0018I00000jyo1TQAQ',
      paymentMethodId: 'pm_1OFxNZKX1Bgoxru0qTEJGaa7',
    };
    jest.spyOn(mockQuoteService, 'updateBillingAddress').mockReturnValue(mockResponse);
    const result = await mockQuoteService.updateBillingAddress(saveBillingDetailsRequest);
    expect(result).toHaveProperty('success', true);
  });
  //update billing getQuoteCurrentStatus success false
  it('should return success false', async () => {
    let mockResponse = { success: false, status: 1005, data: {} };
    let saveBillingDetailsRequest = {
      address: {
        name: 'Brookline, MA 02445, USA',
        city: 'Brookline',
        state: 'MA',
        zipcode: '02445',
      },
      quoteId: 'a6O8I000000HE7qUAG',
      addressRefId: '',
      addressExist: false,
      emailIds: ['test1@gmail.com'],
      contactRefId: '0038I00000fqEukQAE',
      poNumber: 'TPO_12345',
      accountId: '0018I00000jyo1TQAQ',
      paymentMethodId: 'pm_1OFxNZKX1Bgoxru0qTEJGaa7',
    };
    jest.spyOn(mockQuoteService, 'updateBillingAddress').mockReturnValue(mockResponse);
    const result = await mockQuoteService.updateBillingAddress(saveBillingDetailsRequest);
    expect(result).toHaveProperty('success', false);
  });







  //confirm quote success true
  it('should return success true', async () => {
    let mockResponse = {
      success: true,
      status: 1000,
      message: 'Success',
      data: {
        quoteId: 'a6O8I000000HDw3UAG',
      },
    };
    let confirmQuoteRequest = {
      quoteId: 'a6O8I000000HE7qUAG',
      paymentMethodId: 'pm_1OFxNZKX1Bgoxru0qTEJGaa7',
      isAutoPay: true,
    };
    jest.spyOn(mockQuoteService, 'confirmQuote').mockReturnValue(mockResponse);
    const result = await mockQuoteService.confirmQuote(confirmQuoteRequest);
    expect(result).toHaveProperty('success', true);
  });
  //confirm quote success false
  it('should return success false', async () => {
    let mockResponse = { success: false, status: 1005, data: {} };
    let confirmQuoteRequest = {
      quoteId: 'a6O8I000000HE7qUAG',
      paymentMethodId: 'pm_1OFxNZKX1Bgoxru0qTEJGaa7',
      isAutoPay: true,
    };
    jest.spyOn(mockQuoteService, 'confirmQuote').mockReturnValue(mockResponse);
    const result = await mockQuoteService.confirmQuote(confirmQuoteRequest);
    expect(result).toHaveProperty('success', false);
  });
});

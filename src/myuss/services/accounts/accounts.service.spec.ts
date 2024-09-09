import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

import { LoggerService } from '../../../core/logger/logger.service';
import { CacheService } from '../../../core/cache/cache.service';
jest.mock('../../../core/cache/cache.service');

import { SfdcBaseService } from '../../../backend/sfdc/services/sfdc-base/sfdc-base.service';
import { SfdcQuoteService } from '../../../backend/sfdc/services/sfdc-quote/sfdc-quote.service';
import { SfdcUssPortalUserService } from '../../../backend/sfdc/services/sfdc-uss-portal-user/sfdc-uss-portal-user.service';
import { SfdcDocumentService } from '../../../backend/sfdc/services/sfdc-document/sfdc-document.service';
import { Auth0MyUSSAPIService } from '../../../backend/auth0/services/auth0-myuss-api/auth0-myuss-api.service';
import { HttpService } from '@nestjs/axios';

import { AccountsService } from './accounts.service';
import { ContractService } from '../contract/contract.service';
import { SfdcContractService } from '../../../backend/sfdc/services/sfdc-contract/sfdc-contract.service';
import { PaymentMethodsService } from '../payment/payment-methods.service';
import { StripeService } from '../../../backend/stripe/services/stripe/stripe.service';
import { SfdcAccountService } from '../../../backend/sfdc/services/sfdc-account/sfdc-account.service';
import { Auth0UserService } from '../../../backend/auth0/services/auth0-user/auth0-user.service';
import { Auth0ManagementAPIService } from '../../../backend/auth0/services/auth0-management-api/auth0-management-api.service';
import { UserService } from '../user/user.service';
import { FirestoreService } from '../../../backend/google/firestore/firestore.service';
import { mock } from 'node:test';
import { HttpException } from '@nestjs/common';
import { TrackUserActionService } from '../../../core/track-user-action/track-user-action-service';
import { SfdcContactService } from '../../../backend/sfdc/services/sfdc-contact/sfdc-contact.service';
import { SfdcAddressService } from '../../../backend/sfdc/services/sfdc-address/sfdc-address.service';
import { SfdcPortalActionService } from '../../../backend/sfdc/services/sfdc-portal-action/sfdc-portal-action.service';
describe('AccountsService', () => {
  let service: AccountsService;

  // Mock SfdcDocument Service
  let mockSfdcDocumentService = {
    getDocument: jest.fn(),
    getDocumentBody: jest.fn(),
  };
  let mockSfdcPortalActionService ={
    fetchContactAndUssPortalUser: jest.fn(),
    setPortalActions: jest.fn(),
  }

  // Mock SfdcBase Service
  let mockSfdcBaseService = {
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

  // Mock Logger Service
  let mockLoggerService = {
    log: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  };

  // Mock Auth0 Machine To Machine Service
  let mockAuth0MachineToMachineService = {
    decode: jest.fn(),
    getAccessToken: jest.fn(),
    checkAndRefreshAccessToken: jest.fn(),
    changePassword: jest.fn(),
  };

  // Mock Sfdc Uss Portal User Service
  let mockSfdcUssPortalUserService = {
    getAddresses: jest.fn(),
    getContacts: jest.fn(),
    updateUser: jest.fn(),
    createUser: jest.fn(),
    fetchProfile: jest.fn(),
    getQuoteForUser: jest.fn(),
    getUserContext: jest.fn(),

    getAccountIdsForUser: jest.fn(),
    getContactForUserId: jest.fn(),
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
  // mock contract service
  let mockContractService = {
    fetchContracts: jest.fn(),
    getActiveOrderCount: jest.fn(),
    getContractDetails: jest.fn(),
  };
  // mock SfdcQuoteService
  let mockSfdcQuoteService = {
    getQuoteByOrderNo: jest.fn(),
    getTemplateIdForQuoteById: jest.fn(),
    getQuoteByAccountAndOrderNo: jest.fn(),
    getQuoteDocument: jest.fn(),
    getServicableRefId: jest.fn(),
    enableServerSidePricingCalculation: jest.fn(),
    getDocumentId: jest.fn(),
    getQuoteDetails: jest.fn(),
    fetchDrafts: jest.fn(),
    fetchOrderedQuote: jest.fn(),
    fetchArchivedDrafts: jest.fn(),
    fetchSuspendedDrafts: jest.fn(),
    updateBillingAddress: jest.fn(),
    updateSiteDetails: jest.fn(),
    updateSiteContact: jest.fn(),
    getPOReferenceNumber: jest.fn(),
    timeout: jest.fn(),
    fetchSiteDetails: jest.fn(),
    fetchBillingDetails: jest.fn(),
    approveQuote: jest.fn(),
    confirmQuote: jest.fn(),
    postPaymentMethodToQuote: jest.fn(),
    updatePaymentMethod: jest.fn(),
    fetchQuoteStatus: jest.fn(),
    fetchQuoteIds: jest.fn(),
  };
  //Mock Sfdc Contract Service
  let mockSfdcContractService = {
    getContractDetails: jest.fn(),
    getContractByOrderIdAndZIP: jest.fn(),
    getContractDetailsSoql: jest.fn(),
    fetchContracts: jest.fn(),
    getActiveOrderCount: jest.fn(),
    fetchContractIds: jest.fn(),
    fetchNotification: jest.fn(),
  };
  let mockSfdcContactService = {
    getContactsForAccount : jest.fn(),

  }
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

  let mockSfdcAccountService = {
    getAccount: jest.fn(),
    getProspectAccountRecordTypeId: jest.fn(),
    updatePrimaryPayer: jest.fn(),
    getPrimaryPayerEmail: jest.fn(),
    getAccounts: jest.fn(),
    getAccountByName: jest.fn(),
    getAccountNumberByUSSAccountId: jest.fn(),
  };
  let mockSfdcAddressService = {
    getAddressesByAddressValue: jest.fn()
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        AccountsService,
        CacheService,
        PaymentMethodsService,
        StripeService,
        TrackUserActionService,
        {
          provide: SfdcAccountService,
          useValue: mockSfdcAccountService,
        },
        Auth0UserService,
        Auth0ManagementAPIService,
        {
          provide: FirestoreService,
          useValue: mockFirestoreService,
        },
        {
          provide: SfdcContractService,
          useValue: mockSfdcContractService,
        },
        { provide: SfdcDocumentService, useValue: mockSfdcDocumentService },
        { provide: SfdcBaseService, useValue: mockSfdcBaseService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: LoggerService, useValue: mockLoggerService },
        {
          provide: SfdcQuoteService,
          useValue: mockSfdcQuoteService,
        },
        {
          provide: ContractService,
          useValue: mockContractService,
        },
        {
          provide: Auth0MyUSSAPIService,
          useValue: mockAuth0MachineToMachineService,
        },
        {
          provide: SfdcUssPortalUserService,
          useValue: mockSfdcUssPortalUserService,
        },
        { provide: HttpService, useValue: mockHttpService },
        {
          provide: SfdcContactService,
          useValue: mockSfdcContactService,
        },
        {
          provide: SfdcAddressService,
          useValue: mockSfdcAddressService,
        },
        {
          provide: SfdcPortalActionService,
          useValue: mockSfdcPortalActionService,
        },
        { provide: 'AXIOS_INSTANCE_TOKEN', useValue: {} },
      ],
    }).compile();

    service = module.get<AccountsService>(AccountsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Get Contacts
  it('Should return contacts of specific account by passing account id as a param', async () => {
    // Arrange
    const request = {
      id: '0018I00000k1WugQAE',
    };
    const SfdcResponse = [
      {
        attributes: {
          type: 'AccountContactRelation',
          url: '/services/data/v58.0/sobjects/AccountContactRelation/07k8I00000XZag1QAD',
        },
        Id: '07k8I00000XZag1QAD',
        AccountId: '0018I00000k1WugQAE',
        Account: {
          attributes: {
            type: 'Account',
            url: '/services/data/v58.0/sobjects/Account/0018I00000k1WugQAE',
          },
          USF_Account_Number__c: 'ACT-01640982',
        },
        Roles: 'Payer;Primary Decision Maker',
        ContactId: '0038I00000i2g4bQAA',
        Contact: {
          attributes: {
            type: 'Contact',
            url: '/services/data/v58.0/sobjects/Contact/0038I00000i2g4bQAA',
          },
          FirstName: 'Gaurav157',
          LastName: 'Narvekar',
          Email: 'gaurav.narvekar+157@zingworks.in',
          Phone: '+913475374437',
          Ext__c: null,
          USF_Inactive__c: false,
        },
        IsActive: true,
      },
      {
        attributes: {
          type: 'AccountContactRelation',
          url: '/services/data/v58.0/sobjects/AccountContactRelation/07k8I00000XZagQQAT',
        },
        Id: '07k8I00000XZagQQAT',
        AccountId: '0018I00000k1WugQAE',
        Account: {
          attributes: {
            type: 'Account',
            url: '/services/data/v58.0/sobjects/Account/0018I00000k1WugQAE',
          },
          USF_Account_Number__c: 'ACT-01640982',
        },
        Roles: 'None',
        ContactId: '0038I00000i2g55QAA',
        Contact: {
          attributes: {
            type: 'Contact',
            url: '/services/data/v58.0/sobjects/Contact/0038I00000i2g55QAA',
          },
          FirstName: 'Mayur',
          LastName: 'Mali',
          Email: 'mayur.mali@zingworks.in',
          Phone: '3254523745',
          Ext__c: null,
          USF_Inactive__c: false,
        },
        IsActive: true,
      },
      {
        attributes: {
          type: 'AccountContactRelation',
          url: '/services/data/v58.0/sobjects/AccountContactRelation/07k8I00000XZagfQAD',
        },
        Id: '07k8I00000XZagfQAD',
        AccountId: '0018I00000k1WugQAE',
        Account: {
          attributes: {
            type: 'Account',
            url: '/services/data/v58.0/sobjects/Account/0018I00000k1WugQAE',
          },
          USF_Account_Number__c: 'ACT-01640982',
        },
        Roles: 'None',
        ContactId: '0038I00000i2g5eQAA',
        Contact: {
          attributes: {
            type: 'Contact',
            url: '/services/data/v58.0/sobjects/Contact/0038I00000i2g5eQAA',
          },
          FirstName: 'Mayur1',
          LastName: 'Mali1',
          Email: 'mayur.mali1@zingworks.in',
          Phone: '3254523741',
          Ext__c: null,
          USF_Inactive__c: false,
        },
        IsActive: true,
      },
      {
        attributes: {
          type: 'AccountContactRelation',
          url: '/services/data/v58.0/sobjects/AccountContactRelation/07k8I00000XZagpQAD',
        },
        Id: '07k8I00000XZagpQAD',
        AccountId: '0018I00000k1WugQAE',
        Account: {
          attributes: {
            type: 'Account',
            url: '/services/data/v58.0/sobjects/Account/0018I00000k1WugQAE',
          },
          USF_Account_Number__c: 'ACT-01640982',
        },
        Roles: 'None',
        ContactId: '0038I00000i2g6XQAQ',
        Contact: {
          attributes: {
            type: 'Contact',
            url: '/services/data/v58.0/sobjects/Contact/0038I00000i2g6XQAQ',
          },
          FirstName: 'Mayur2',
          LastName: 'Mali2',
          Email: 'mayur.mali2@zingworks.in',
          Phone: '3254523742',
          Ext__c: null,
          USF_Inactive__c: false,
        },
        IsActive: true,
      },
      {
        attributes: {
          type: 'AccountContactRelation',
          url: '/services/data/v58.0/sobjects/AccountContactRelation/07k8I00000XZaguQAD',
        },
        Id: '07k8I00000XZaguQAD',
        AccountId: '0018I00000k1WugQAE',
        Account: {
          attributes: {
            type: 'Account',
            url: '/services/data/v58.0/sobjects/Account/0018I00000k1WugQAE',
          },
          USF_Account_Number__c: 'ACT-01640982',
        },
        Roles: 'None',
        ContactId: '0038I00000i2g6cQAA',
        Contact: {
          attributes: {
            type: 'Contact',
            url: '/services/data/v58.0/sobjects/Contact/0038I00000i2g6cQAA',
          },
          FirstName: 'Mayur2',
          LastName: 'Mali2',
          Email: 'mayur.mali2@zingworks.in',
          Phone: '3254523742',
          Ext__c: null,
          USF_Inactive__c: false,
        },
        IsActive: true,
      },
      {
        attributes: {
          type: 'AccountContactRelation',
          url: '/services/data/v58.0/sobjects/AccountContactRelation/07k8I00000XZah4QAD',
        },
        Id: '07k8I00000XZah4QAD',
        AccountId: '0018I00000k1WugQAE',
        Account: {
          attributes: {
            type: 'Account',
            url: '/services/data/v58.0/sobjects/Account/0018I00000k1WugQAE',
          },
          USF_Account_Number__c: 'ACT-01640982',
        },
        Roles: 'None',
        ContactId: '0038I00000i2g6mQAA',
        Contact: {
          attributes: {
            type: 'Contact',
            url: '/services/data/v58.0/sobjects/Contact/0038I00000i2g6mQAA',
          },
          FirstName: 'Mayur3',
          LastName: 'Mali3',
          Email: 'mayur.mali3@zingworks.in',
          Phone: '3254523743',
          Ext__c: null,
          USF_Inactive__c: false,
        },
        IsActive: true,
      },
      {
        attributes: {
          type: 'AccountContactRelation',
          url: '/services/data/v58.0/sobjects/AccountContactRelation/07k8I00000XZajPQAT',
        },
        Id: '07k8I00000XZajPQAT',
        AccountId: '0018I00000k1WugQAE',
        Account: {
          attributes: {
            type: 'Account',
            url: '/services/data/v58.0/sobjects/Account/0018I00000k1WugQAE',
          },
          USF_Account_Number__c: 'ACT-01640982',
        },
        Roles: 'None',
        ContactId: '0038I00000i2gHLQAY',
        Contact: {
          attributes: {
            type: 'Contact',
            url: '/services/data/v58.0/sobjects/Contact/0038I00000i2gHLQAY',
          },
          FirstName: 'Shivam',
          LastName: 'Chabbaria',
          Email: 'shivam@gmail.com',
          Phone: '2365327636',
          Ext__c: null,
          USF_Inactive__c: false,
        },
        IsActive: true,
      },
      {
        attributes: {
          type: 'AccountContactRelation',
          url: '/services/data/v58.0/sobjects/AccountContactRelation/07k8I00000XZhh0QAD',
        },
        Id: '07k8I00000XZhh0QAD',
        AccountId: '0018I00000k1WugQAE',
        Account: {
          attributes: {
            type: 'Account',
            url: '/services/data/v58.0/sobjects/Account/0018I00000k1WugQAE',
          },
          USF_Account_Number__c: 'ACT-01640982',
        },
        Roles: 'None',
        ContactId: '0038I00000i2wHUQAY',
        Contact: {
          attributes: {
            type: 'Contact',
            url: '/services/data/v58.0/sobjects/Contact/0038I00000i2wHUQAY',
          },
          FirstName: 'Vaibhav',
          LastName: 'kumar',
          Email: 'vaibhav@gmail.com',
          Phone: '3257463478',
          Ext__c: null,
          USF_Inactive__c: false,
        },
        IsActive: true,
      },
      {
        attributes: {
          type: 'AccountContactRelation',
          url: '/services/data/v58.0/sobjects/AccountContactRelation/07k8I00000XZiTgQAL',
        },
        Id: '07k8I00000XZiTgQAL',
        AccountId: '0018I00000k1WugQAE',
        Account: {
          attributes: {
            type: 'Account',
            url: '/services/data/v58.0/sobjects/Account/0018I00000k1WugQAE',
          },
          USF_Account_Number__c: 'ACT-01640982',
        },
        Roles: 'None',
        ContactId: '0038I00000i2xyQQAQ',
        Contact: {
          attributes: {
            type: 'Contact',
            url: '/services/data/v58.0/sobjects/Contact/0038I00000i2xyQQAQ',
          },
          FirstName: 'Gaurav11111',
          LastName: 'Narvekar1111',
          Email: 'gaurav.narvekar+11111@zingworks.in',
          Phone: '+913475374437',
          Ext__c: null,
          USF_Inactive__c: false,
        },
        IsActive: true,
      },
    ];
    const accountServiceGetContactsResp = {
      success: true,
      status: 1000,
      message: 'Success',
      data: [
        {
          recordId: '07k8I00000XZag1QAD',
          accountId: '0018I00000k1WugQAE',
          contactId: '0038I00000i2g4bQAA',
          firstName: 'Gaurav157',
          lastName: 'Narvekar',
          email: 'gaurav.narvekar+157@zingworks.in',
          phone: '+913475374437',
        },
        {
          recordId: '07k8I00000XZagQQAT',
          accountId: '0018I00000k1WugQAE',
          contactId: '0038I00000i2g55QAA',
          firstName: 'Mayur',
          lastName: 'Mali',
          email: 'mayur.mali@zingworks.in',
          phone: '3254523745',
        },
        {
          recordId: '07k8I00000XZagfQAD',
          accountId: '0018I00000k1WugQAE',
          contactId: '0038I00000i2g5eQAA',
          firstName: 'Mayur1',
          lastName: 'Mali1',
          email: 'mayur.mali1@zingworks.in',
          phone: '3254523741',
        },
        {
          recordId: '07k8I00000XZagpQAD',
          accountId: '0018I00000k1WugQAE',
          contactId: '0038I00000i2g6XQAQ',
          firstName: 'Mayur2',
          lastName: 'Mali2',
          email: 'mayur.mali2@zingworks.in',
          phone: '3254523742',
        },
        {
          recordId: '07k8I00000XZaguQAD',
          accountId: '0018I00000k1WugQAE',
          contactId: '0038I00000i2g6cQAA',
          firstName: 'Mayur2',
          lastName: 'Mali2',
          email: 'mayur.mali2@zingworks.in',
          phone: '3254523742',
        },
        {
          recordId: '07k8I00000XZah4QAD',
          accountId: '0018I00000k1WugQAE',
          contactId: '0038I00000i2g6mQAA',
          firstName: 'Mayur3',
          lastName: 'Mali3',
          email: 'mayur.mali3@zingworks.in',
          phone: '3254523743',
        },
        {
          recordId: '07k8I00000XZajPQAT',
          accountId: '0018I00000k1WugQAE',
          contactId: '0038I00000i2gHLQAY',
          firstName: 'Shivam',
          lastName: 'Chabbaria',
          email: 'shivam@gmail.com',
          phone: '2365327636',
        },
        {
          recordId: '07k8I00000XZhh0QAD',
          accountId: '0018I00000k1WugQAE',
          contactId: '0038I00000i2wHUQAY',
          firstName: 'Vaibhav',
          lastName: 'kumar',
          email: 'vaibhav@gmail.com',
          phone: '3257463478',
        },
        {
          recordId: '07k8I00000XZiTgQAL',
          accountId: '0018I00000k1WugQAE',
          contactId: '0038I00000i2xyQQAQ',
          firstName: 'Gaurav11111',
          lastName: 'Narvekar1111',
          email: 'gaurav.narvekar+11111@zingworks.in',
          phone: '+913475374437',
        },
      ],
    };
    mockSfdcUssPortalUserService.getContacts.mockReturnValue(SfdcResponse);
    const result = await service.getContacts(request.id);
    expect(result).toHaveProperty('status', 1000);
    expect(result.data).toEqual(accountServiceGetContactsResp.data);
  });

  // Get Contacts - When no contacts are found
  it('Should return Contacts not found message', async () => {
    // Arrange

    const request = {
      id: '0018I00000k1WugQAE',
    };

    const SfdcResponse = [];

    const accountServiceGetContactsResp = {
      success: true,
      status: 1000,
      message: 'Contacts not found',
      data: [],
    };
    // Act
    mockSfdcUssPortalUserService.getContacts.mockReturnValue(SfdcResponse);
    const result = await service.getContacts(request.id);

    // Assert

    expect(result).toHaveProperty('status', 1000);
    expect(result.message).toBe('Contacts not found');
  });

  // Get Contacts - When SFDC service response is undefined
  it('Should return 1006 status code for undefined response from sfdc service', async () => {
    // Arrange

    const request = {
      id: '0018I00000k1WugQAE',
    };

    const SfdcResponse = undefined;

    const accountServiceGetContactsResp = {
      success: false,
      status: 1006,
      message: 'Something went wrong',
      data: [],
    };
    // Act
    mockSfdcUssPortalUserService.getContacts.mockReturnValue(SfdcResponse);
    const result = await service.getContacts(request.id);

    // Assert

    expect(result).toHaveProperty('success', false);
    expect(result).toMatchObject(accountServiceGetContactsResp);
  });
  // Fetch Archived Drafts - Success
  it('Should return archived drafts array', async () => {
    const request = {
      userId: '0018I00000k1WugQAE',
    };

    const SFDCQuoteServiceResp = {
      totalSize: 4,
      done: true,
      records: [
        {
          attributes: {
            type: 'SBQQ__Quote__c',
            url: '/services/data/v58.0/sobjects/SBQQ__Quote__c/a6O8I000000HGfwUAG',
          },
          Id: 'a6O8I000000HGfwUAG',
          LastModifiedDate: '2024-01-03T14:06:34.000+0000',
          Name: 'Q-515530',
          SBQQ__Status__c: 'Archived',
          Shipping_Address__r: {
            attributes: {
              type: 'USF_Address__c',
              url: '/services/data/v58.0/sobjects/USF_Address__c/a8x8I000000CqvpQAC',
            },
            Name: '16A Winslow Rd, Brookline - Brookline - MA',
          },
          Serviceable_Zip_Code__r: {
            attributes: {
              type: 'Serviceable_Zip_Code__c',
              url: '/services/data/v58.0/sobjects/Serviceable_Zip_Code__c/a6y8I0000004bqKQAQ',
            },
            Zip_Code__c: '02446',
          },
          Site_Complete__c: false,
          Billing_Complete__c: false,
          Payment_Method_Id__c: null,
          isCheckPaymentMethod__c: false,
          SBQQ__Ordered__c: false,
          Bill_To_Address__r: null,
        },
        {
          attributes: {
            type: 'SBQQ__Quote__c',
            url: '/services/data/v58.0/sobjects/SBQQ__Quote__c/a6O8I000000HGgfUAG',
          },
          Id: 'a6O8I000000HGgfUAG',
          LastModifiedDate: '2024-01-03T14:06:55.000+0000',
          Name: 'Q-515537',
          SBQQ__Status__c: 'Archived',
          Shipping_Address__r: {
            attributes: {
              type: 'USF_Address__c',
              url: '/services/data/v58.0/sobjects/USF_Address__c/a8x8I000000CqwdQAC',
            },
            Name: '4813 Mansfield St, San Di - San Diego - CA',
          },
          Serviceable_Zip_Code__r: {
            attributes: {
              type: 'Serviceable_Zip_Code__c',
              url: '/services/data/v58.0/sobjects/Serviceable_Zip_Code__c/a6y8I0000004ZLsQAM',
            },
            Zip_Code__c: '92116',
          },
          Site_Complete__c: false,
          Billing_Complete__c: false,
          Payment_Method_Id__c: null,
          isCheckPaymentMethod__c: false,
          SBQQ__Ordered__c: false,
          Bill_To_Address__r: null,
        },
        {
          attributes: {
            type: 'SBQQ__Quote__c',
            url: '/services/data/v58.0/sobjects/SBQQ__Quote__c/a6O8I000000HGxIUAW',
          },
          Id: 'a6O8I000000HGxIUAW',
          LastModifiedDate: '2024-01-09T15:08:30.000+0000',
          Name: 'Q-515706',
          SBQQ__Status__c: 'Archived',
          Shipping_Address__r: {
            attributes: {
              type: 'USF_Address__c',
              url: '/services/data/v58.0/sobjects/USF_Address__c/a8x8I000000CrBAQA0',
            },
            Name: '222 Pleasant St, Brooklin - Brookline - MA',
          },
          Serviceable_Zip_Code__r: {
            attributes: {
              type: 'Serviceable_Zip_Code__c',
              url: '/services/data/v58.0/sobjects/Serviceable_Zip_Code__c/a6y8I0000004bqKQAQ',
            },
            Zip_Code__c: '02446',
          },
          Site_Complete__c: false,
          Billing_Complete__c: false,
          Payment_Method_Id__c: null,
          isCheckPaymentMethod__c: false,
          SBQQ__Ordered__c: false,
          Bill_To_Address__r: null,
        },
        {
          attributes: {
            type: 'SBQQ__Quote__c',
            url: '/services/data/v58.0/sobjects/SBQQ__Quote__c/a6O8I000000HGy1UAG',
          },
          Id: 'a6O8I000000HGy1UAG',
          LastModifiedDate: '2024-01-09T15:08:14.000+0000',
          Name: 'Q-515715',
          SBQQ__Status__c: 'Archived',
          Shipping_Address__r: {
            attributes: {
              type: 'USF_Address__c',
              url: '/services/data/v58.0/sobjects/USF_Address__c/a8x8I000000CqvpQAC',
            },
            Name: '16A Winslow Rd, Brookline - Brookline - MA',
          },
          Serviceable_Zip_Code__r: {
            attributes: {
              type: 'Serviceable_Zip_Code__c',
              url: '/services/data/v58.0/sobjects/Serviceable_Zip_Code__c/a6y8I0000004bqKQAQ',
            },
            Zip_Code__c: '02446',
          },
          Site_Complete__c: false,
          Billing_Complete__c: false,
          Payment_Method_Id__c: null,
          isCheckPaymentMethod__c: false,
          SBQQ__Ordered__c: false,
          Bill_To_Address__r: null,
        },
      ],
    };

    mockSfdcQuoteService.fetchArchivedDrafts.mockResolvedValueOnce(SFDCQuoteServiceResp);
    //Act
    const result = await service.fetchArchivedDrafts(['001VA000007nwekYAA'],'');

    //Assert
    expect(result).toHaveProperty('status', 200);
  });
  // Fetch Archived Drafts - Failure (when SFDCQuoteService returns undefined)
  it('Should return status 1022 and message Fail', async () => {
    const request = {
      userId: '0018I00000k1WugQAE',
    };

    const SFDCQuoteServiceResp = undefined;

    mockSfdcQuoteService.fetchArchivedDrafts.mockResolvedValueOnce(SFDCQuoteServiceResp);
    //Act
    const result = await service.fetchArchivedDrafts(['001VA000007nwekYAA'],'');

    //Assert
    expect(result).toHaveProperty('status', 1006);
    expect(result).toHaveProperty('message', 'Something went wrong');
  });
  //Fetch Archived Drafts -  when SFDCQuoteService returns empty array
  it('Should return data as an empty array ', async () => {
    const request = {
      userId: '0018I00000k1WugQAE',
    };

    const SFDCQuoteServiceResp = {
      records: [],
    };
    mockSfdcQuoteService.fetchArchivedDrafts.mockResolvedValueOnce(SFDCQuoteServiceResp);
    const result = await service.fetchArchivedDrafts(['0018I00000k1WugQAE'],'');
    expect(result).toHaveProperty('status', 1000);
    expect(result).toHaveProperty('message', 'Success');
    expect(result).toHaveProperty('data', []);
  });
  // Get Account
  it('Should return account details', async () => {
    const request = {
      id: '0018I00000k1WugQAE',
    };

    const SFDCAccountService = {
      Id: '0018I00000k1WugQAE',
      attributes: {
        type: 'Account',
        url: '/services/data/v58.0/sobjects/Account/0018I00000k1WugQAE',
      },
      Name: 'MyUSS Test Gaurav157',
      USF_Account_Number__c: 'ACT-01640982',
      PP_Email__c: 'gaurav.narvekar+157@zingworks.in',
      AVA_MAPPER__Business_Identification_Number__c: null,
      AVA_MAPPER__Exemption_Number__c: null,
      Primary_Payer__c: '0038I00000i2g4bQAA',
      Customer_Segment__c: 'Business',
      Business_Type__c: 'Entertainment',
      PO_Required__c: false,
      Lien_Release_Required__c: false,
      Auto_Pay_Requirement__c: 'N/A',
      BillingAddress: {
        city: null,
        country: 'United States',
        countryCode: 'US',
        geocodeAccuracy: null,
        latitude: null,
        longitude: null,
        postalCode: null,
        state: null,
        stateCode: null,
        street: null,
      },
      BillingStreet: null,
      BillingCity: null,
      BillingState: null,
      BillingStateCode__c: null,
      BillingPostalCode: null,
      BillingCountry: 'United States',
      BillingCountryCode: 'US',
      Primary_Address_ID__c: null,
    };

    mockSfdcAccountService.getAccount.mockResolvedValueOnce(SFDCAccountService);
    //Act
    const result = await service.getAccount(request.id);

    //Assert

    expect(result.id).toBe('0018I00000k1WugQAE');
  });
  // Get Account - Failure (when SfdcAccountService returns undefined)
  it('Should throw an http exception error', async () => {
    const request = {
      id: '0018I00000k1WugQAE',
    };

    const SFDCAccountService = undefined;

    mockSfdcAccountService.getAccount.mockResolvedValueOnce(SFDCAccountService);
    //Act
    await expect(service.getAccount(request.id)).rejects.toThrow(HttpException);
    expect(mockSfdcAccountService.getAccount).toHaveBeenCalledWith(request.id);
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
    (mockSfdcQuoteService.fetchDrafts as jest.Mock).mockResolvedValueOnce(SFDCQuoteServiceResp);
    (mockFirestoreService.getCollectionDocsByFieldName as jest.Mock).mockResolvedValueOnce([]);

    const result = await service.fetchDrafts(['001VA000007nwekYAA'],'',status='');
    expect(result).toHaveProperty('status', 1000);
    expect(result).toHaveProperty('message', 'Success');
    expect(result.data).toEqual(serviceResponse.data);
  });
  //fetch draft updated unit tests - fails
  it('Should return error', async () => {
    const SfdcServiceResp = null;
    const FirestoreResp = null;
    const serviceResponse = { status: 1041, message: 'Error while fetching quotes',data : [] };
    mockSfdcQuoteService.fetchDrafts.mockResolvedValueOnce(SfdcServiceResp);
    mockFirestoreService.getCollectionDocsByFieldName.mockResolvedValueOnce(FirestoreResp);
    const result = await service.fetchDrafts(['001VA000007nwekYAA'],'',status='');

    expect(result.message).toBe('Error while fetching quotes');
    expect(result).toMatchObject(serviceResponse);
  });

});

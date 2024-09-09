import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { LoggerService } from '../../../core/logger/logger.service';
import { CacheService } from '../../../core/cache/cache.service';
jest.mock('../../../core/cache/cache.service');
import { SfdcBaseService } from '../../../backend/sfdc/services/sfdc-base/sfdc-base.service';
import { SfdcUssPortalUserService } from '../../../backend/sfdc/services/sfdc-uss-portal-user/sfdc-uss-portal-user.service';
import { SfdcQuoteService } from '../../../backend/sfdc/services/sfdc-quote/sfdc-quote.service';
import { SfdcDocumentService } from '../../../backend/sfdc/services/sfdc-document/sfdc-document.service';
import { Auth0MyUSSAPIService } from '../../../backend/auth0/services/auth0-myuss-api/auth0-myuss-api.service';
import { UserController } from './user.controller';
import { UserService } from '../../services/user/user.service';
import { ContractService } from '../../services/contract/contract.service';
import { SfdcContractService } from '../../../backend/sfdc/services/sfdc-contract/sfdc-contract.service';
import { StripeService } from '../../../backend/stripe/services/stripe/stripe.service';
import { PaymentMethodsService } from '../../services/payment/payment-methods.service';
import { SfdcAccountService } from '../../../backend/sfdc/services/sfdc-account/sfdc-account.service';
import {Auth0ManagementAPIService} from '../../../backend/auth0/services/auth0-management-api/auth0-management-api.service';
import { Auth0UserService } from '../../../backend/auth0/services/auth0-user/auth0-user.service';
import { TrackUserActionService } from '../../../core/track-user-action/track-user-action-service'
import { FirestoreService } from '../../../backend/google/firestore/firestore.service'
import { SignupReqDTO } from './dto/signup-req.dto';
import { UpdateProfileReqDTO } from './dto/update-profile-req.dto';
describe('UserController', () => {
  let controller: UserController;

  let mockSfdcService = {
    getQuery: jest.fn(),
    createSObject: jest.fn(),
  };

  let mockConfigService = {
    get: jest.fn(),
  };

  let mockLoggerService = {
    get: jest.fn(),
  };
  let mockAuth0Service = {
    get: jest.fn(),
    changePassword: jest.fn(),
    isEmailVerified: jest.fn(),
    requestEmailVerification: jest.fn(),
  };

  let mockUserService = {
    getContacts: jest.fn(),
    getAddresses: jest.fn(),
    getProducts: jest.fn(),
    fetchQuotes: jest.fn(),
    fetchDrafts: jest.fn(),
    fetchProfile: jest.fn(),
    updateUser: jest.fn(),
    clearCache: jest.fn(),
    getCacheKeys: jest.fn(),
    createUser: jest.fn(),
    requestEmailVerification: jest.fn(),
    fetchUsersDetails: jest.fn(),
    hasAccessToAccount: jest.fn(),
    changePassword: jest.fn(),
  };

  let mockStripeService = {
    getCustomerByUSSAccountId: jest.fn(),
    getPaymentMethods: jest.fn(),
    createCustomer: jest.fn(),
    createSetupIntent: jest.fn(),
  };
  let mockTrackUserActionService = {
    setPortalActions: jest.fn()
  }
  let mockFirestoreService= {
        fetchAccountDetails: jest.fn(),
        fetchUserDetails: jest.fn(),
        updateUserDetails: jest.fn(),
        getCollectionDocsByFieldName: jest.fn()
  }
  let mockSfdcUssPortalUserService = {
    getContactForUserId: jest.fn(),
    getAccountIdsForUser: jest.fn(),
    getUserContext: jest.fn(),
    getQuoteForUser: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    fetchUssPortalUser: jest.fn(),
    fetchProfile: jest.fn()
  }
  let mockCacheService = {
    set: jest.fn(),
    get: jest.fn().mockResolvedValue(JSON.stringify({
        status: 1000,
        message: 'Success',
        data: {
            "emailVerified": false,
            "ussPortalUserId": "aHQVA00000001ov4AA",
            "email": "arati.gadgil+201@zingworks.in",
            "firstName": "Arati",
            "lastName": "Kulkarni",
            "phone": "9898777777",
            "id": "003VA000005vL23YAE",
            "accountId": "001VA000003zESYYA2",
            "accountName": "Test",
            "autoPayRequirement": "Yes - USS Required",
            "businessType": "Other Business",
            "customerType": "Business",
            "emailForCC": [],
            "contactId": "003VA000005vL23YAE",
            "accountNumber": "ACT-01646386",
            "accounts": [
                {
                    "contactId": "003VA000005vL23YAE",
                    "firstName": "Arati",
                    "lastName": "Kulkarni",
                    "phone": "9898777777",
                    "email": "arati.gadgil+201@zingworks.in",
                    "accountId": "001VA000003zESYYA2",
                    "accountName": "Test",
                    "accountNumber": "ACT-01646386",
                    "autoPayRequirement": "Yes - USS Required",
                    "businessType": "Other Business",
                    "customerType": "Business",
                    "emailForCC": [],
                    "myussEnabled": true,
                    "myussQuotesEnabled": true,
                    "myussHomeEnabled": true,
                    "myussEasyPayEnabled": false,
                    "myussBillingEnabled": true,
                    "myussOrdersEnabled": true,
                    "myussCasesEnabled": false,
                    "myussProjectsEnabled": false,
                    "poRequired": false,
                }
            ],
            "myussEnabled": true,
            "myussQuotesEnabled": true,
            "myussHomeEnabled": true,
            "myussEasyPayEnabled": false,
            "myussBillingEnabled": true,
            "myussOrdersEnabled": true,
            "myussCasesEnabled": false,
            "myussProjectsEnabled": false,
            "poRequired": false,
            quotes: [],
            contracts: [],
            title: ''
        }
    })),
    del: jest.fn()
  }
  const request = {
    "user": {
      "sub": "auth0|660664ce154c2ff59d8699be"
    }
  }
   //Run this block before each unit test
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        SfdcBaseService,
        SfdcQuoteService,
        SfdcDocumentService,
        ContractService,
        SfdcContractService,
        PaymentMethodsService,
        SfdcAccountService,
        Auth0ManagementAPIService,
        Auth0MyUSSAPIService,
        {
          provide: Auth0UserService,
          useValue: mockAuth0Service,
        },
        {
          provide: StripeService,
          useValue: mockStripeService,
        },
        {
          provide: CacheService,
          useValue: mockCacheService
        },
        {
          provide: '',
          useValue: mockSfdcService,
        },
        ConfigService,
        {
          provide: '',
          useValue: mockConfigService,
        },
        LoggerService,
        {
          provide: '',
          useValue: mockLoggerService,
        },
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: SfdcUssPortalUserService,
          useValue: mockSfdcUssPortalUserService,
        },
        {
          provide: TrackUserActionService,
          useValue: mockTrackUserActionService
        },
        { provide: FirestoreService, useValue: mockFirestoreService}
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
// new test cases 
  //create user success
  it('create user success', async () => {
    const signupReqDTO: SignupReqDTO = {
      "firstName": "Arati",
      "lastName": "Kulkarni",
      "phone": "+19898777777",
      "customerSegment": "Business",
      "businessType": "Other Business",
      "accountName": "Test",
      "email": "mailto:arati.gadgil+201@zingworks.in",
      "auth0Id": "auth0|660664ce154c2ff59d8699be",
      "name": "mailto:arati.gadgil+201@zingworks.in"
    }
    const response = {
      "success": true,
      "message": "Success",
      "status": 1000,
      "data": {}
    } 
    const createUssPortalUserResponse = { message: 'Success', success: true , errors: [] , id: ''}
    mockSfdcUssPortalUserService.createUser.mockResolvedValue(createUssPortalUserResponse);
    mockUserService.createUser.mockResolvedValue(response);
    const result = await controller.signup(signupReqDTO);
    expect(result).toEqual(response);
  });
  //create user fail
  it('create user fail', async () => {
    const signupReqDTO: SignupReqDTO = {
        "firstName": "Arati",
        "lastName": "Kulkarni",
        "phone": "+19898777777",
        "customerSegment": "Business",
        "businessType": "Other Business",
        "accountName": "Test",
        "email": "arati.gadgil+201@zingworks.in",
        "auth0Id": "auth0|660664ce154c2ff59d8699be",
        "name": "arati.gadgil+201@zingworks.in"
        }
    const response = {
        success: false,
        message: 'Fail to create account. Please try again.',
        status: 1030,
        data: { err:"err in USS_Portal_User__c"},
      }  
      const createUssPortalUserResponse = {message: 'err in USS_Portal_User__c', success: false , errors: [] , id: ''}
      mockSfdcUssPortalUserService.createUser.mockResolvedValue(createUssPortalUserResponse);
        
    mockUserService.createUser.mockResolvedValue(response);
    const result = await controller.signup(signupReqDTO);
    expect(result).toBeDefined();
    expect(result).toEqual(response);
  
  })
  
  //update user success
  it('should update user', async () => {
    const updateProfileReqDTO: UpdateProfileReqDTO = {
        "firstName": "Arati G",
        "lastName": "Kulkarni",
        "accountId": "001VA000003zESYYA2",
        "contactId": "003VA000005vL23YAE",
        "emailIds": [
          null,
          null,
          null,
          null,
          null,
          null
        ]
      }
    const response = {
        "success": true,
        "message": "Success",
        "status": 1000,
        "data": {}
        }
    const updateUssPortalUserResponse = { message: 'Success', success: true , errors: [] , id: ''}
    mockSfdcUssPortalUserService.updateUser.mockResolvedValue(updateUssPortalUserResponse);
    mockUserService.updateUser.mockResolvedValue(response);
    const result = await controller.updateProfile(request,updateProfileReqDTO);
    expect(result).toBeDefined();
    expect(result).toEqual(response);
  })
  //update user fail
  it('should update user', async () => {
      const updateProfileReqDTO: UpdateProfileReqDTO = {
          "firstName": "Arati G",
          "lastName": "Kulkarni",
          "accountId": "001VA000003zESYYA2",
          "contactId": "003VA000005vL23YAE",
          "emailIds": [
            null,
            null,
            null,
            null,
            null,
            null
          ]
        }
      const response = { 
          success: false,
          message: 'Could not update profile. Please try again.',
          status: 1016,
          data:{}
      }
      const updateUssPortalUserResponse = { message: 'Fail', success: false , errors: [] , id: ''}
      mockSfdcUssPortalUserService.updateUser.mockResolvedValue(updateUssPortalUserResponse);
      mockUserService.updateUser.mockResolvedValue(response);
      const result = await controller.updateProfile(request,updateProfileReqDTO);
      expect(result).toBeDefined();
      expect(result).toEqual(response);
  })
  // //fetch user details success
  it('should fetch user details me', async () => {
    const SFDCfetchProfileResponse =  {
      ussPortalUserId: "aHQ8I000000L6g0WAC",
      email: "arati.gadgil+5@zingworks.in",
      firstName: "Arati +5",
      lastName: "Kulkarni",
      phone: "+919763373464",
      id: "0038I00000i2yVtQAI",
      accountId: "0018I00000k1qw3QAA",
      accountName: "Atreya",
      autoPayRequirement: "Yes - USS Required",
      businessType: "Other Business",
      customerType: "Business",
      emailForCC: [
      ],
      contactId: "0038I00000i2yVtQAI",
      accountNumber: "ACT-01640993",
      accounts: [
        {
          contactId: "0038I00000i2yVtQAI",
          firstName: "Arati +5",
          lastName: "Kulkarni",
          phone: "+919763373464",
          email: "arati.gadgil+5@zingworks.in",
          accountId: "0018I00000k1qw3QAA",
          accountName: "Atreya",
          accountNumber: "ACT-01640993",
          autoPayRequirement: "Yes - USS Required",
          businessType: "Other Business",
          customerType: "Business",
          emailForCC: [
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
          accountPaymentStatus: null,
        },
        {
          contactId: "0038I00000i3GPVQA2",
          firstName: "Arati +5",
          lastName: "Kulkarni",
          phone: "+919763373464",
          email: "arati.gadgil+5@zingworks.in",
          accountId: "0018I00000k1qw3QAA",
          accountName: "Atreya",
          accountNumber: "ACT-01640993",
          autoPayRequirement: "Yes - USS Required",
          businessType: "Other Business",
          customerType: "Business",
          emailForCC: [
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
          accountPaymentStatus: null,
        },
        {
          contactId: "0038I00000i3pnTQAQ",
          firstName: "SANJIV1",
          lastName: "SHINDE1",
          phone: "09764521706",
          email: "sanjivbshinde@gmail.com",
          accountId: "0018I00000jIg0sQAC",
          accountName: "SANJIV",
          accountNumber: "ACT-01640742",
          autoPayRequirement: "Yes - USS Required",
          businessType: "Consumer",
          customerType: "Consumer",
          emailForCC: [
            "test@gmail.com",
            "sanjiv13@gmail.com",
            "sanjiv14@gmail.com",
            "ram@ss.com",
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
          accountPaymentStatus: null,
        },
        {
          contactId: "0038I00000i3rROQAY",
          firstName: "Mayur1",
          lastName: "Mali1",
          phone: "09764521706",
          email: "mayur.mali@zingowrks.in",
          accountId: "0018I00000hZ635QAC",
          accountName: "Frontier Logistics, LP",
          accountNumber: "ACT-01640651",
          autoPayRequirement: "N/A",
          businessType: "Other Business",
          customerType: "Business",
          emailForCC: [
            "test6@gmail.com",
            "test3@gmail.com",
            "test6@gmail.com",
            "test3@gmail.com",
          ],
          myussEnabled: true,
          myussQuotesEnabled: true,
          myussHomeEnabled: true,
          myussEasyPayEnabled: true,
          myussBillingEnabled: true,
          myussOrdersEnabled: true,
          myussCasesEnabled: false,
          myussProjectsEnabled: false,
          poRequired: true,
          accountPaymentStatus: null,
        },
        {
          contactId: "003VA000005rsyfYAA",
          firstName: "Gaurav250",
          lastName: "Narvekar",
          phone: "9898765645",
          email: "gaurav.narvekar+250@zingworks.in",
          accountId: "001VA000003xee4YAA",
          accountName: "MyUSS Test Gaurav250",
          accountNumber: "ACT-01646384",
          autoPayRequirement: "Yes - USS Required",
          businessType: "Entertainment",
          customerType: "Business",
          emailForCC: [
          ],
          myussEnabled: true,
          myussQuotesEnabled: false,
          myussHomeEnabled: false,
          myussEasyPayEnabled: false,
          myussBillingEnabled: true,
          myussOrdersEnabled: false,
          myussCasesEnabled: false,
          myussProjectsEnabled: false,
          poRequired: false,
          accountPaymentStatus: null,
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
      accountPaymentStatus: null,
    }
    const isEmailVerifiedResponse = true
    const userServiceFetchProfile = {
      status: 1000,
      message: "Success",
      data: {
        ussPortalUserId: "aHQ8I000000L6g0WAC",
        email: "arati.gadgil+5@zingworks.in",
        firstName: "Arati +5",
        lastName: "Kulkarni",
        phone: "+919763373464",
        id: "0038I00000i2yVtQAI",
        accountId: "0018I00000k1qw3QAA",
        accountName: "Atreya",
        autoPayRequirement: "Yes - USS Required",
        businessType: "Other Business",
        customerType: "Business",
        emailForCC: [
        ],
        contactId: "0038I00000i2yVtQAI",
        accountNumber: "ACT-01640993",
        accounts: [
          {
            contactId: "0038I00000i2yVtQAI",
            firstName: "Arati +5",
            lastName: "Kulkarni",
            phone: "+919763373464",
            email: "arati.gadgil+5@zingworks.in",
            accountId: "0018I00000k1qw3QAA",
            accountName: "Atreya",
            accountNumber: "ACT-01640993",
            autoPayRequirement: "Yes - USS Required",
            businessType: "Other Business",
            customerType: "Business",
            emailForCC: [
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
            accountPaymentStatus: null,
          },
          {
            contactId: "0038I00000i3GPVQA2",
            firstName: "Arati +5",
            lastName: "Kulkarni",
            phone: "+919763373464",
            email: "arati.gadgil+5@zingworks.in",
            accountId: "0018I00000k1qw3QAA",
            accountName: "Atreya",
            accountNumber: "ACT-01640993",
            autoPayRequirement: "Yes - USS Required",
            businessType: "Other Business",
            customerType: "Business",
            emailForCC: [
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
            accountPaymentStatus: null,
          },
          {
            contactId: "0038I00000i3pnTQAQ",
            firstName: "SANJIV1",
            lastName: "SHINDE1",
            phone: "09764521706",
            email: "sanjivbshinde@gmail.com",
            accountId: "0018I00000jIg0sQAC",
            accountName: "SANJIV",
            accountNumber: "ACT-01640742",
            autoPayRequirement: "Yes - USS Required",
            businessType: "Consumer",
            customerType: "Consumer",
            emailForCC: [
              "test@gmail.com",
              "sanjiv13@gmail.com",
              "sanjiv14@gmail.com",
              "ram@ss.com",
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
            accountPaymentStatus: null,
          },
          {
            contactId: "0038I00000i3rROQAY",
            firstName: "Mayur1",
            lastName: "Mali1",
            phone: "09764521706",
            email: "mayur.mali@zingowrks.in",
            accountId: "0018I00000hZ635QAC",
            accountName: "Frontier Logistics, LP",
            accountNumber: "ACT-01640651",
            autoPayRequirement: "N/A",
            businessType: "Other Business",
            customerType: "Business",
            emailForCC: [
              "test6@gmail.com",
              "test3@gmail.com",
              "test6@gmail.com",
              "test3@gmail.com",
            ],
            myussEnabled: true,
            myussQuotesEnabled: true,
            myussHomeEnabled: true,
            myussEasyPayEnabled: true,
            myussBillingEnabled: true,
            myussOrdersEnabled: true,
            myussCasesEnabled: false,
            myussProjectsEnabled: false,
            poRequired: true,
            accountPaymentStatus: null,
          },
          {
            contactId: "003VA000005rsyfYAA",
            firstName: "Gaurav250",
            lastName: "Narvekar",
            phone: "9898765645",
            email: "gaurav.narvekar+250@zingworks.in",
            accountId: "001VA000003xee4YAA",
            accountName: "MyUSS Test Gaurav250",
            accountNumber: "ACT-01646384",
            autoPayRequirement: "Yes - USS Required",
            businessType: "Entertainment",
            customerType: "Business",
            emailForCC: [
            ],
            myussEnabled: true,
            myussQuotesEnabled: false,
            myussHomeEnabled: false,
            myussEasyPayEnabled: false,
            myussBillingEnabled: true,
            myussOrdersEnabled: false,
            myussCasesEnabled: false,
            myussProjectsEnabled: false,
            poRequired: false,
            accountPaymentStatus: null,
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
        accountPaymentStatus: null,
        emailVerified: true,
      },
    }
    const userFetchUsersDetails ={
      "success": true,
      "message": "Success",
      "status": 1000,
      "data": {
          "ussPortalUserId": "aHQ8I000000L6g0WAC",
          "email": "arati.gadgil+5@zingworks.in",
          "firstName": "Arati +5",
          "lastName": "Kulkarni",
          "phone": "+919763373464",
          "id": "0038I00000i2yVtQAI",
          "accountId": "0018I00000k1qw3QAA",
          "accountName": "Atreya",
          "autoPayRequirement": "Yes - USS Required",
          "businessType": "Other Business",
          "customerType": "Business",
          "emailForCC": [],
          "contactId": "0038I00000i2yVtQAI",
          "accountNumber": "ACT-01640993",
          "accounts": [
              {
                  "contactId": "0038I00000i2yVtQAI",
                  "firstName": "Arati +5",
                  "lastName": "Kulkarni",
                  "phone": "+919763373464",
                  "email": "arati.gadgil+5@zingworks.in",
                  "accountId": "0018I00000k1qw3QAA",
                  "accountName": "Atreya",
                  "accountNumber": "ACT-01640993",
                  "autoPayRequirement": "Yes - USS Required",
                  "businessType": "Other Business",
                  "customerType": "Business",
                  "emailForCC": [],
                  "myussEnabled": true,
                  "myussQuotesEnabled": true,
                  "myussHomeEnabled": true,
                  "myussEasyPayEnabled": true,
                  "myussBillingEnabled": true,
                  "myussOrdersEnabled": true,
                  "myussCasesEnabled": true,
                  "myussProjectsEnabled": true,
                  "poRequired": false,
                  "accountPaymentStatus": null
              },
              {
                  "contactId": "0038I00000i3GPVQA2",
                  "firstName": "Arati +5",
                  "lastName": "Kulkarni",
                  "phone": "+919763373464",
                  "email": "arati.gadgil+5@zingworks.in",
                  "accountId": "0018I00000k1qw3QAA",
                  "accountName": "Atreya",
                  "accountNumber": "ACT-01640993",
                  "autoPayRequirement": "Yes - USS Required",
                  "businessType": "Other Business",
                  "customerType": "Business",
                  "emailForCC": [],
                  "myussEnabled": true,
                  "myussQuotesEnabled": true,
                  "myussHomeEnabled": true,
                  "myussEasyPayEnabled": true,
                  "myussBillingEnabled": true,
                  "myussOrdersEnabled": true,
                  "myussCasesEnabled": true,
                  "myussProjectsEnabled": true,
                  "poRequired": false,
                  "accountPaymentStatus": null
              },
              {
                  "contactId": "0038I00000i3pnTQAQ",
                  "firstName": "SANJIV1",
                  "lastName": "SHINDE1",
                  "phone": "09764521706",
                  "email": "sanjivbshinde@gmail.com",
                  "accountId": "0018I00000jIg0sQAC",
                  "accountName": "SANJIV",
                  "accountNumber": "ACT-01640742",
                  "autoPayRequirement": "Yes - USS Required",
                  "businessType": "Consumer",
                  "customerType": "Consumer",
                  "emailForCC": [
                      "test@gmail.com",
                      "sanjiv13@gmail.com",
                      "sanjiv14@gmail.com",
                      "ram@ss.com"
                  ],
                  "myussEnabled": true,
                  "myussQuotesEnabled": true,
                  "myussHomeEnabled": true,
                  "myussEasyPayEnabled": true,
                  "myussBillingEnabled": true,
                  "myussOrdersEnabled": true,
                  "myussCasesEnabled": true,
                  "myussProjectsEnabled": true,
                  "poRequired": false,
                  "accountPaymentStatus": null
              },
              {
                  "contactId": "0038I00000i3rROQAY",
                  "firstName": "Mayur1",
                  "lastName": "Mali1",
                  "phone": "09764521706",
                  "email": "mayur.mali@zingowrks.in",
                  "accountId": "0018I00000hZ635QAC",
                  "accountName": "Frontier Logistics, LP",
                  "accountNumber": "ACT-01640651",
                  "autoPayRequirement": "N/A",
                  "businessType": "Other Business",
                  "customerType": "Business",
                  "emailForCC": [
                      "test6@gmail.com",
                      "test3@gmail.com",
                      "test6@gmail.com",
                      "test3@gmail.com"
                  ],
                  "myussEnabled": true,
                  "myussQuotesEnabled": true,
                  "myussHomeEnabled": true,
                  "myussEasyPayEnabled": true,
                  "myussBillingEnabled": true,
                  "myussOrdersEnabled": true,
                  "myussCasesEnabled": false,
                  "myussProjectsEnabled": false,
                  "poRequired": true,
                  "accountPaymentStatus": null
              },
              {
                  "contactId": "003VA000005rsyfYAA",
                  "firstName": "Gaurav250",
                  "lastName": "Narvekar",
                  "phone": "9898765645",
                  "email": "gaurav.narvekar+250@zingworks.in",
                  "accountId": "001VA000003xee4YAA",
                  "accountName": "MyUSS Test Gaurav250",
                  "accountNumber": "ACT-01646384",
                  "autoPayRequirement": "Yes - USS Required",
                  "businessType": "Entertainment",
                  "customerType": "Business",
                  "emailForCC": [],
                  "myussEnabled": true,
                  "myussQuotesEnabled": false,
                  "myussHomeEnabled": false,
                  "myussEasyPayEnabled": false,
                  "myussBillingEnabled": true,
                  "myussOrdersEnabled": false,
                  "myussCasesEnabled": false,
                  "myussProjectsEnabled": false,
                  "poRequired": false,
                  "accountPaymentStatus": null
              }
          ],
          "myussEnabled": true,
          "myussQuotesEnabled": true,
          "myussHomeEnabled": true,
          "myussEasyPayEnabled": true,
          "myussBillingEnabled": true,
          "myussOrdersEnabled": true,
          "myussCasesEnabled": true,
          "myussProjectsEnabled": true,
          "poRequired": false,
          "accountPaymentStatus": null,
          "emailVerified": true
      }
    }
    const meResponse = {
      "success": true,
      "message": "Success",
      "status": 1000,
      "data": {
          "ussPortalUserId": "aHQ8I000000L6g0WAC",
          "email": "arati.gadgil+5@zingworks.in",
          "firstName": "Arati +5",
          "lastName": "Kulkarni",
          "phone": "+919763373464",
          "id": "0038I00000i2yVtQAI",
          "accountId": "0018I00000k1qw3QAA",
          "accountName": "Atreya",
          "autoPayRequirement": "Yes - USS Required",
          "businessType": "Other Business",
          "customerType": "Business",
          "emailForCC": [],
          "contactId": "0038I00000i2yVtQAI",
          "accountNumber": "ACT-01640993",
          "accounts": [
              {
                  "contactId": "0038I00000i2yVtQAI",
                  "firstName": "Arati +5",
                  "lastName": "Kulkarni",
                  "phone": "+919763373464",
                  "email": "arati.gadgil+5@zingworks.in",
                  "accountId": "0018I00000k1qw3QAA",
                  "accountName": "Atreya",
                  "accountNumber": "ACT-01640993",
                  "autoPayRequirement": "Yes - USS Required",
                  "businessType": "Other Business",
                  "customerType": "Business",
                  "emailForCC": [],
                  "myussEnabled": true,
                  "myussQuotesEnabled": true,
                  "myussHomeEnabled": true,
                  "myussEasyPayEnabled": true,
                  "myussBillingEnabled": true,
                  "myussOrdersEnabled": true,
                  "myussCasesEnabled": true,
                  "myussProjectsEnabled": true,
                  "poRequired": false,
                  "accountPaymentStatus": null
              },
              {
                  "contactId": "0038I00000i3GPVQA2",
                  "firstName": "Arati +5",
                  "lastName": "Kulkarni",
                  "phone": "+919763373464",
                  "email": "arati.gadgil+5@zingworks.in",
                  "accountId": "0018I00000k1qw3QAA",
                  "accountName": "Atreya",
                  "accountNumber": "ACT-01640993",
                  "autoPayRequirement": "Yes - USS Required",
                  "businessType": "Other Business",
                  "customerType": "Business",
                  "emailForCC": [],
                  "myussEnabled": true,
                  "myussQuotesEnabled": true,
                  "myussHomeEnabled": true,
                  "myussEasyPayEnabled": true,
                  "myussBillingEnabled": true,
                  "myussOrdersEnabled": true,
                  "myussCasesEnabled": true,
                  "myussProjectsEnabled": true,
                  "poRequired": false,
                  "accountPaymentStatus": null
              },
              {
                  "contactId": "0038I00000i3pnTQAQ",
                  "firstName": "SANJIV1",
                  "lastName": "SHINDE1",
                  "phone": "09764521706",
                  "email": "sanjivbshinde@gmail.com",
                  "accountId": "0018I00000jIg0sQAC",
                  "accountName": "SANJIV",
                  "accountNumber": "ACT-01640742",
                  "autoPayRequirement": "Yes - USS Required",
                  "businessType": "Consumer",
                  "customerType": "Consumer",
                  "emailForCC": [
                      "test@gmail.com",
                      "sanjiv13@gmail.com",
                      "sanjiv14@gmail.com",
                      "ram@ss.com"
                  ],
                  "myussEnabled": true,
                  "myussQuotesEnabled": true,
                  "myussHomeEnabled": true,
                  "myussEasyPayEnabled": true,
                  "myussBillingEnabled": true,
                  "myussOrdersEnabled": true,
                  "myussCasesEnabled": true,
                  "myussProjectsEnabled": true,
                  "poRequired": false,
                  "accountPaymentStatus": null
              },
              {
                  "contactId": "0038I00000i3rROQAY",
                  "firstName": "Mayur1",
                  "lastName": "Mali1",
                  "phone": "09764521706",
                  "email": "mayur.mali@zingowrks.in",
                  "accountId": "0018I00000hZ635QAC",
                  "accountName": "Frontier Logistics, LP",
                  "accountNumber": "ACT-01640651",
                  "autoPayRequirement": "N/A",
                  "businessType": "Other Business",
                  "customerType": "Business",
                  "emailForCC": [
                      "test6@gmail.com",
                      "test3@gmail.com",
                      "test6@gmail.com",
                      "test3@gmail.com"
                  ],
                  "myussEnabled": true,
                  "myussQuotesEnabled": true,
                  "myussHomeEnabled": true,
                  "myussEasyPayEnabled": true,
                  "myussBillingEnabled": true,
                  "myussOrdersEnabled": true,
                  "myussCasesEnabled": false,
                  "myussProjectsEnabled": false,
                  "poRequired": true,
                  "accountPaymentStatus": null
              },
              {
                  "contactId": "003VA000005rsyfYAA",
                  "firstName": "Gaurav250",
                  "lastName": "Narvekar",
                  "phone": "9898765645",
                  "email": "gaurav.narvekar+250@zingworks.in",
                  "accountId": "001VA000003xee4YAA",
                  "accountName": "MyUSS Test Gaurav250",
                  "accountNumber": "ACT-01646384",
                  "autoPayRequirement": "Yes - USS Required",
                  "businessType": "Entertainment",
                  "customerType": "Business",
                  "emailForCC": [],
                  "myussEnabled": true,
                  "myussQuotesEnabled": false,
                  "myussHomeEnabled": false,
                  "myussEasyPayEnabled": false,
                  "myussBillingEnabled": true,
                  "myussOrdersEnabled": false,
                  "myussCasesEnabled": false,
                  "myussProjectsEnabled": false,
                  "poRequired": false,
                  "accountPaymentStatus": null
              }
          ],
          "myussEnabled": true,
          "myussQuotesEnabled": true,
          "myussHomeEnabled": true,
          "myussEasyPayEnabled": true,
          "myussBillingEnabled": true,
          "myussOrdersEnabled": true,
          "myussCasesEnabled": true,
          "myussProjectsEnabled": true,
          "poRequired": false,
          "accountPaymentStatus": null,
          "emailVerified": true
      }
    }
    
    mockSfdcUssPortalUserService.fetchProfile.mockResolvedValue(SFDCfetchProfileResponse);
    mockAuth0Service.isEmailVerified.mockResolvedValue(isEmailVerifiedResponse);
    mockUserService.fetchProfile.mockResolvedValue(userServiceFetchProfile);
    mockUserService.fetchUsersDetails.mockResolvedValue(userFetchUsersDetails);
    const result = await controller.fetchUsersDetails(request, {Id: "auth0|660664ce154c2ff59d8699be"});
    expect(result).toBeDefined();
    expect(result).toEqual(meResponse);
  });
  //fetch user details fail
  it('should fetch user details', async () => {
    const fetchAccountDetailsResponse  = {
        status: 1031, message: 'User not found',data: {},success: false
    }
    mockSfdcUssPortalUserService.fetchUssPortalUser.mockResolvedValue({});
    mockAuth0Service.isEmailVerified.mockResolvedValue(false);
    mockUserService.fetchProfile = jest.fn().mockResolvedValue(fetchAccountDetailsResponse);
    mockUserService.fetchUsersDetails.mockResolvedValue(fetchAccountDetailsResponse);
    const result = await controller.fetchUsersDetails(request, {Id: "auth0|660664ce154c2ff59d8699be"});
    expect(result).toBeDefined();
    expect(result).toEqual({
        success: false,
        message: 'User not found',
        status: 1031,
        data: {},
        });
  });  
  //request email verification success
  it('should request email verification', async () => {
    const authResponse = { status: 201 , statusText: 'Created', data: {}}
    const requestEmailVerificationResponse = {
      success: true,
      message: "Success",
      status: 1000,
      data: {
      },
    }
    mockAuth0Service.requestEmailVerification.mockResolvedValue(authResponse);
    mockUserService.requestEmailVerification.mockResolvedValue(requestEmailVerificationResponse);
    const result = await controller.requestEmailVerification(request);
    expect(result).toBeDefined();
    expect(result).toEqual(requestEmailVerificationResponse);
  });
  //request email verification fail
  it('should request email verification', async () => {
    const authResponse = { status: 400 , statusText: 'Bad Request', data: {}}
    const requestEmailVerificationResponse = {
      success: false,
      message: "Fail",
      status: 1032,
      data: {
      },
    }
    mockAuth0Service.requestEmailVerification.mockResolvedValue(authResponse);
    mockUserService.requestEmailVerification.mockResolvedValue(requestEmailVerificationResponse);
    const result = await controller.requestEmailVerification(request);
    expect(result).toBeDefined();
    expect(result).toEqual(requestEmailVerificationResponse);
  });
  //change password success
  //jest mock this.http.post - error
  // it('should change password', async () => {
    
  //   const changePasswordResponse = {
  //     success: true,
  //     message: "Success",
  //     status: 1000,
  //     data: {
  //     },
  //   }
  //   mockAuth0Service.changePassword.mockResolvedValue(changePasswordResponse);
  //   mockUserService.hasAccessToAccount.mockResolvedValue(true);
  //   mockUserService.changePassword.mockResolvedValue(changePasswordResponse);
  //   const result = await controller.changePassword(request,{email : 'arati.gadgil@zingworks.in'});
  //   expect(result).toBeDefined();
  //   expect(result).toEqual(changePasswordResponse);
  // });

  //clear cache success
  it('should clear cache', async () => {
    const clearCacheResponse = {
      success: true,
      message: "Success",
      status: 1000,
      data: {
      },
    }
    mockUserService.clearCache.mockResolvedValue(clearCacheResponse);
    const result = await controller.clearCache();
    expect(result).toBeDefined();
    expect(result).toEqual(clearCacheResponse);
  });
  //clear cache fail
  it('should clear cache', async () => {
    const clearCacheResponse = {
      success: false,
      message: "Fail",
      status: 1033,
      data: {
      },
    }
    mockUserService.clearCache.mockResolvedValue(clearCacheResponse);
    const result = await controller.clearCache();
    expect(result).toBeDefined();
    expect(result).toEqual(clearCacheResponse);
  });
  //get cache success
  it('should get cache', async () => {
    const getCacheResponse = {
      success: true,
      message: "Success",
      status: 1000,
      data: {
      },
    }
    mockUserService.getCacheKeys.mockResolvedValue(getCacheResponse);
    const result = await controller.getCache();
    expect(result).toBeDefined();
    expect(result).toEqual(getCacheResponse);
  });
  //get cache fail
  it('should get cache', async () => {
    const getCacheResponse = {
      success: false,
      message: "Fail",
      status: 1034,
      data: {
      },
    }
    mockUserService.getCacheKeys.mockResolvedValue(getCacheResponse);
    const result = await controller.getCache();
    expect(result).toBeDefined();
    expect(result).toEqual(getCacheResponse);
  });
});

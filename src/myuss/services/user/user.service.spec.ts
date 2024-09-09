
import { SfdcUssPortalUserService } from '../../../backend/sfdc/services/sfdc-uss-portal-user/sfdc-uss-portal-user.service';
import { SfdcQuoteService } from '../../../backend/sfdc/services/sfdc-quote/sfdc-quote.service';
import { SfdcContractService } from '../../../backend/sfdc/services/sfdc-contract/sfdc-contract.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { SignupReqDTO } from '../../../myuss/controllers/user/dto/signup-req.dto';
import { UpdateProfileReqDTO } from '../../../myuss/controllers/user/dto/update-profile-req.dto';
import { Auth0UserService } from '../../../backend/auth0/services/auth0-user/auth0-user.service';
import { CacheService } from '../../../core/cache/cache.service';
import { TrackUserActionService } from '../../../core/track-user-action/track-user-action-service';
import { FirestoreService } from '../../../backend/google/firestore/firestore.service';
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';

describe('UserService', () => {
    let service: UserService;
    
    const SfdcQuoteServiceMock = {
        fetchQuoteIds: jest.fn()
    }
    const SfdcUssPortalUserServiceMock = {
        fetchUssPortalUser: jest.fn(),
        createUser: jest.fn(),
        updateUser: jest.fn()
    }
    const SfdcContractServiceMock = {
        fetchContractIds: jest.fn()
    }
    const LoggerServiceMock = {
        log: jest.fn(),
        error: jest.fn()
    }
    const Auth0UserServiceMock = {
        isEmailVerified: jest.fn(),
        requestEmailVerification: jest.fn(),
    }
    const CacheServiceMock = {
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
    const TrackUserActionServiceMock = {
        setPortalActions: jest.fn()
    }
    const FirestoreServiceMock = {
        fetchAccountDetails: jest.fn(),
        fetchUserDetails: jest.fn(),
        updateUserDetails: jest.fn(),
        getCollectionDocsByFieldName: jest.fn()
    }


    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
          providers: [UserService,
            { provide: SfdcQuoteService, useValue: SfdcQuoteServiceMock },
            { provide: SfdcUssPortalUserService, useValue: SfdcUssPortalUserServiceMock },
            { provide: SfdcContractService, useValue: SfdcContractServiceMock },
            { provide: LoggerService, useValue: LoggerServiceMock },
            { provide: Auth0UserService, useValue: Auth0UserServiceMock },
            { provide: CacheService, useValue: CacheServiceMock },
            { provide: TrackUserActionService, useValue: TrackUserActionServiceMock },
            { provide: FirestoreService, useValue: FirestoreServiceMock}
            ]
    
        }).compile();
    
        service = module.get<UserService>(UserService);
    });
    
    it('should be defined', () => {
    expect(service).toBeDefined();
    });

    //fetch user details success
    it('should fetch user details', async () => {
    const response = {
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
    }
    const fetchAccountDetailsResponse  = {
        "success": true,
        "message": "Success",
        "status": 1000,
        "data": {
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
                    "accountPaymentStatus": null
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
            "accountPaymentStatus": null
        }
    }
    SfdcUssPortalUserServiceMock.fetchUssPortalUser.mockResolvedValue(response);
    Auth0UserServiceMock.isEmailVerified.mockResolvedValue(true);
    UserService.prototype.fetchProfile = jest.fn().mockResolvedValue(fetchAccountDetailsResponse);
    const result = await service.fetchUsersDetails("auth0|660664ce154c2ff59d8699be");
    expect(result).toBeDefined();
    expect(result).toEqual(fetchAccountDetailsResponse);
    });
    //fetch user details fail
    it('should fetch user details', async () => {
    
    const fetchAccountDetailsResponse  = {
        status: 1031, message: 'User not found',data: {}
    }
    SfdcUssPortalUserServiceMock.fetchUssPortalUser.mockResolvedValue({});
    Auth0UserServiceMock.isEmailVerified.mockResolvedValue(false);
    UserService.prototype.fetchProfile = jest.fn().mockResolvedValue(fetchAccountDetailsResponse);
    const result = await service.fetchUsersDetails("auth0|660664ce154c2ff59d8699b");
    expect(result).toBeDefined();
    expect(result).toEqual({
        success: true,
        message: 'User not found',
        status: 1031,
        data: {},
        });
    });

    //create user success
    it('should create user', async () => {
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
            "success": true,
            "message": "Success",
            "status": 1000,
            "data": {}
            }  
        const createUssPortalUserResponse = { message: 'Success', success: true , errors: [] , id: ''}
        SfdcUssPortalUserServiceMock.createUser.mockResolvedValue(createUssPortalUserResponse);
        const result = await service.createUser(signupReqDTO);
        expect(result).toBeDefined();
        expect(result).toEqual(response);
    })
    //create user fail
    it('should create user', async () => {
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
        SfdcUssPortalUserServiceMock.createUser.mockResolvedValue(createUssPortalUserResponse);
        const result = await service.createUser(signupReqDTO);
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
        SfdcUssPortalUserServiceMock.updateUser.mockResolvedValue(updateUssPortalUserResponse);
        const result = await service.updateUser('auth0|660664ce154c2ff59d8699be',updateProfileReqDTO);
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
        SfdcUssPortalUserServiceMock.updateUser.mockResolvedValue(updateUssPortalUserResponse);
        const result = await service.updateUser('auth0|660664ce154c2ff59d8699be',updateProfileReqDTO);
        expect(result).toBeDefined();
        expect(result).toEqual(response);
    })

    });

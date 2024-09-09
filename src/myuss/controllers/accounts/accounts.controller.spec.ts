import { Test, TestingModule } from '@nestjs/testing';
import { AccountsController } from './accounts.controller';
import { UserService } from '../../services/user/user.service';
jest.mock('../../../core/cache/cache.service');
import { ContractService } from '../../../myuss/services/contract/contract.service';
import { AccountsService } from '../../services/accounts/accounts.service';
import { AddressService } from '../../../myuss/services/address/address.service';
import { CacheService } from '../../../core/cache/cache.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { QuoteService } from '../../../myuss/services/quote/quote.service';
import { query } from 'express';

describe('AccountsController', () => {
  let controller: AccountsController;
  let mockAccountsService = {
    getAccount: jest.fn(),
    getContacts: jest.fn(),
    fetchDrafts: jest.fn(),
    fetchAccountNumber: jest.fn(),
  };
  let mockAddressService = {
    getAddresses: jest.fn(),
  };
  let mockUserService = {
    getUser: jest.fn(),
    fetchUsersDetails: jest.fn(),
  };
  let mockContractService = {
    getContractDetails: jest.fn(),
    fetchContracts: jest.fn(),
  };
  let mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
  };
  mockCacheService.get.mockReturnValue(null);
  let mockLoggerService ={
    info: jest.fn(),
    error: jest.fn(),
  }
  let mockQuoteService = {
    updateAccoutwiseIdsToFirestore: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountsController],
      providers: [
        { provide: AccountsService, useValue: mockAccountsService },
        { provide: AddressService, useValue: mockAddressService },
        { provide: UserService, useValue: mockUserService },
        { provide: ContractService, useValue: mockContractService },
        { provide: CacheService, useValue: mockCacheService },
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: QuoteService, useValue: mockQuoteService },
        { provide: 'AXIOS_INSTANCE_TOKEN', useValue: {} },
      ],
    }).compile();

    controller = module.get<AccountsController>(AccountsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
  //fetch drafts success
  it('should return drafts', async () => {
    const req = {
      query :{
        projectId: ''
      }
    }
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
    const result = {
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
    mockAccountsService.fetchDrafts.mockResolvedValue(serviceResponse);
    const status ='';
    const response = await controller.fetchAllDrafts(req,'001VA000007nwekYAA',status);
    expect(response).toEqual(result);
  });
  //fetch drafts failure
  it('should return error', async () => {
    
    const serviceResponse = { status: 1041, message: 'Error while fetching quotes',data : [] };
    const result = { status: 1041, message: 'Error while fetching quotes',data : [] };
    mockAccountsService.fetchDrafts.mockResolvedValue(serviceResponse);
    const status ='';
    const response = await controller.fetchAllDrafts({
      query :{
        projectId: ''
      },
    },'001VA000007nwekYAA',status);
    expect(response).toEqual(result);
  });
  //getContracts success
  it('should return contracts', async () => {
    const mockReq = {
      user: { sub: 'user123' },
      params: { accountId: 'account123' },
    }
    const serviceResponse = {
      "success": true,
      "status": 1000,
      "message": "Success",
      "data": {
          "contracts": [
              {
                  "quoteId": "a6OVA0000005Kir2AE",
                  "contractId": "800VA000005FpFSYA0",
                  "name": "O-520555",
                  "lastModifiedDate": "2024-07-19T05:12:08.000+0000",
                  "startDate": "2024-07-18",
                  "endDate": "2049-12-31",
                  "shippingAddress": "1350 Northwest 14th Street, Miami, FL, 33125",
                  "zipcode": "33125",
                  "billAddress": {
                      "lat": 25.78727,
                      "lng": -80.21777
                  },
                  "shippingAddressLat": 25.78727,
                  "shippingAddressLng": -80.21777,
                  "paymentMethodId": "pm_1Pdtq7KX1Bgoxru0qRuSULoC",
                  "recurringSubtotal": 1447.76,
                  "nextInvoiceDate": "08/15/2024",
                  "isAutoPay": true,
                  "projectDetails": null,
                  "easyPayDetails": {
                      "cardBrand": "visa",
                      "cardNo": "4242",
                      "cardExpMonth": 1,
                      "cardExpYear": 2026,
                      "country": "IN",
                      "displayBrand": "visa",
                      "expired": false
                  },
                  "easyPayMode": "card",
                  "status": "Activated"
              }
          ]
      }
    }
    const result = {
      "success": true,
      "status": 1000,
      "message": "Success",
      "data": {
          "contracts": [
              {
                  "quoteId": "a6OVA0000005Kir2AE",
                  "contractId": "800VA000005FpFSYA0",
                  "name": "O-520555",
                  "lastModifiedDate": "2024-07-19T05:12:08.000+0000",
                  "startDate": "2024-07-18",
                  "endDate": "2049-12-31",
                  "shippingAddress": "1350 Northwest 14th Street, Miami, FL, 33125",
                  "zipcode": "33125",
                  "billAddress": {
                      "lat": 25.78727,
                      "lng": -80.21777
                  },
                  "shippingAddressLat": 25.78727,
                  "shippingAddressLng": -80.21777,
                  "paymentMethodId": "pm_1Pdtq7KX1Bgoxru0qRuSULoC",
                  "recurringSubtotal": 1447.76,
                  "nextInvoiceDate": "08/15/2024",
                  "isAutoPay": true,
                  "projectDetails": null,
                  "easyPayDetails": {
                      "cardBrand": "visa",
                      "cardNo": "4242",
                      "cardExpMonth": 1,
                      "cardExpYear": 2026,
                      "country": "IN",
                      "displayBrand": "visa",
                      "expired": false
                  },
                  "easyPayMode": "card",
                  "status": "Activated"
              }
          ]
      }
    }
    mockContractService.fetchContracts.mockResolvedValue(serviceResponse);
    mockAccountsService.getAccount.mockResolvedValue('account123');
    mockUserService.fetchUsersDetails.mockResolvedValue({});
    const response = await controller.getContracts(mockReq,{status: 'Activated,Suspended,Ordered',projectId: ''});
    expect(response).toEqual(result);
  });
  //getContracts failure
  it('should return error', async () => {
    const mockReq = {
      user: { sub: 'user123' },
      params: { accountId: 'account123' },
    }
    const serviceResponse = { status: 1041, message: 'Error while fetching contracts',data : [] };
    const result = { status: 1041, message: 'Error while fetching contracts',data : [] };
    mockContractService.fetchContracts.mockResolvedValue(serviceResponse);
    mockAccountsService.getAccount.mockResolvedValue('account123');
    mockUserService.fetchUsersDetails.mockResolvedValue({});
    const response = await controller.getContracts(mockReq,{status: 'Activated,Suspended,Ordered',projectId: ''});
    expect(response).toEqual(result);
  });
  //get contract details success
  it('should return contract details success', async () => {
    const mockRequest = {
      user: { sub: 'user123' },
      params: { accountId: 'account123' },
    };
    const mockContractDetails = {
      "success": true,
      "status": 1000,
      "message": "Success",
      "data": {
          "contractId": "800VA000005FpFSYA0",
          "status": "Activated",
          "quoteName": "O-520555",
          "quoteId": "a6OVA0000005Kir2AE",
          "startDate": "2024-07-18",
          "endDate": "2049-12-31",
          "contractDocumnetId": "015VA000000IZAbYAO",
          "contractDocumentName": "Rohini Order 07 18 24",
          "quoteSummary": [
              {
                  "bundleId": "a6aVA0000009BkDYAU",
                  "bundleOptionalId": "01t3m00000PPH5MAAX",
                  "bundleQty": 4,
                  "bundleName": "Restroom Bundle",
                  "asset": [
                      {
                          "assetId": "a6aVA0000009BkEYAU",
                          "assetOptionalId": "01t3m00000NTiw6AAD",
                          "assetQty": 4,
                          "assetName": "Standard Restroom"
                      }
                  ],
                  "service": [
                      {
                          "serviceId": "a6aVA0000009BkFYAU",
                          "serviceOptionalId": "01t3m00000POgudAAD",
                          "serviceQty": 4,
                          "serviceName": "1 Service 2 Days per Week",
                          "numberOfServices": 2,
                          "servicePrice": 240
                      }
                  ],
                  "ancillaryServices": [
                      {
                          "ancillaryServiceId": "a6aVA0000009BkGYAU",
                          "ancillaryServiceOptionalId": "01t3m00000POgw6AAD",
                          "ancillaryServiceQty": 4,
                          "ancillaryServiceName": "Hand Sanitizer Refill"
                      }
                  ],
                  "pAndD": [
                      {
                          "aAndDId": "a6aVA0000009BkHYAU",
                          "aAndDOptionalId": "01t3m00000POgxIAAT",
                          "aAndDQty": 4,
                          "aAndDName": "Delivery Restroom - Per Unit Charge"
                      },
                      {
                          "aAndDId": "a6aVA0000009BkIYAU",
                          "aAndDOptionalId": "01t3m00000POgxNAAT",
                          "aAndDQty": 4,
                          "aAndDName": "Pickup Restroom - Per Unit Charge"
                      }
                  ]
              }
          ],
          "siteDetails": {
              "firstName": "Rohini",
              "lastName": "Nagtilak",
              "email": "rohini.nagtilak@zingworks.in",
              "phone": "+919898989898",
              "address": "1350 Northwest 14th Street, Miami, FL, 33125",
              "state": "FL",
              "street": "1350 Northwest 14th Street",
              "zipcode": "33125",
              "city": "Miami",
              "latitude": 25.78727,
              "longitude": -80.21777,
              "placementNotes": {}
          },
          "billingDetails": {
              "firstName": "Rohini Nagtilak",
              "lastName": "",
              "secondaryBillingContact": {},
              "phone": "",
              "cardDetails": {
                  "cardBrand": "visa",
                  "cardNo": "4242",
                  "cardExpMonth": 1,
                  "cardExpYear": 2026,
                  "country": "IN",
                  "displayBrand": "visa",
                  "expired": false
              },
              "bankDetails": {},
              "manualPaymentDetails": {
                  "message": "You and added email address(es) will receive an invoice for each billing period which will be responsible for payment by check or credit card through the payment portal."
              }
          },
          "workOrder": [
              {
                  "type": "Delivery",
                  "status": "Completed",
                  "startDate": "2024-07-24T04:01:01.000+0000",
                  "endDate": "2024-07-25T03:59:59.000+0000",
                  "id": "0WOVA000002KK1R4AW",
                  "productInfo": "Std Rest : 4, Hand Sani Refill : 4",
                  "originalStatus": "New"
              },
              {
                  "type": "Pickup",
                  "status": "New",
                  "startDate": "2049-12-31T05:01:01.000+0000",
                  "endDate": "2050-01-01T04:59:59.000+0000",
                  "id": "0WOVA000002KK1S4AW",
                  "productInfo": "Std Rest : 4, Hand Sani Refill : 4",
                  "originalStatus": "New"
              }
          ],
          "assetLocations": [
              {
                  "id": "aFHVA0000000pYn4AI",
                  "name": "AL-336005",
                  "startDate": "2024-07-18T00:00:00.000Z",
                  "endDate": "2049-12-31T00:00:00.000Z",
                  "assetId": "01t3m00000NTiw6AAD",
                  "assetName": "Standard Restroom",
                  "serviceName": "1 Service 2 Days per Week",
                  "serviceId": "01t3m00000POgudAAD",
                  "subscriptionProductId": "01t3m00000NTiw6AAD",
                  "serviceProductId": "01t3m00000POgudAAD",
                  "quantity": 1,
                  "parentAddress": "1350 Northwest 14th Street",
                  "siteAddress": "1350 Northwest 14th Street - 1350 Northwest 14th Stree - Miami - FL",
                  "placementNote": "test",
                  "jobsiteId": "a8xVA000000UpptYAC",
                  "unitNumber": "",
                  "numberOfServices": 2,
                  "servicePrice": 240,
                  "bundleId": "a6aVA0000009BkDYAU",
                  "bundleName": "Restroom Bundle",
                  "ancillaryServiceList": [
                      {
                          "ancillaryServiceId": "a6aVA0000009BkGYAU",
                          "ancillaryServiceOptionalId": "01t3m00000POgw6AAD",
                          "ancillaryServiceQty": 4,
                          "ancillaryServiceName": "Hand Sanitizer Refill"
                      }
                  ],
                  "serviceSubscriptionId": "a6aVA0000009BkFYAU"
              },
              {
                  "id": "aFHVA0000000pYo4AI",
                  "name": "AL-336006",
                  "startDate": "2024-07-18T00:00:00.000Z",
                  "endDate": "2049-12-31T00:00:00.000Z",
                  "assetId": "01t3m00000NTiw6AAD",
                  "assetName": "Standard Restroom",
                  "serviceName": "1 Service 2 Days per Week",
                  "serviceId": "01t3m00000POgudAAD",
                  "subscriptionProductId": "01t3m00000NTiw6AAD",
                  "serviceProductId": "01t3m00000POgudAAD",
                  "quantity": 1,
                  "parentAddress": "1350 Northwest 14th Street",
                  "siteAddress": "1350 Northwest 14th Street - 1350 Northwest 14th Stree - Miami - FL",
                  "placementNote": "test",
                  "jobsiteId": "a8xVA000000UpptYAC",
                  "unitNumber": "",
                  "numberOfServices": 2,
                  "servicePrice": 240
              },
              {
                  "id": "aFHVA0000000pYp4AI",
                  "name": "AL-336007",
                  "startDate": "2024-07-18T00:00:00.000Z",
                  "endDate": "2049-12-31T00:00:00.000Z",
                  "assetId": "01t3m00000NTiw6AAD",
                  "assetName": "Standard Restroom",
                  "serviceName": "1 Service 2 Days per Week",
                  "serviceId": "01t3m00000POgudAAD",
                  "subscriptionProductId": "01t3m00000NTiw6AAD",
                  "serviceProductId": "01t3m00000POgudAAD",
                  "quantity": 1,
                  "parentAddress": "1350 Northwest 14th Street",
                  "siteAddress": "1350 Northwest 14th Street - 1350 Northwest 14th Stree - Miami - FL",
                  "placementNote": "test",
                  "jobsiteId": "a8xVA000000UpptYAC",
                  "unitNumber": "",
                  "numberOfServices": 2,
                  "servicePrice": 240
              },
              {
                  "id": "aFHVA0000000pYq4AI",
                  "name": "AL-336008",
                  "startDate": "2024-07-18T00:00:00.000Z",
                  "endDate": "2049-12-31T00:00:00.000Z",
                  "assetId": "01t3m00000NTiw6AAD",
                  "assetName": "Standard Restroom",
                  "serviceName": "1 Service 2 Days per Week",
                  "serviceId": "01t3m00000POgudAAD",
                  "subscriptionProductId": "01t3m00000NTiw6AAD",
                  "serviceProductId": "01t3m00000POgudAAD",
                  "quantity": 1,
                  "parentAddress": "1350 Northwest 14th Street",
                  "siteAddress": "1350 Northwest 14th Street - 1350 Northwest 14th Stree - Miami - FL",
                  "placementNote": "test",
                  "jobsiteId": "a8xVA000000UpptYAC",
                  "unitNumber": "",
                  "numberOfServices": 2,
                  "servicePrice": 240
              }
          ],
          "productDetails": [
              {
                  "addressId": "a8xVA000000UpptYAC",
                  "placementNotes": "test",
                  "siteName": "1350 Northwest 14th Street - 1350 Northwest 14th Stree - Miami - FL",
                  "bundles": [
                      {
                          "id": "aFHVA0000000pYn4AI",
                          "name": "AL-336005",
                          "startDate": "2024-07-18T00:00:00.000Z",
                          "endDate": "2049-12-31T00:00:00.000Z",
                          "assetId": "01t3m00000NTiw6AAD",
                          "assetName": "Standard Restroom",
                          "serviceName": "1 Service 2 Days per Week",
                          "serviceId": "01t3m00000POgudAAD",
                          "subscriptionProductId": "01t3m00000NTiw6AAD",
                          "serviceProductId": "01t3m00000POgudAAD",
                          "quantity": 4,
                          "parentAddress": "1350 Northwest 14th Street",
                          "siteAddress": "1350 Northwest 14th Street - 1350 Northwest 14th Stree - Miami - FL",
                          "placementNote": "test",
                          "jobsiteId": "a8xVA000000UpptYAC",
                          "unitNumber": "",
                          "numberOfServices": 2,
                          "servicePrice": 240,
                          "bundleId": "a6aVA0000009BkDYAU",
                          "bundleName": "Restroom Bundle",
                          "ancillaryServiceList": [
                              {
                                  "ancillaryServiceId": "a6aVA0000009BkGYAU",
                                  "ancillaryServiceOptionalId": "01t3m00000POgw6AAD",
                                  "ancillaryServiceQty": 4,
                                  "ancillaryServiceName": "Hand Sanitizer Refill"
                              }
                          ],
                          "serviceSubscriptionId": "a6aVA0000009BkFYAU"
                      }
                  ],
                  "isEdited": false
              }
          ],
          "projectDetails": null
      }
    }
    const mockParams = { contractId: '800VA000005FpFSYA0', projectId: '' , accountId :'001VA000007nwekYAA'};
    const mockUserData = {};
   
    mockUserService.fetchUsersDetails.mockResolvedValue(mockUserData);
    mockContractService.getContractDetails.mockResolvedValue(mockContractDetails);
    const result = await controller.getContractDetails(mockRequest, mockParams);

    expect(result).toBe(mockContractDetails);
    expect(result.data.contractId).toBe('800VA000005FpFSYA0');
    
  });
  //get contract details failure
  it('should return contract details success', async () => {
    const mockRequest = {
      user: { sub: 'user123' },
      params: { accountId: 'account123' },
    };
    const mockContractDetails = {
      success: false,
      status: 1008,
      message: "An error occurred, please contact 1-888-320-1861-TOILETS.",
      data: {},
    };
    const mockParams = { contractId: '800VA000005FpFSYA0', projectId: '' , accountId :'001VA000007nwekYAA'};
    const mockUserData = {};
   
    mockUserService.fetchUsersDetails.mockResolvedValue(mockUserData);
    mockContractService.getContractDetails.mockResolvedValue(mockContractDetails);
    const result = await controller.getContractDetails(mockRequest, mockParams);

    expect(result).toBe(mockContractDetails);
    expect(result.status).toBe(1008);
  });

});

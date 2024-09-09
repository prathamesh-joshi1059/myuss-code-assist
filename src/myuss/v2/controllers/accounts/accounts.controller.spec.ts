import { Test, TestingModule } from '@nestjs/testing';
import { AccountsControllerV2 } from './accounts.controller';
jest.mock('../../../../core/cache/cache.service');
import { AccountsServiceV2 } from '../../services/accounts/accounts.service';
import { CacheService } from '../../../../core/cache/cache.service';
import { LoggerService } from '../../../../core/logger/logger.service';

describe('AccountsControllerV2', () => {
  let controller: AccountsControllerV2;
  let mockAccountsServiceV2 = {
    fetchDraftsV2: jest.fn(),
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountsControllerV2],
      providers: [
        { provide: AccountsServiceV2, useValue: mockAccountsServiceV2 },
        { provide: CacheService, useValue: mockCacheService },
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: 'AXIOS_INSTANCE_TOKEN', useValue: {} },
      ],
    }).compile();

    controller = module.get<AccountsControllerV2>(AccountsControllerV2);
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
    const status = ''
    mockAccountsServiceV2.fetchDraftsV2.mockResolvedValue(serviceResponse);
    const response = await controller.fetchAllDraftsV2(req,'001VA000007nwekYAA',status);
    expect(response).toEqual(result);
  });
  //fetch drafts failure
  it('should return error', async () => {
    
    const serviceResponse = { status: 1041, message: 'Error while fetching quotes',data : [] };
    const result = { status: 1041, message: 'Error while fetching quotes',data : [] };
    mockAccountsServiceV2.fetchDraftsV2.mockResolvedValue(serviceResponse);
    const status = ''
    const response = await controller.fetchAllDraftsV2({
      query :{
        projectId: ''
      },
    },'001VA000007nwekYAA',status);
    expect(response).toEqual(result);
  });

});

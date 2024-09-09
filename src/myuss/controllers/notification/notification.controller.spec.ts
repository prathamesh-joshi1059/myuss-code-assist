import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from './notification.controller';
import { NotificationService } from '../../../myuss/services/notification/notification.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { CacheService } from '../../../core/cache/cache.service';
jest.mock('../../../core/cache/cache.service');
import { SfdcBaseService } from '../../../backend/sfdc/services/sfdc-base/sfdc-base.service';
import { NotificationSuccessResponseTestData } from './notification-test.data';
import { UserService } from '../../../myuss/services/user/user.service';
import { SfdcQuoteService } from '../../../backend/sfdc/services/sfdc-quote/sfdc-quote.service';
import { ContractService } from '../../services/contract/contract.service';
import { SfdcContractService } from '../../../backend/sfdc/services/sfdc-contract/sfdc-contract.service';
import { PaymentMethodsService } from '../../services/payment/payment-methods.service';
import { StripeService } from '../../../backend/stripe/services/stripe/stripe.service';
import { SfdcDocumentService } from '../../../backend/sfdc/services/sfdc-document/sfdc-document.service';
import { SfdcAccountService } from '../../../backend/sfdc/services/sfdc-account/sfdc-account.service';
import { ConfigService } from '@nestjs/config';
import { NotificationReqDTO } from './dto/notification-req.dto';
import { ApiRespDTO } from '../../../common/dto/api-resp.dto';
import { TrackUserActionService } from '../../../core/track-user-action/track-user-action-service';
import { SfdcPortalActionService } from '../../../backend/sfdc/services/sfdc-portal-action/sfdc-portal-action.service';

describe('NotificationController', () => {
  let controller: NotificationController;

  //Mocking all dependent service

  let mockNotificationService = {
    fetchNotification: jest.fn(),
  };

  let mockLoggerService = {
    get: jest.fn(),
    info: jest.fn(),
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  let mockSfdcBaseService = {
    getQuery: jest.fn(),
    get: jest.fn(),
  };

  let mockUserService = {
    fetchUsersDetails: jest.fn(),
    getContacts: jest.fn(),
    getAddresses: jest.fn(),
    hasAccessToAccount: jest.fn(),
    fetchDrafts: jest.fn(),
    fetchArchivedDrafts: jest.fn(),
    fetchSuspendedDrafts: jest.fn(),
  };

  //let mock SfdcContractService 
  let mockSfdcContractService = {
    getContractDetails: jest.fn(),
    getContractByOrderIdAndZIP: jest.fn(),
    getContractDetailsSoql: jest.fn(),
    fetchContracts: jest.fn(),
    getActiveOrderCount: jest.fn(),
    fetchContractIds: jest.fn(),
    fetchNotification: jest.fn(),
  };
  let mockSfdcPortalActionService ={
    fetchContactAndUssPortalUser : jest.fn()
  }

  //Accessing success response from notification data model class
  let successResponse = new NotificationSuccessResponseTestData();

  // This block run before each unit test.
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        NotificationService,
        SfdcQuoteService,
        ContractService,
        CacheService,
        StripeService,
        PaymentMethodsService,
        SfdcDocumentService,
        SfdcAccountService,
        ConfigService,
        TrackUserActionService,
        {
          provide: SfdcContractService,
          useValue: mockSfdcContractService
        },
        {
          provide: SfdcPortalActionService,
          useValue: mockSfdcPortalActionService
        },
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
        {
          provide: SfdcBaseService,
          useValue: mockSfdcBaseService,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },

        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<NotificationController>(NotificationController);
  }),
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });
  // Fetch Notification - Success Scenario
  it('Should return notifications', async () => {
    // Arrange
    const request: NotificationReqDTO = {
      accountId: '0018I00000jJnLkQAK',
    };

    const response : ApiRespDTO<any> ={
      "success": true,
      "status": 1000,
      "message": "Success",
      "data": {
          "notifications": [
              {
                  "quoteNo": "O-514485",
                  "quoteId": "0WO8I000000go9GWAQ",
                  "status": "Delivery",
                  "date": "2023-12-13T05:01:01.000+0000",
                  "siteAddress": {
                      "street": "29 Copley St, Brookline, MA 02446, USA",
                      "city": "Brookline",
                      "state": "MA",
                      "zipcode": "02446",
                      "position": {
                          "lat": 42.34953,
                          "lng": -71.11979
                      }
                  }
              }
          ]
      }
  }
   

    

    const SfdcContractRes = {
      "totalSize": 1,
      "done": true,
      "records": [
        {
          "attributes": {
            "type": "WorkOrder",
            "url": "/services/data/v58.0/sobjects/WorkOrder/0WO8I000000go9GWAQ"
          },
          "Id": "0WO8I000000go9GWAQ",
          "WorkType": {
            "attributes": {
              "type": "WorkType",
              "url": "/services/data/v58.0/sobjects/WorkType/08q8I0000008QGLQA2"
            },
            "Name": "Delivery"
          },
          "Status": "New",
          "Contract__r": {
            "attributes": {
              "type": "Contract",
              "url": "/services/data/v58.0/sobjects/Contract/8008I000000JLDjQAO"
            },
            "Reference_Number__c": "514485"
          },
          "StartDate": "2023-12-13T05:01:01.000+0000",
          "Schedule_Start__c": null,
          "Site_Address__r": {
            "attributes": {
              "type": "USF_Address__c",
              "url": "/services/data/v58.0/sobjects/USF_Address__c/a8x8I000000Cq0tQAC"
            },
            "USF_Street__c": "29 Copley St, Brookline, MA 02446, USA",
            "USF_City__c": "Brookline",
            "USF_State__c": "MA",
            "USF_Zip_Code__c": "02446",
            "Address_Latitude_Longitude__c": {
              "latitude": 42.34953,
              "longitude": -71.11979
            }
          }
        }
      ]
    };

   

    mockNotificationService.fetchNotification.mockResolvedValueOnce(SfdcContractRes);

    // Act
    const result = await controller.fetchNotification( request);
    //Assert

    expect(result.success).toEqual(true);
  });

 

  //Fetch Notification - Fail Scenario

  it('Should return Data not found message', async () => {
    const request: NotificationReqDTO = {
      accountId: '',
    };

    // const userResponse = true;
    const SfdcContractRes = {
      totalSize: 0,
      done: true,
      records: [],
    };

    let notificationRespObj: ApiRespDTO<any> = {
      success: true,
      status: 1000,
      message: 'Data not found',
      data: { notifications: [] },
    };
   
    mockSfdcContractService.fetchNotification.mockResolvedValueOnce(SfdcContractRes);
    mockNotificationService.fetchNotification.mockResolvedValueOnce(notificationRespObj);

    // Act
    const result = await controller.fetchNotification(request);
    //Assert

    expect(result.message).toEqual('Data not found');
  });
});

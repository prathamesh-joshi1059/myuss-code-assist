import { Test, TestingModule } from '@nestjs/testing';
import { CaseService } from './case.service';
import { SfdcCaseService } from '../../../backend/sfdc/services/sfdc-case/sfdc-case.service';
import { SfdcBaseService } from '../../../backend/sfdc/services/sfdc-base/sfdc-base.service';
import { TrackUserActionService } from '../../../core/track-user-action/track-user-action-service';
import { LoggerService } from '../../../core/logger/logger.service';

describe('CaseService', () => {
  let service: CaseService;
  let mockLoggerService = {
    error: jest.fn(),
    log: jest.fn(),
    warn: jest.fn()
  }
  let mocktrackUserActionService = {
    trackUserAction: jest.fn()
  }
  let mockSfdcCaseService ={
    getAccountWiseCaseList: jest.fn(),
    getCaseDetails: jest.fn(),
    getContractWiseCaseList: jest.fn(),
    addCaseComment: jest.fn(),
    uploadFile: jest.fn(),
    getDocumentBodyForCase: jest.fn(),
    uploadFileToSfdc: jest.fn(),
    getAccountWiseMySiteServicesCaseList: jest.fn()
  }
  let mockSfdcBaseService = {
    getCaseDetails: jest.fn(),
    uploadFile: jest.fn(),
    uploadFileToSfdc: jest.fn(),
    getDocumentBodyForCase: jest.fn()
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CaseService,
        {
          provide: SfdcCaseService,
          useValue: mockSfdcCaseService
        },
        {
          provide: SfdcBaseService,
          useValue: mockSfdcBaseService
        },
        {
          provide: TrackUserActionService,
          useValue: mocktrackUserActionService
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService
        }
      ],
    }).compile();
    service = module.get<CaseService>(CaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  //get account wise case list success - closed
  it('should call getAccountWiseCaseList', async () => {
    const accountId = '0018I00000hZ635QAC';
    const fetchCaseDto = {
      startTime: '2022-05-22',
      endTime: '2024-10-03',
      status: 'closed',
      type: '',
      contactId: '0018I00000hZ635QAC'
    };
    const sfdcResponse = [
      {
        attributes: {
          type: "Case",
          url: "/services/data/v58.0/sobjects/Case/500VA000003wgQCYAY",
        },
        Id: "500VA000003wgQCYAY",
        CaseNumber: "04646435",
        CreatedDate: "2024-05-10T11:39:34.000+0000",
        LastModifiedDate: "2024-05-23T07:37:34.000+0000",
        Type: "Amendment",
        Case_Sub_type__c: "Quantity/Frequency Change",
        Status: "Closed",
        Order_Number__c: "519336",
      },
    ]
    const response = {
      "status": 1000,
      "data": {
          "cases": [
              {
                  "id": "500VA000003wgQCYAY",
                  "caseNumber": "04646435",
                  "createdDate": "2024-05-10T11:39:34.000+0000",
                  "lastModifiedDate": "2024-05-23T07:37:34.000+0000",
                  "orderNumber": "O-519336",
                  "status": "Closed",
                  "type": "Quantity/Frequency Change",
                  "contact": null,
                  "caseSubType": "Quantity/Frequency Change",
                  "productInfo": [],
                  "attachments": []
              }
          ]
      },
      "message": "Success",
      "success": true
    }
    mockSfdcCaseService.getAccountWiseCaseList.mockResolvedValue(sfdcResponse);
    const result = await service.getAccountWiseCaseList(accountId,fetchCaseDto,'');
    expect(result).toEqual(response);
  });
  //get account wise case list success - open
  it('should call getAccountWiseCaseList', async () => {
    const accountId = '0018I00000hZ635QAC';
    const fetchCaseDto = {
      startTime: '2022-05-22',
      endTime: '2024-10-03',
      status: 'open',
      type: '',
      contactId: '0018I00000hZ635QAC'
    };
    const response = {
      "status": 1000,
      "data": {
          "cases": [
              {
                  "id": "500VA000004U9ErYAK",
                  "caseNumber": "04646707",
                  "createdDate": "2024-06-11T05:00:32.000+0000",
                  "lastModifiedDate": "2024-06-11T09:39:26.000+0000",
                  "orderNumber": "O-519665",
                  "status": "New",
                  "type": "Quantity/Frequency Change",
                  "contact": null,
                  "caseSubType": "Quantity/Frequency Change",
                  "productInfo": [],
                  "attachments": []
              },
              {
                  "id": "500VA000004TI7JYAW",
                  "caseNumber": "04646693",
                  "createdDate": "2024-06-10T13:03:55.000+0000",
                  "lastModifiedDate": "2024-06-10T13:03:55.000+0000",
                  "orderNumber": "O-519666",
                  "status": "New",
                  "type": "Quantity/Frequency Change",
                  "contact": null,
                  "caseSubType": "Quantity/Frequency Change",
                  "productInfo": [],
                  "attachments": []
              },
              {
                  "id": "500VA000004SzxYYAS",
                  "caseNumber": "04646683",
                  "createdDate": "2024-06-10T11:14:57.000+0000",
                  "lastModifiedDate": "2024-06-10T12:38:10.000+0000",
                  "orderNumber": "O-519666",
                  "status": "New",
                  "type": "Quantity/Frequency Change",
                  "contact": null,
                  "caseSubType": "Quantity/Frequency Change",
                  "productInfo": [],
                  "attachments": []
              },
              {
                  "id": "500VA000004QcDqYAK",
                  "caseNumber": "04646673",
                  "createdDate": "2024-06-07T11:43:25.000+0000",
                  "lastModifiedDate": "2024-06-11T04:59:09.000+0000",
                  "orderNumber": "O-519666",
                  "status": "New",
                  "type": "Quantity/Frequency Change",
                  "contact": null,
                  "caseSubType": "Quantity/Frequency Change",
                  "productInfo": [],
                  "attachments": []
              },
              {
                  "id": "500VA000004QACwYAO",
                  "caseNumber": "04646671",
                  "createdDate": "2024-06-07T08:49:47.000+0000",
                  "lastModifiedDate": "2024-06-07T09:03:03.000+0000",
                  "orderNumber": "O-519666",
                  "status": "New",
                  "type": "Move",
                  "contact": null,
                  "caseSubType": "Move",
                  "productInfo": [],
                  "attachments": []
              },
              {
                  "id": "500VA000004QSmLYAW",
                  "caseNumber": "04646670",
                  "createdDate": "2024-06-07T08:44:14.000+0000",
                  "lastModifiedDate": "2024-06-07T08:44:15.000+0000",
                  "orderNumber": "O-519666",
                  "status": "New",
                  "type": "Quantity/Frequency Change",
                  "contact": null,
                  "caseSubType": "Quantity/Frequency Change",
                  "productInfo": [],
                  "attachments": []
              },
              {
                  "id": "500VA000004QMFWYA4",
                  "caseNumber": "04646665",
                  "createdDate": "2024-06-07T07:22:39.000+0000",
                  "lastModifiedDate": "2024-06-07T07:28:31.000+0000",
                  "orderNumber": "O-519666",
                  "status": "New",
                  "type": "Quantity/Frequency Change",
                  "contact": null,
                  "caseSubType": "Quantity/Frequency Change",
                  "productInfo": [],
                  "attachments": []
              },
              {
                  "id": "500VA000004QOyrYAG",
                  "caseNumber": "04646664",
                  "createdDate": "2024-06-07T07:19:22.000+0000",
                  "lastModifiedDate": "2024-06-11T06:23:21.000+0000",
                  "orderNumber": "O-519666",
                  "status": "New",
                  "type": "Quantity/Frequency Change",
                  "contact": null,
                  "caseSubType": "Quantity/Frequency Change",
                  "productInfo": [],
                  "attachments": []
              },
              {
                  "id": "500VA000004QOE5YAO",
                  "caseNumber": "04646663",
                  "createdDate": "2024-06-07T07:11:23.000+0000",
                  "lastModifiedDate": "2024-06-07T07:11:23.000+0000",
                  "orderNumber": "O-519666",
                  "status": "New",
                  "type": "Quantity/Frequency Change",
                  "contact": null,
                  "caseSubType": "Quantity/Frequency Change",
                  "productInfo": [],
                  "attachments": []
              },
              {
                  "id": "500VA000004QMkBYAW",
                  "caseNumber": "04646662",
                  "createdDate": "2024-06-07T07:06:18.000+0000",
                  "lastModifiedDate": "2024-06-07T07:06:18.000+0000",
                  "orderNumber": "O-519666",
                  "status": "New",
                  "type": "Quantity/Frequency Change",
                  "contact": null,
                  "caseSubType": "Quantity/Frequency Change",
                  "productInfo": [],
                  "attachments": []
              },
              {
                  "id": "500VA000004QJcdYAG",
                  "caseNumber": "04646658",
                  "createdDate": "2024-06-07T06:06:56.000+0000",
                  "lastModifiedDate": "2024-06-07T06:08:06.000+0000",
                  "orderNumber": "O-519666",
                  "status": "New",
                  "type": "Quantity/Frequency Change",
                  "contact": null,
                  "caseSubType": "Quantity/Frequency Change",
                  "productInfo": [],
                  "attachments": []
              },
              {
                  "id": "500VA000004PUa6YAG",
                  "caseNumber": "04646649",
                  "createdDate": "2024-06-06T13:13:53.000+0000",
                  "lastModifiedDate": "2024-06-07T05:49:32.000+0000",
                  "orderNumber": "O-519666",
                  "status": "New",
                  "type": "Quantity/Frequency Change",
                  "contact": null,
                  "caseSubType": "Quantity/Frequency Change",
                  "productInfo": [],
                  "attachments": []
              },
              {
                  "id": "500VA000004PNf8YAG",
                  "caseNumber": "04646641",
                  "createdDate": "2024-06-06T11:08:34.000+0000",
                  "lastModifiedDate": "2024-06-06T11:08:35.000+0000",
                  "orderNumber": "O-519665",
                  "status": "New",
                  "type": "Quantity/Frequency Change",
                  "contact": null,
                  "caseSubType": "Quantity/Frequency Change",
                  "productInfo": [],
                  "attachments": []
              },
              {
                  "id": "500VA000004PMRHYA4",
                  "caseNumber": "04646639",
                  "createdDate": "2024-06-06T10:55:34.000+0000",
                  "lastModifiedDate": "2024-06-06T11:08:33.000+0000",
                  "orderNumber": "O-519665",
                  "status": "New",
                  "type": "Quantity/Frequency Change",
                  "contact": null,
                  "caseSubType": "Quantity/Frequency Change",
                  "productInfo": [],
                  "attachments": []
              },
              {
                  "id": "500VA000004PNiJYAW",
                  "caseNumber": "04646637",
                  "createdDate": "2024-06-06T10:48:10.000+0000",
                  "lastModifiedDate": "2024-06-06T10:48:11.000+0000",
                  "orderNumber": "O-519665",
                  "status": "New",
                  "type": "Move",
                  "contact": null,
                  "caseSubType": "Move",
                  "productInfo": [],
                  "attachments": []
              },
              {
                  "id": "500VA000004PPiTYAW",
                  "caseNumber": "04646636",
                  "createdDate": "2024-06-06T10:43:21.000+0000",
                  "lastModifiedDate": "2024-06-06T10:43:22.000+0000",
                  "orderNumber": "O-519665",
                  "status": "New",
                  "type": "Quantity/Frequency Change",
                  "contact": null,
                  "caseSubType": "Quantity/Frequency Change",
                  "productInfo": [],
                  "attachments": []
              },
              {
                  "id": "500VA000004POEYYA4",
                  "caseNumber": "04646635",
                  "createdDate": "2024-06-06T10:31:30.000+0000",
                  "lastModifiedDate": "2024-06-06T10:31:31.000+0000",
                  "orderNumber": "O-519665",
                  "status": "New",
                  "type": "Quantity/Frequency Change",
                  "contact": null,
                  "caseSubType": "Quantity/Frequency Change",
                  "productInfo": [],
                  "attachments": []
              },
              {
                  "id": "500VA000004PLrlYAG",
                  "caseNumber": "04646628",
                  "createdDate": "2024-06-06T09:32:16.000+0000",
                  "lastModifiedDate": "2024-06-06T10:19:17.000+0000",
                  "orderNumber": "O-519494",
                  "status": "New",
                  "type": "Quantity/Frequency Change",
                  "contact": null,
                  "caseSubType": "Quantity/Frequency Change",
                  "productInfo": [],
                  "attachments": []
              },
              {
                  "id": "500VA000004PJd3YAG",
                  "caseNumber": "04646624",
                  "createdDate": "2024-06-06T09:05:39.000+0000",
                  "lastModifiedDate": "2024-06-06T09:05:52.000+0000",
                  "orderNumber": "O-519494",
                  "status": "New",
                  "type": "Move",
                  "contact": null,
                  "caseSubType": "Move",
                  "productInfo": [],
                  "attachments": []
              },
              {
                  "id": "500VA000004PIaXYAW",
                  "caseNumber": "04646622",
                  "createdDate": "2024-06-06T08:51:33.000+0000",
                  "lastModifiedDate": "2024-06-06T08:51:33.000+0000",
                  "orderNumber": "O-519494",
                  "status": "New",
                  "type": "Quantity/Frequency Change",
                  "contact": null,
                  "caseSubType": "Quantity/Frequency Change",
                  "productInfo": [],
                  "attachments": []
              },
              {
                  "id": "500VA000004PHo9YAG",
                  "caseNumber": "04646620",
                  "createdDate": "2024-06-06T08:37:00.000+0000",
                  "lastModifiedDate": "2024-06-06T08:37:01.000+0000",
                  "orderNumber": "O-519494",
                  "status": "New",
                  "type": "Quantity/Frequency Change",
                  "contact": null,
                  "caseSubType": "Quantity/Frequency Change",
                  "productInfo": [],
                  "attachments": []
              },
              {
                  "id": "500VA000004PEaGYAW",
                  "caseNumber": "04646619",
                  "createdDate": "2024-06-06T08:27:56.000+0000",
                  "lastModifiedDate": "2024-06-06T08:27:57.000+0000",
                  "orderNumber": "O-519494",
                  "status": "New",
                  "type": "Move",
                  "contact": null,
                  "caseSubType": "Move",
                  "productInfo": [],
                  "attachments": []
              },
              {
                  "id": "500VA000004PHD3YAO",
                  "caseNumber": "04646618",
                  "createdDate": "2024-06-06T08:23:54.000+0000",
                  "lastModifiedDate": "2024-06-06T08:23:55.000+0000",
                  "orderNumber": "O-519494",
                  "status": "New",
                  "type": "Move",
                  "contact": null,
                  "caseSubType": "Move",
                  "productInfo": [],
                  "attachments": []
              },
              {
                  "id": "500VA000004BxP3YAK",
                  "caseNumber": "04646538",
                  "createdDate": "2024-05-24T10:47:27.000+0000",
                  "lastModifiedDate": "2024-05-24T10:47:27.000+0000",
                  "orderNumber": "O-519494",
                  "status": "New",
                  "type": "Move",
                  "contact": null,
                  "caseSubType": "Move",
                  "productInfo": [],
                  "attachments": []
              },
              {
                  "id": "500VA000004BwftYAC",
                  "caseNumber": "04646537",
                  "createdDate": "2024-05-24T10:37:45.000+0000",
                  "lastModifiedDate": "2024-05-24T10:37:45.000+0000",
                  "orderNumber": "O-519343",
                  "status": "New",
                  "type": "Quantity/Frequency Change",
                  "contact": null,
                  "caseSubType": "Quantity/Frequency Change",
                  "productInfo": [],
                  "attachments": []
              },
              {
                  "id": "500VA000004B4XTYA0",
                  "caseNumber": "04646533",
                  "createdDate": "2024-05-23T19:24:48.000+0000",
                  "lastModifiedDate": "2024-05-23T19:27:58.000+0000",
                  "orderNumber": "O-519494",
                  "status": "New",
                  "type": "Move",
                  "contact": null,
                  "caseSubType": "Move",
                  "productInfo": [],
                  "attachments": []
              },
              {
                  "id": "500VA0000049IoDYAU",
                  "caseNumber": "04646528",
                  "createdDate": "2024-05-22T08:43:41.000+0000",
                  "lastModifiedDate": "2024-06-06T09:03:04.000+0000",
                  "orderNumber": "O-519494",
                  "status": "In Progress",
                  "type": "Quantity/Frequency Change",
                  "contact": null,
                  "caseSubType": "Quantity/Frequency Change",
                  "productInfo": [],
                  "attachments": []
              },
              {
                  "id": "500VA0000047r0WYAQ",
                  "caseNumber": "04646510",
                  "createdDate": "2024-05-21T05:32:14.000+0000",
                  "lastModifiedDate": "2024-05-23T12:20:45.000+0000",
                  "orderNumber": "O-519494",
                  "status": "In Progress",
                  "type": "Quantity/Frequency Change",
                  "contact": null,
                  "caseSubType": "Quantity/Frequency Change",
                  "productInfo": [],
                  "attachments": []
              },
              {
                  "id": "500VA0000047uETYAY",
                  "caseNumber": "04646509",
                  "createdDate": "2024-05-21T05:31:16.000+0000",
                  "lastModifiedDate": "2024-05-22T12:17:30.000+0000",
                  "orderNumber": "O-519494",
                  "status": "In Progress",
                  "type": "Move",
                  "contact": null,
                  "caseSubType": "Move",
                  "productInfo": [],
                  "attachments": []
              },
              {
                  "id": "500VA0000047uBFYAY",
                  "caseNumber": "04646507",
                  "createdDate": "2024-05-21T05:30:05.000+0000",
                  "lastModifiedDate": "2024-05-21T05:30:05.000+0000",
                  "orderNumber": "O-519494",
                  "status": "New",
                  "type": "Quantity/Frequency Change",
                  "contact": null,
                  "caseSubType": "Quantity/Frequency Change",
                  "productInfo": [],
                  "attachments": []
              },
              {
                  "id": "500VA000003vQSHYA2",
                  "caseNumber": "04646425",
                  "createdDate": "2024-05-09T10:44:38.000+0000",
                  "lastModifiedDate": "2024-05-21T11:46:49.000+0000",
                  "orderNumber": "O-519336",
                  "status": "New",
                  "type": "Quantity/Frequency Change",
                  "contact": null,
                  "caseSubType": "Quantity/Frequency Change",
                  "productInfo": [],
                  "attachments": []
              },
              {
                  "id": "500VA000003vOIQYA2",
                  "caseNumber": "04646424",
                  "createdDate": "2024-05-09T10:31:45.000+0000",
                  "lastModifiedDate": "2024-05-09T10:31:45.000+0000",
                  "orderNumber": "O-519336",
                  "status": "New",
                  "type": "Quantity/Frequency Change",
                  "contact": null,
                  "caseSubType": "Quantity/Frequency Change",
                  "productInfo": [],
                  "attachments": []
              },
              {
                  "id": "500VA000003vCM5YAM",
                  "caseNumber": "04646422",
                  "createdDate": "2024-05-09T06:00:27.000+0000",
                  "lastModifiedDate": "2024-05-09T06:00:27.000+0000",
                  "orderNumber": "O-519343",
                  "status": "New",
                  "type": "Quantity/Frequency Change",
                  "contact": null,
                  "caseSubType": "Quantity/Frequency Change",
                  "productInfo": [],
                  "attachments": []
              },
              {
                  "id": "500VA000003vC9BYAU",
                  "caseNumber": "04646421",
                  "createdDate": "2024-05-09T05:58:31.000+0000",
                  "lastModifiedDate": "2024-05-23T11:01:34.000+0000",
                  "orderNumber": "O-519343",
                  "status": "In Progress",
                  "type": "Quantity/Frequency Change",
                  "contact": null,
                  "caseSubType": "Quantity/Frequency Change",
                  "productInfo": [],
                  "attachments": []
              },
              {
                  "id": "500VA000003u4teYAA",
                  "caseNumber": "04646418",
                  "createdDate": "2024-05-08T11:20:19.000+0000",
                  "lastModifiedDate": "2024-05-23T07:25:56.000+0000",
                  "orderNumber": "O-O-519343",
                  "status": "In Progress",
                  "type": "Quantity/Frequency Change",
                  "contact": null,
                  "caseSubType": "Quantity/Frequency Change",
                  "productInfo": [],
                  "attachments": []
              },
              {
                  "id": "500VA000003u4laYAA",
                  "caseNumber": "04646417",
                  "createdDate": "2024-05-08T11:19:01.000+0000",
                  "lastModifiedDate": "2024-05-23T09:47:16.000+0000",
                  "orderNumber": "O-O-519343",
                  "status": "In Progress",
                  "type": "Quantity/Frequency Change",
                  "contact": null,
                  "caseSubType": "Quantity/Frequency Change",
                  "productInfo": [],
                  "attachments": []
              },
              {
                  "id": "500VA000003u5PtYAI",
                  "caseNumber": "04646416",
                  "createdDate": "2024-05-08T11:16:12.000+0000",
                  "lastModifiedDate": "2024-05-08T11:16:12.000+0000",
                  "orderNumber": "O-O-519343",
                  "status": "New",
                  "type": "Quantity/Frequency Change",
                  "contact": null,
                  "caseSubType": "Quantity/Frequency Change",
                  "productInfo": [],
                  "attachments": []
              },
              {
                  "id": "500VA000003u3RJYAY",
                  "caseNumber": "04646415",
                  "createdDate": "2024-05-08T10:39:27.000+0000",
                  "lastModifiedDate": "2024-05-08T10:39:27.000+0000",
                  "orderNumber": "O-O-519343",
                  "status": "New",
                  "type": "Quantity/Frequency Change",
                  "contact": null,
                  "caseSubType": "Quantity/Frequency Change",
                  "productInfo": [],
                  "attachments": []
              },
              {
                  "id": "500VA000003u3O5YAI",
                  "caseNumber": "04646414",
                  "createdDate": "2024-05-08T10:38:04.000+0000",
                  "lastModifiedDate": "2024-05-08T10:38:04.000+0000",
                  "orderNumber": "O-O-519343",
                  "status": "New",
                  "type": "Quantity/Frequency Change",
                  "contact": null,
                  "caseSubType": "Quantity/Frequency Change",
                  "productInfo": [],
                  "attachments": []
              },
              {
                  "id": "500VA000003tvdTYAQ",
                  "caseNumber": "04646413",
                  "createdDate": "2024-05-08T10:26:00.000+0000",
                  "lastModifiedDate": "2024-05-08T10:26:00.000+0000",
                  "orderNumber": "O-O-519343",
                  "status": "New",
                  "type": "Quantity/Frequency Change",
                  "contact": null,
                  "caseSubType": "Quantity/Frequency Change",
                  "productInfo": [],
                  "attachments": []
              },
              {
                  "id": "500VA000003tsAxYAI",
                  "caseNumber": "04646412",
                  "createdDate": "2024-05-08T09:35:19.000+0000",
                  "lastModifiedDate": "2024-05-08T09:35:19.000+0000",
                  "orderNumber": "O-O-519343",
                  "status": "New",
                  "type": "Quantity/Frequency Change",
                  "contact": null,
                  "caseSubType": "Quantity/Frequency Change",
                  "productInfo": [],
                  "attachments": []
              },
              {
                  "id": "500VA000003ttQLYAY",
                  "caseNumber": "04646408",
                  "createdDate": "2024-05-08T07:13:27.000+0000",
                  "lastModifiedDate": "2024-05-08T07:13:27.000+0000",
                  "orderNumber": "O-O-519343",
                  "status": "New",
                  "type": "Quantity/Frequency Change",
                  "contact": null,
                  "caseSubType": "Quantity/Frequency Change",
                  "productInfo": [],
                  "attachments": []
              }
          ]
      },
      "message": "Success",
      "success": true
    }
    const sfdcResponse = [
      {
        attributes: {
          type: "Case",
          url: "/services/data/v58.0/sobjects/Case/500VA000004U9ErYAK",
        },
        Id: "500VA000004U9ErYAK",
        CaseNumber: "04646707",
        CreatedDate: "2024-06-11T05:00:32.000+0000",
        LastModifiedDate: "2024-06-11T09:39:26.000+0000",
        Type: "Amendment",
        Case_Sub_type__c: "Quantity/Frequency Change",
        Status: "New",
        Order_Number__c: "519665",
      },
      {
        attributes: {
          type: "Case",
          url: "/services/data/v58.0/sobjects/Case/500VA000004TI7JYAW",
        },
        Id: "500VA000004TI7JYAW",
        CaseNumber: "04646693",
        CreatedDate: "2024-06-10T13:03:55.000+0000",
        LastModifiedDate: "2024-06-10T13:03:55.000+0000",
        Type: "Amendment",
        Case_Sub_type__c: "Quantity/Frequency Change",
        Status: "New",
        Order_Number__c: "519666",
      },
      {
        attributes: {
          type: "Case",
          url: "/services/data/v58.0/sobjects/Case/500VA000004SzxYYAS",
        },
        Id: "500VA000004SzxYYAS",
        CaseNumber: "04646683",
        CreatedDate: "2024-06-10T11:14:57.000+0000",
        LastModifiedDate: "2024-06-10T12:38:10.000+0000",
        Type: "Amendment",
        Case_Sub_type__c: "Quantity/Frequency Change",
        Status: "New",
        Order_Number__c: "519666",
      },
      {
        attributes: {
          type: "Case",
          url: "/services/data/v58.0/sobjects/Case/500VA000004QcDqYAK",
        },
        Id: "500VA000004QcDqYAK",
        CaseNumber: "04646673",
        CreatedDate: "2024-06-07T11:43:25.000+0000",
        LastModifiedDate: "2024-06-11T04:59:09.000+0000",
        Type: "Amendment",
        Case_Sub_type__c: "Quantity/Frequency Change",
        Status: "New",
        Order_Number__c: "519666",
      },
      {
        attributes: {
          type: "Case",
          url: "/services/data/v58.0/sobjects/Case/500VA000004QACwYAO",
        },
        Id: "500VA000004QACwYAO",
        CaseNumber: "04646671",
        CreatedDate: "2024-06-07T08:49:47.000+0000",
        LastModifiedDate: "2024-06-07T09:03:03.000+0000",
        Type: "Amendment",
        Case_Sub_type__c: "Move",
        Status: "New",
        Order_Number__c: "519666",
      },
      {
        attributes: {
          type: "Case",
          url: "/services/data/v58.0/sobjects/Case/500VA000004QSmLYAW",
        },
        Id: "500VA000004QSmLYAW",
        CaseNumber: "04646670",
        CreatedDate: "2024-06-07T08:44:14.000+0000",
        LastModifiedDate: "2024-06-07T08:44:15.000+0000",
        Type: "Amendment",
        Case_Sub_type__c: "Quantity/Frequency Change",
        Status: "New",
        Order_Number__c: "519666",
      },
      {
        attributes: {
          type: "Case",
          url: "/services/data/v58.0/sobjects/Case/500VA000004QMFWYA4",
        },
        Id: "500VA000004QMFWYA4",
        CaseNumber: "04646665",
        CreatedDate: "2024-06-07T07:22:39.000+0000",
        LastModifiedDate: "2024-06-07T07:28:31.000+0000",
        Type: "Amendment",
        Case_Sub_type__c: "Quantity/Frequency Change",
        Status: "New",
        Order_Number__c: "519666",
      },
      {
        attributes: {
          type: "Case",
          url: "/services/data/v58.0/sobjects/Case/500VA000004QOyrYAG",
        },
        Id: "500VA000004QOyrYAG",
        CaseNumber: "04646664",
        CreatedDate: "2024-06-07T07:19:22.000+0000",
        LastModifiedDate: "2024-06-11T06:23:21.000+0000",
        Type: "Amendment",
        Case_Sub_type__c: "Quantity/Frequency Change",
        Status: "New",
        Order_Number__c: "519666",
      },
      {
        attributes: {
          type: "Case",
          url: "/services/data/v58.0/sobjects/Case/500VA000004QOE5YAO",
        },
        Id: "500VA000004QOE5YAO",
        CaseNumber: "04646663",
        CreatedDate: "2024-06-07T07:11:23.000+0000",
        LastModifiedDate: "2024-06-07T07:11:23.000+0000",
        Type: "Amendment",
        Case_Sub_type__c: "Quantity/Frequency Change",
        Status: "New",
        Order_Number__c: "519666",
      },
      {
        attributes: {
          type: "Case",
          url: "/services/data/v58.0/sobjects/Case/500VA000004QMkBYAW",
        },
        Id: "500VA000004QMkBYAW",
        CaseNumber: "04646662",
        CreatedDate: "2024-06-07T07:06:18.000+0000",
        LastModifiedDate: "2024-06-07T07:06:18.000+0000",
        Type: "Amendment",
        Case_Sub_type__c: "Quantity/Frequency Change",
        Status: "New",
        Order_Number__c: "519666",
      },
      {
        attributes: {
          type: "Case",
          url: "/services/data/v58.0/sobjects/Case/500VA000004QJcdYAG",
        },
        Id: "500VA000004QJcdYAG",
        CaseNumber: "04646658",
        CreatedDate: "2024-06-07T06:06:56.000+0000",
        LastModifiedDate: "2024-06-07T06:08:06.000+0000",
        Type: "Amendment",
        Case_Sub_type__c: "Quantity/Frequency Change",
        Status: "New",
        Order_Number__c: "519666",
      },
      {
        attributes: {
          type: "Case",
          url: "/services/data/v58.0/sobjects/Case/500VA000004PUa6YAG",
        },
        Id: "500VA000004PUa6YAG",
        CaseNumber: "04646649",
        CreatedDate: "2024-06-06T13:13:53.000+0000",
        LastModifiedDate: "2024-06-07T05:49:32.000+0000",
        Type: "Amendment",
        Case_Sub_type__c: "Quantity/Frequency Change",
        Status: "New",
        Order_Number__c: "519666",
      },
      {
        attributes: {
          type: "Case",
          url: "/services/data/v58.0/sobjects/Case/500VA000004PNf8YAG",
        },
        Id: "500VA000004PNf8YAG",
        CaseNumber: "04646641",
        CreatedDate: "2024-06-06T11:08:34.000+0000",
        LastModifiedDate: "2024-06-06T11:08:35.000+0000",
        Type: "Amendment",
        Case_Sub_type__c: "Quantity/Frequency Change",
        Status: "New",
        Order_Number__c: "519665",
      },
      {
        attributes: {
          type: "Case",
          url: "/services/data/v58.0/sobjects/Case/500VA000004PMRHYA4",
        },
        Id: "500VA000004PMRHYA4",
        CaseNumber: "04646639",
        CreatedDate: "2024-06-06T10:55:34.000+0000",
        LastModifiedDate: "2024-06-06T11:08:33.000+0000",
        Type: "Amendment",
        Case_Sub_type__c: "Quantity/Frequency Change",
        Status: "New",
        Order_Number__c: "519665",
      },
      {
        attributes: {
          type: "Case",
          url: "/services/data/v58.0/sobjects/Case/500VA000004PNiJYAW",
        },
        Id: "500VA000004PNiJYAW",
        CaseNumber: "04646637",
        CreatedDate: "2024-06-06T10:48:10.000+0000",
        LastModifiedDate: "2024-06-06T10:48:11.000+0000",
        Type: "Amendment",
        Case_Sub_type__c: "Move",
        Status: "New",
        Order_Number__c: "519665",
      },
      {
        attributes: {
          type: "Case",
          url: "/services/data/v58.0/sobjects/Case/500VA000004PPiTYAW",
        },
        Id: "500VA000004PPiTYAW",
        CaseNumber: "04646636",
        CreatedDate: "2024-06-06T10:43:21.000+0000",
        LastModifiedDate: "2024-06-06T10:43:22.000+0000",
        Type: "Amendment",
        Case_Sub_type__c: "Quantity/Frequency Change",
        Status: "New",
        Order_Number__c: "519665",
      },
      {
        attributes: {
          type: "Case",
          url: "/services/data/v58.0/sobjects/Case/500VA000004POEYYA4",
        },
        Id: "500VA000004POEYYA4",
        CaseNumber: "04646635",
        CreatedDate: "2024-06-06T10:31:30.000+0000",
        LastModifiedDate: "2024-06-06T10:31:31.000+0000",
        Type: "Amendment",
        Case_Sub_type__c: "Quantity/Frequency Change",
        Status: "New",
        Order_Number__c: "519665",
      },
      {
        attributes: {
          type: "Case",
          url: "/services/data/v58.0/sobjects/Case/500VA000004PLrlYAG",
        },
        Id: "500VA000004PLrlYAG",
        CaseNumber: "04646628",
        CreatedDate: "2024-06-06T09:32:16.000+0000",
        LastModifiedDate: "2024-06-06T10:19:17.000+0000",
        Type: "Amendment",
        Case_Sub_type__c: "Quantity/Frequency Change",
        Status: "New",
        Order_Number__c: "519494",
      },
      {
        attributes: {
          type: "Case",
          url: "/services/data/v58.0/sobjects/Case/500VA000004PJd3YAG",
        },
        Id: "500VA000004PJd3YAG",
        CaseNumber: "04646624",
        CreatedDate: "2024-06-06T09:05:39.000+0000",
        LastModifiedDate: "2024-06-06T09:05:52.000+0000",
        Type: "Amendment",
        Case_Sub_type__c: "Move",
        Status: "New",
        Order_Number__c: "519494",
      },
      {
        attributes: {
          type: "Case",
          url: "/services/data/v58.0/sobjects/Case/500VA000004PIaXYAW",
        },
        Id: "500VA000004PIaXYAW",
        CaseNumber: "04646622",
        CreatedDate: "2024-06-06T08:51:33.000+0000",
        LastModifiedDate: "2024-06-06T08:51:33.000+0000",
        Type: "Amendment",
        Case_Sub_type__c: "Quantity/Frequency Change",
        Status: "New",
        Order_Number__c: "519494",
      },
      {
        attributes: {
          type: "Case",
          url: "/services/data/v58.0/sobjects/Case/500VA000004PHo9YAG",
        },
        Id: "500VA000004PHo9YAG",
        CaseNumber: "04646620",
        CreatedDate: "2024-06-06T08:37:00.000+0000",
        LastModifiedDate: "2024-06-06T08:37:01.000+0000",
        Type: "Amendment",
        Case_Sub_type__c: "Quantity/Frequency Change",
        Status: "New",
        Order_Number__c: "519494",
      },
      {
        attributes: {
          type: "Case",
          url: "/services/data/v58.0/sobjects/Case/500VA000004PEaGYAW",
        },
        Id: "500VA000004PEaGYAW",
        CaseNumber: "04646619",
        CreatedDate: "2024-06-06T08:27:56.000+0000",
        LastModifiedDate: "2024-06-06T08:27:57.000+0000",
        Type: "Amendment",
        Case_Sub_type__c: "Move",
        Status: "New",
        Order_Number__c: "519494",
      },
      {
        attributes: {
          type: "Case",
          url: "/services/data/v58.0/sobjects/Case/500VA000004PHD3YAO",
        },
        Id: "500VA000004PHD3YAO",
        CaseNumber: "04646618",
        CreatedDate: "2024-06-06T08:23:54.000+0000",
        LastModifiedDate: "2024-06-06T08:23:55.000+0000",
        Type: "Amendment",
        Case_Sub_type__c: "Move",
        Status: "New",
        Order_Number__c: "519494",
      },
      {
        attributes: {
          type: "Case",
          url: "/services/data/v58.0/sobjects/Case/500VA000004BxP3YAK",
        },
        Id: "500VA000004BxP3YAK",
        CaseNumber: "04646538",
        CreatedDate: "2024-05-24T10:47:27.000+0000",
        LastModifiedDate: "2024-05-24T10:47:27.000+0000",
        Type: "Amendment",
        Case_Sub_type__c: "Move",
        Status: "New",
        Order_Number__c: "519494",
      },
      {
        attributes: {
          type: "Case",
          url: "/services/data/v58.0/sobjects/Case/500VA000004BwftYAC",
        },
        Id: "500VA000004BwftYAC",
        CaseNumber: "04646537",
        CreatedDate: "2024-05-24T10:37:45.000+0000",
        LastModifiedDate: "2024-05-24T10:37:45.000+0000",
        Type: "Amendment",
        Case_Sub_type__c: "Quantity/Frequency Change",
        Status: "New",
        Order_Number__c: "519343",
      },
      {
        attributes: {
          type: "Case",
          url: "/services/data/v58.0/sobjects/Case/500VA000004B4XTYA0",
        },
        Id: "500VA000004B4XTYA0",
        CaseNumber: "04646533",
        CreatedDate: "2024-05-23T19:24:48.000+0000",
        LastModifiedDate: "2024-05-23T19:27:58.000+0000",
        Type: "Amendment",
        Case_Sub_type__c: "Move",
        Status: "New",
        Order_Number__c: "519494",
      },
      {
        attributes: {
          type: "Case",
          url: "/services/data/v58.0/sobjects/Case/500VA0000049IoDYAU",
        },
        Id: "500VA0000049IoDYAU",
        CaseNumber: "04646528",
        CreatedDate: "2024-05-22T08:43:41.000+0000",
        LastModifiedDate: "2024-06-06T09:03:04.000+0000",
        Type: "Amendment",
        Case_Sub_type__c: "Quantity/Frequency Change",
        Status: "In Progress",
        Order_Number__c: "519494",
      },
      {
        attributes: {
          type: "Case",
          url: "/services/data/v58.0/sobjects/Case/500VA0000047r0WYAQ",
        },
        Id: "500VA0000047r0WYAQ",
        CaseNumber: "04646510",
        CreatedDate: "2024-05-21T05:32:14.000+0000",
        LastModifiedDate: "2024-05-23T12:20:45.000+0000",
        Type: "Amendment",
        Case_Sub_type__c: "Quantity/Frequency Change",
        Status: "In Progress",
        Order_Number__c: "519494",
      },
      {
        attributes: {
          type: "Case",
          url: "/services/data/v58.0/sobjects/Case/500VA0000047uETYAY",
        },
        Id: "500VA0000047uETYAY",
        CaseNumber: "04646509",
        CreatedDate: "2024-05-21T05:31:16.000+0000",
        LastModifiedDate: "2024-05-22T12:17:30.000+0000",
        Type: "Amendment",
        Case_Sub_type__c: "Move",
        Status: "In Progress",
        Order_Number__c: "519494",
      },
      {
        attributes: {
          type: "Case",
          url: "/services/data/v58.0/sobjects/Case/500VA0000047uBFYAY",
        },
        Id: "500VA0000047uBFYAY",
        CaseNumber: "04646507",
        CreatedDate: "2024-05-21T05:30:05.000+0000",
        LastModifiedDate: "2024-05-21T05:30:05.000+0000",
        Type: "Amendment",
        Case_Sub_type__c: "Quantity/Frequency Change",
        Status: "New",
        Order_Number__c: "519494",
      },
      {
        attributes: {
          type: "Case",
          url: "/services/data/v58.0/sobjects/Case/500VA000003vQSHYA2",
        },
        Id: "500VA000003vQSHYA2",
        CaseNumber: "04646425",
        CreatedDate: "2024-05-09T10:44:38.000+0000",
        LastModifiedDate: "2024-05-21T11:46:49.000+0000",
        Type: "Amendment",
        Case_Sub_type__c: "Quantity/Frequency Change",
        Status: "New",
        Order_Number__c: "519336",
      },
      {
        attributes: {
          type: "Case",
          url: "/services/data/v58.0/sobjects/Case/500VA000003vOIQYA2",
        },
        Id: "500VA000003vOIQYA2",
        CaseNumber: "04646424",
        CreatedDate: "2024-05-09T10:31:45.000+0000",
        LastModifiedDate: "2024-05-09T10:31:45.000+0000",
        Type: "Amendment",
        Case_Sub_type__c: "Quantity/Frequency Change",
        Status: "New",
        Order_Number__c: "519336",
      },
      {
        attributes: {
          type: "Case",
          url: "/services/data/v58.0/sobjects/Case/500VA000003vCM5YAM",
        },
        Id: "500VA000003vCM5YAM",
        CaseNumber: "04646422",
        CreatedDate: "2024-05-09T06:00:27.000+0000",
        LastModifiedDate: "2024-05-09T06:00:27.000+0000",
        Type: "Amendment",
        Case_Sub_type__c: "Quantity/Frequency Change",
        Status: "New",
        Order_Number__c: "519343",
      },
      {
        attributes: {
          type: "Case",
          url: "/services/data/v58.0/sobjects/Case/500VA000003vC9BYAU",
        },
        Id: "500VA000003vC9BYAU",
        CaseNumber: "04646421",
        CreatedDate: "2024-05-09T05:58:31.000+0000",
        LastModifiedDate: "2024-05-23T11:01:34.000+0000",
        Type: "Amendment",
        Case_Sub_type__c: "Quantity/Frequency Change",
        Status: "In Progress",
        Order_Number__c: "519343",
      },
      {
        attributes: {
          type: "Case",
          url: "/services/data/v58.0/sobjects/Case/500VA000003u4teYAA",
        },
        Id: "500VA000003u4teYAA",
        CaseNumber: "04646418",
        CreatedDate: "2024-05-08T11:20:19.000+0000",
        LastModifiedDate: "2024-05-23T07:25:56.000+0000",
        Type: "Amendment",
        Case_Sub_type__c: "Quantity/Frequency Change",
        Status: "In Progress",
        Order_Number__c: "O-519343",
      },
      {
        attributes: {
          type: "Case",
          url: "/services/data/v58.0/sobjects/Case/500VA000003u4laYAA",
        },
        Id: "500VA000003u4laYAA",
        CaseNumber: "04646417",
        CreatedDate: "2024-05-08T11:19:01.000+0000",
        LastModifiedDate: "2024-05-23T09:47:16.000+0000",
        Type: "Amendment",
        Case_Sub_type__c: "Quantity/Frequency Change",
        Status: "In Progress",
        Order_Number__c: "O-519343",
      },
      {
        attributes: {
          type: "Case",
          url: "/services/data/v58.0/sobjects/Case/500VA000003u5PtYAI",
        },
        Id: "500VA000003u5PtYAI",
        CaseNumber: "04646416",
        CreatedDate: "2024-05-08T11:16:12.000+0000",
        LastModifiedDate: "2024-05-08T11:16:12.000+0000",
        Type: "Amendment",
        Case_Sub_type__c: "Quantity/Frequency Change",
        Status: "New",
        Order_Number__c: "O-519343",
      },
      {
        attributes: {
          type: "Case",
          url: "/services/data/v58.0/sobjects/Case/500VA000003u3RJYAY",
        },
        Id: "500VA000003u3RJYAY",
        CaseNumber: "04646415",
        CreatedDate: "2024-05-08T10:39:27.000+0000",
        LastModifiedDate: "2024-05-08T10:39:27.000+0000",
        Type: "Amendment",
        Case_Sub_type__c: "Quantity/Frequency Change",
        Status: "New",
        Order_Number__c: "O-519343",
      },
      {
        attributes: {
          type: "Case",
          url: "/services/data/v58.0/sobjects/Case/500VA000003u3O5YAI",
        },
        Id: "500VA000003u3O5YAI",
        CaseNumber: "04646414",
        CreatedDate: "2024-05-08T10:38:04.000+0000",
        LastModifiedDate: "2024-05-08T10:38:04.000+0000",
        Type: "Amendment",
        Case_Sub_type__c: "Quantity/Frequency Change",
        Status: "New",
        Order_Number__c: "O-519343",
      },
      {
        attributes: {
          type: "Case",
          url: "/services/data/v58.0/sobjects/Case/500VA000003tvdTYAQ",
        },
        Id: "500VA000003tvdTYAQ",
        CaseNumber: "04646413",
        CreatedDate: "2024-05-08T10:26:00.000+0000",
        LastModifiedDate: "2024-05-08T10:26:00.000+0000",
        Type: "Amendment",
        Case_Sub_type__c: "Quantity/Frequency Change",
        Status: "New",
        Order_Number__c: "O-519343",
      },
      {
        attributes: {
          type: "Case",
          url: "/services/data/v58.0/sobjects/Case/500VA000003tsAxYAI",
        },
        Id: "500VA000003tsAxYAI",
        CaseNumber: "04646412",
        CreatedDate: "2024-05-08T09:35:19.000+0000",
        LastModifiedDate: "2024-05-08T09:35:19.000+0000",
        Type: "Amendment",
        Case_Sub_type__c: "Quantity/Frequency Change",
        Status: "New",
        Order_Number__c: "O-519343",
      },
      {
        attributes: {
          type: "Case",
          url: "/services/data/v58.0/sobjects/Case/500VA000003ttQLYAY",
        },
        Id: "500VA000003ttQLYAY",
        CaseNumber: "04646408",
        CreatedDate: "2024-05-08T07:13:27.000+0000",
        LastModifiedDate: "2024-05-08T07:13:27.000+0000",
        Type: "Amendment",
        Case_Sub_type__c: "Quantity/Frequency Change",
        Status: "New",
        Order_Number__c: "O-519343",
      },
    ]
    mockSfdcCaseService.getAccountWiseCaseList.mockResolvedValue(sfdcResponse);
    expect(await service.getAccountWiseCaseList(accountId,fetchCaseDto,'')).toEqual(response);
  });
  
  //get contract wise case list success - closed - no data found
  it('should call getContractWiseCaseList', async () => {
    const contractId = '518854';
    const fetchCaseDto = {
      startTime: '2022-05-22',
      endTime: '2024-10-03',
      status: 'closed',
      contactId: '0038I00000i2yVtQAI',
    };
    const response = {
      "status": 1000,
      "data": {},
      "message": "No cases found for this account",
      "success": true
    };
    const sfdcResponse = [];
    mockSfdcCaseService.getContractWiseCaseList.mockResolvedValue(sfdcResponse);
    expect(await service.getContractWiseCaseList(contractId,fetchCaseDto)).toEqual(response);
  });
  //get case details success
  it('should call getCaseDetails success', async () => {
    const caseId = '500VA000003OEzNYAW';
    const response = {
      "status": 1000,
      "data": {
          "caseDetails": {
              "id": "500VA000003OEzNYAW",
              "caseNumber": "04646338",
              "createdDate": "2024-04-11T07:22:25.000+0000",
              "lastModifiedDate": "2024-05-22T07:34:34.000+0000",
              "orderNumber": "O-Q-517386",
              "priority": "P4-CT",
              "status": "In Progress",
              "type": "Move",
              "siteContactName": "Gaurav",
              "siteContactPhone": "9898786767",
              "siteAddress": "118 Flanders Rd, Westborough MA 01581",
              "productType": "Sanitation",
              "caseType": "Amendment",
              "cutOffTimeZone": "Central",
              "contact": {
                  "id": null,
                  "firstName": "Gaurav1",
                  "lastName": "Narvekar",
                  "email": "gaurav.narvekar+23@zingworks.in",
                  "fullName": "Gaurav1 Narvekar"
              },
              "caseSubType": "Move",
              "placementNotes": "Near gate B",
              "dueDate": "2024-04-30",
              "subject": "Frontier Logistics, LP/P4-CT/Sanitation/Amendment/Q-517386",
              "description": "{\"Details\":[{\"label\": \"Product\", \"fieldName\": \"Product\" },{\"label\": \"Size\", \"fieldName\": \"Size\"},{\"label\": \"Quantity\", \"fieldName\":\"Quantity\", \"cellAttributes\": {\"alignment\": \"left\"}},{ \"label\": \"Service Frequency\", \"fieldName\": \"Service Frequency\"},{\"label\": \"Price\", \"fieldName\": \"Price\", \"type\":\"currency\", \"cellAttributes\": {\"alignment\": \"left\"}},{\"label\": \"Action\", \"fieldName\": \"Action\"},{\"label\": \"Notes\", \"fieldName\": \"Notes\"}],\"Data\":[]}",
              "productInfo": [],
              "attachments": []
          },
          "comments": [
              {
                  "id": "aIrVA0000000Bxx0AE",
                  "commentType": "Status",
                  "lastModifiedDate": "2024-05-22T07:34:30.000+0000",
                  "commentBody": "test comment",
                  "contactId": "0038I00000fo9X6QAI",
                  "commentedByContact": {
                      "id": "0038I00000fo9X6QAI",
                      "firstName": "David",
                      "lastName": "Johnson",
                      "fullName": "David Johnson"
                  },
                  "commentedByMyUSSUser": true,
                  "commentedByName": "David Johnson",
                  "attachments": []
              }
          ],
          "activities": [
              {
                  "dateTime": "2024-05-22T07:34:32.000+0000",
                  "activity": "Status - Closed to In Progress"
              },
              {
                  "dateTime": "2024-05-22T07:34:32.000+0000",
                  "activity": "Closed by - null"
              },
              {
                  "dateTime": "2024-05-15T10:36:41.000+0000",
                  "activity": "USF_Case_Service_Group__c - USF_Order_Support to USF_Homebuilders"
              },
              {
                  "dateTime": "2024-04-12T10:17:46.000+0000",
                  "activity": "Status - New to Closed"
              },
              {
                  "dateTime": "2024-04-12T10:17:46.000+0000",
                  "activity": "Closed by - Sharvil Gujarathi"
              },
              {
                  "dateTime": "2024-04-11T07:22:25.000+0000",
                  "activity": "created"
              }
          ]
      },
      "message": "Success",
      "success": true
  }
    const sfdcResponse = {
      caseDetails: {
        attributes: {
          type: "Case",
          url: "/services/data/v58.0/sobjects/Case/500VA000003OEzNYAW",
        },
        Id: "500VA000003OEzNYAW",
        CaseNumber: "04646338",
        CreatedDate: "2024-04-11T07:22:25.000+0000",
        LastModifiedDate: "2024-05-22T07:34:34.000+0000",
        Site_Contact_Name__c: "Gaurav",
        Site_Contact_Phone__c: "9898786767",
        Case_Sub_type__c: "Move",
        Site_Address__c: "118 Flanders Rd, Westborough MA 01581",
        Contact: {
          attributes: {
            type: "Contact",
            url: "/services/data/v58.0/sobjects/Contact/0038I00000f6KyqQAE",
          },
          Email: "gaurav.narvekar+23@zingworks.in",
          FirstName: "Gaurav1",
          LastName: "Narvekar",
        },
        Status: "In Progress",
        Priority: "P4-CT",
        Order_Number__c: "Q-517386",
        Skill_Requirement__c: "Sanitation;Amendment;Central",
        Due_Date__c: "2024-04-30",
        Placement_Notes__c: "Near gate B",
        Description__c: "{\"Details\":[{\"label\": \"Product\", \"fieldName\": \"Product\" },{\"label\": \"Size\", \"fieldName\": \"Size\"},{\"label\": \"Quantity\", \"fieldName\":\"Quantity\", \"cellAttributes\": {\"alignment\": \"left\"}},{ \"label\": \"Service Frequency\", \"fieldName\": \"Service Frequency\"},{\"label\": \"Price\", \"fieldName\": \"Price\", \"type\":\"currency\", \"cellAttributes\": {\"alignment\": \"left\"}},{\"label\": \"Action\", \"fieldName\": \"Action\"},{\"label\": \"Notes\", \"fieldName\": \"Notes\"}],\"Data\":[]}",
        Subject: "Frontier Logistics, LP/P4-CT/Sanitation/Amendment/Q-517386",
        Type: "Amendment",
        ContentDocumentLinks: null,
        Tasks: null,
        Events: null,
        Histories: {
          totalSize: 6,
          done: true,
          records: [
            {
              attributes: {
                type: "CaseHistory",
                url: "/services/data/v58.0/sobjects/CaseHistory/017VA00000DqGiVYAV",
              },
              Id: "017VA00000DqGiVYAV",
              Field: "created",
              DataType: "Text",
              OldValue: null,
              NewValue: null,
              CreatedDate: "2024-04-11T07:22:25.000+0000",
              CreatedBy: {
                attributes: {
                  type: "Name",
                  url: "/services/data/v58.0/sobjects/User/0058I000002ndZBQAY",
                },
                Name: "Gaurav Narvekar",
              },
            },
            {
              attributes: {
                type: "CaseHistory",
                url: "/services/data/v58.0/sobjects/CaseHistory/017VA00000E0oHBYAZ",
              },
              Id: "017VA00000E0oHBYAZ",
              Field: "Status",
              DataType: "DynamicEnum",
              OldValue: "New",
              NewValue: "Closed",
              CreatedDate: "2024-04-12T10:17:46.000+0000",
              CreatedBy: {
                attributes: {
                  type: "Name",
                  url: "/services/data/v58.0/sobjects/User/0058I000003Gqw7QAC",
                },
                Name: "Sharvil Gujarathi",
              },
            },
            {
              attributes: {
                type: "CaseHistory",
                url: "/services/data/v58.0/sobjects/CaseHistory/017VA00000E0oHCYAZ",
              },
              Id: "017VA00000E0oHCYAZ",
              Field: "USF_Closed_By__c",
              DataType: "Text",
              OldValue: null,
              NewValue: "Sharvil Gujarathi",
              CreatedDate: "2024-04-12T10:17:46.000+0000",
              CreatedBy: {
                attributes: {
                  type: "Name",
                  url: "/services/data/v58.0/sobjects/User/0058I000003Gqw7QAC",
                },
                Name: "Sharvil Gujarathi",
              },
            },
            {
              attributes: {
                type: "CaseHistory",
                url: "/services/data/v58.0/sobjects/CaseHistory/017VA00000NpngeYAB",
              },
              Id: "017VA00000NpngeYAB",
              Field: "USF_Case_Service_Group__c",
              DataType: "DynamicEnum",
              OldValue: "USF_Order_Support",
              NewValue: "USF_Homebuilders",
              CreatedDate: "2024-05-15T10:36:41.000+0000",
              CreatedBy: {
                attributes: {
                  type: "Name",
                  url: "/services/data/v58.0/sobjects/User/005VA000003eULpYAM",
                },
                Name: "Aniket Kanade",
              },
            },
            {
              attributes: {
                type: "CaseHistory",
                url: "/services/data/v58.0/sobjects/CaseHistory/017VA00000PkKP4YAN",
              },
              Id: "017VA00000PkKP4YAN",
              Field: "Status",
              DataType: "DynamicEnum",
              OldValue: "Closed",
              NewValue: "In Progress",
              CreatedDate: "2024-05-22T07:34:32.000+0000",
              CreatedBy: {
                attributes: {
                  type: "Name",
                  url: "/services/data/v58.0/sobjects/User/0058I000002oBmXQAU",
                },
                Name: "MyUSS System User",
              },
            },
            {
              attributes: {
                type: "CaseHistory",
                url: "/services/data/v58.0/sobjects/CaseHistory/017VA00000PkKP5YAN",
              },
              Id: "017VA00000PkKP5YAN",
              Field: "USF_Closed_By__c",
              DataType: "Text",
              OldValue: "Sharvil Gujarathi",
              NewValue: null,
              CreatedDate: "2024-05-22T07:34:32.000+0000",
              CreatedBy: {
                attributes: {
                  type: "Name",
                  url: "/services/data/v58.0/sobjects/User/0058I000002oBmXQAU",
                },
                Name: "MyUSS System User",
              },
            },
          ],
        },
        Feeds: null,
      },
      comments: [
        {
          attributes: {
            type: "MyUSS_Case_Comment__c",
            url: "/services/data/v58.0/sobjects/MyUSS_Case_Comment__c/aIrVA0000000Bxx0AE",
          },
          Id: "aIrVA0000000Bxx0AE",
          Owner: {
            attributes: {
              type: "Name",
              url: "/services/data/v58.0/sobjects/User/0058I000002oBmXQAU",
            },
            Name: "MyUSS System User",
          },
          Comment__c: "test comment",
          Case__c: "500VA000003OEzNYAW",
          Comment_Type__c: "Status",
          Commented_By__c: "0038I00000fo9X6QAI",
          Commented_By__r: {
            attributes: {
              type: "Contact",
              url: "/services/data/v58.0/sobjects/Contact/0038I00000fo9X6QAI",
            },
            FirstName: "David",
            LastName: "Johnson",
            Id: "0038I00000fo9X6QAI",
          },
          LastModifiedDate: "2024-05-22T07:34:30.000+0000",
          Commented_By_MyUSS_User__c: true,
          ContentDocumentLinks: null,
        },
      ],
      tasks: undefined,
      events: undefined,
      feeds: undefined,
      histories: [
        {
          attributes: {
            type: "CaseHistory",
            url: "/services/data/v58.0/sobjects/CaseHistory/017VA00000DqGiVYAV",
          },
          Id: "017VA00000DqGiVYAV",
          Field: "created",
          DataType: "Text",
          OldValue: null,
          NewValue: null,
          CreatedDate: "2024-04-11T07:22:25.000+0000",
          CreatedBy: {
            attributes: {
              type: "Name",
              url: "/services/data/v58.0/sobjects/User/0058I000002ndZBQAY",
            },
            Name: "Gaurav Narvekar",
          },
        },
        {
          attributes: {
            type: "CaseHistory",
            url: "/services/data/v58.0/sobjects/CaseHistory/017VA00000E0oHBYAZ",
          },
          Id: "017VA00000E0oHBYAZ",
          Field: "Status",
          DataType: "DynamicEnum",
          OldValue: "New",
          NewValue: "Closed",
          CreatedDate: "2024-04-12T10:17:46.000+0000",
          CreatedBy: {
            attributes: {
              type: "Name",
              url: "/services/data/v58.0/sobjects/User/0058I000003Gqw7QAC",
            },
            Name: "Sharvil Gujarathi",
          },
        },
        {
          attributes: {
            type: "CaseHistory",
            url: "/services/data/v58.0/sobjects/CaseHistory/017VA00000E0oHCYAZ",
          },
          Id: "017VA00000E0oHCYAZ",
          Field: "USF_Closed_By__c",
          DataType: "Text",
          OldValue: null,
          NewValue: "Sharvil Gujarathi",
          CreatedDate: "2024-04-12T10:17:46.000+0000",
          CreatedBy: {
            attributes: {
              type: "Name",
              url: "/services/data/v58.0/sobjects/User/0058I000003Gqw7QAC",
            },
            Name: "Sharvil Gujarathi",
          },
        },
        {
          attributes: {
            type: "CaseHistory",
            url: "/services/data/v58.0/sobjects/CaseHistory/017VA00000NpngeYAB",
          },
          Id: "017VA00000NpngeYAB",
          Field: "USF_Case_Service_Group__c",
          DataType: "DynamicEnum",
          OldValue: "USF_Order_Support",
          NewValue: "USF_Homebuilders",
          CreatedDate: "2024-05-15T10:36:41.000+0000",
          CreatedBy: {
            attributes: {
              type: "Name",
              url: "/services/data/v58.0/sobjects/User/005VA000003eULpYAM",
            },
            Name: "Aniket Kanade",
          },
        },
        {
          attributes: {
            type: "CaseHistory",
            url: "/services/data/v58.0/sobjects/CaseHistory/017VA00000PkKP4YAN",
          },
          Id: "017VA00000PkKP4YAN",
          Field: "Status",
          DataType: "DynamicEnum",
          OldValue: "Closed",
          NewValue: "In Progress",
          CreatedDate: "2024-05-22T07:34:32.000+0000",
          CreatedBy: {
            attributes: {
              type: "Name",
              url: "/services/data/v58.0/sobjects/User/0058I000002oBmXQAU",
            },
            Name: "MyUSS System User",
          },
        },
        {
          attributes: {
            type: "CaseHistory",
            url: "/services/data/v58.0/sobjects/CaseHistory/017VA00000PkKP5YAN",
          },
          Id: "017VA00000PkKP5YAN",
          Field: "USF_Closed_By__c",
          DataType: "Text",
          OldValue: "Sharvil Gujarathi",
          NewValue: null,
          CreatedDate: "2024-05-22T07:34:32.000+0000",
          CreatedBy: {
            attributes: {
              type: "Name",
              url: "/services/data/v58.0/sobjects/User/0058I000002oBmXQAU",
            },
            Name: "MyUSS System User",
          },
        },
      ],
      success: true,
    }
    mockSfdcCaseService.getCaseDetails.mockResolvedValue(sfdcResponse);
    const result = await service.getCaseDetails(caseId);
    expect(result).toEqual(response);
  });
  //get case details fail
  it('should call getCaseDetails fail', async () => {
    const caseId = '500VA000003OEzNYAW';
    const response = {
      status: 1032,
      data: {},
      message: 'Error while fetching case details',
      success: false
    }
    const sfdcResponse = {
      success : false
    }
    mockSfdcCaseService.getCaseDetails.mockResolvedValue(sfdcResponse);
    const result = await service.getCaseDetails(caseId);
    expect(result).toEqual(response);
  });
  //add case comment success
  it('should add comment success', async () => {
    const caseId = '500VA000003OEzNYAW';
    const reqObj = {
      "comment": "test commet ",
      "caseId": "500VA000003wgQCYAY",
      "contactId": "0018I00000k1qw3QAA",
      "type": "Status"
    }
    const response = {
      "status": 1000,
      "message": "Comment added successfully",
      "success": true,
      "data": {
          "commentId": "aIrVA0000000Jc90AE"
      }
  }
    mockSfdcCaseService.addCaseComment.mockResolvedValue({success:true,id:'aIrVA0000000Jc90AE'});
    const result = await service.addCaseComment(caseId,reqObj);
    expect(result).toEqual(response);
  });
  //add case comment fail
  it('should add comment fail', async () => {
    const caseId = '500VA000003OEzNYAW';
    const reqObj = {
      "comment": "test commet ",
      "caseId": "500VA000003wgQCYAY",
      "contactId": "0018I00000k1qw3QAA",
      "type": "Status"
    }
    const response = {
      "status": 1034,
      "message": "Error while adding comment",
      "success": false
    }
    mockSfdcCaseService.addCaseComment.mockResolvedValue({success:false});
    const result = await service.addCaseComment(caseId,reqObj);
    expect(result).toEqual(response);
  });
  //upload file success
  it('should upload file success', async () => {
    const file = {
      originalname: 'test-file.txt',
      buffer: Buffer.from('test content'),
    } as Express.Multer.File;
    const caseId = '500VA000003OEzNYAW';
    const response = {
      status: 1000,
      message: 'File uploaded successfully',
      success: true
    }
    mockSfdcCaseService.uploadFile.mockResolvedValue(true);
    const result = await service.uploadFile(file,caseId);
    expect(result).toEqual(response);
  });
  //upload file fail
  it('should upload file fail', async () => {
    const file = {
      originalname: 'test-file.txt',
      buffer: Buffer.from('test content'),
    } as Express.Multer.File;
    const caseId = '500VA000003OEzNYAW';
    const response = {
      status: 1035,
      message: 'Error while uploading file',
      success: false
    }
  mockSfdcCaseService.uploadFile.mockResolvedValue(false);
  const result = await service.uploadFile(file,caseId);
  });
  //getQuoteDocumentBody success
  it('should getQuoteDocumentBody success', async () => {
    const docId = '068VA000001LIG3YAO';
    mockSfdcBaseService.getDocumentBodyForCase.mockResolvedValue(Blob);
    mockSfdcCaseService.getDocumentBodyForCase.mockResolvedValue(Blob);
    const result = await service.getCaseDocumentBody(docId);
    expect(result).toBe(Blob);
  });
  //getQuoteDocumentBody fail
  it('should getQuoteDocumentBody fail', async () => {
    const docId = '068VA000001LIG3YAO';
    mockSfdcBaseService.getDocumentBodyForCase.mockResolvedValue(null);
    mockSfdcCaseService.getDocumentBodyForCase.mockResolvedValue(null);
    const result = await service.getCaseDocumentBody(docId);
    expect(result).toBe(null);
  });

});

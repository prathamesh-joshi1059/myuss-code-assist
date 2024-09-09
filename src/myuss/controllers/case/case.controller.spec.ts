import { Test, TestingModule } from '@nestjs/testing';
import { CaseController } from './case.controller';
import { CaseService } from '../../../myuss/services/case/case.service';
import { SfdcCaseService } from '../../../backend/sfdc/services/sfdc-case/sfdc-case.service';
import { CacheService } from '../../../core/cache/cache.service';
import { AccountsService } from '../../../myuss/services/accounts/accounts.service';
import { Response } from 'express';
import { StreamableFile } from '@nestjs/common';

describe('CaseController', () => {
  let controller: CaseController;
  let mockCacheService = {
    get: jest.fn()
  }
  let mockCaseService ={
    getAccountWiseCaseList: jest.fn(),
    getCaseDetails: jest.fn(),
    getContractWiseCaseList: jest.fn(),
    getContractCaseDetails: jest.fn(),
    addCaseComment: jest.fn(),
    uploadFile: jest.fn(),
    getCaseDocumentBody: jest.fn()

  }
  let mockSfdcCaseService ={
    getAccountWiseCaseList: jest.fn(),
    getCaseDetails: jest.fn(),
    getContractWiseCaseList: jest.fn()
  } 
  let mockAccountsService ={
    getAccount: jest.fn()
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CaseController],
      providers: [
        {
          provide: CaseService,
          useValue: mockCaseService
        },
        {
          provide: SfdcCaseService,
          useValue: mockSfdcCaseService
        },
        {
          provide: CacheService,
          useValue: mockCacheService
        },
        {
          provide: AccountsService,
          useValue: mockAccountsService
        }
      ]
    }).compile();

    controller = module.get<CaseController>(CaseController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
  //get account wise case list success - closed
  it('should call getAccountWiseCaseList', async () => {
    const accountId = '0018I00000hZ635QAC';
    const fetchCaseDto = {
      startTime: '2022-05-22',
      endTime: '2024-10-03',
      status: 'closed',
      contactId: '0018I00000k1qw3QAA',
      projectId: ''
    };
    const response = {
      "status": 1000,
      "data": {
          "cases": [
              {
                  "id": "500VA000003UgHpYAK",
                  "caseNumber": "04646348",
                  "createdDate": "2024-04-17T07:27:03.000+0000",
                  "lastModifiedDate": "2024-04-17T07:31:08.000+0000",
                  "status": "Closed",
                  "type": "Quantity/Frequency Change",
                  "contact": null
              },
              {
                  "id": "500VA000003OEzNYAW",
                  "caseNumber": "04646338",
                  "createdDate": "2024-04-11T07:22:25.000+0000",
                  "lastModifiedDate": "2024-04-12T10:17:46.000+0000",
                  "status": "Closed",
                  "type": "Move",
                  "contact": null
              }
          ]
      },
      "message": "Success",
      "success": true
    
    }
    const req = {
      query: {
        type: ''
      }
    }
    mockCaseService.getAccountWiseCaseList.mockResolvedValue(response);
    const result = await controller.getAccountWiseCaseList(req,{accountId},fetchCaseDto);
    expect(result).toEqual(response);
  })
  //get account wise case list success - open
  it('should call getAccountWiseCaseList', async () => {
    const accountId = '0018I00000hZ635QAC';
    const fetchCaseDto = {
      startTime: '',
      endTime: '',
      status: 'open',
      contactId: '0018I00000k1qw3QAA',
      projectId: ''

    };
    const response = {
      "status": 1000,
      "data": {
          "cases": [
              {
                  "id": "500VA000003KN0LYAW",
                  "caseNumber": "04646332",
                  "createdDate": "2024-04-08T07:21:44.000+0000",
                  "lastModifiedDate": "2024-04-11T09:45:11.000+0000",
                  "status": "Waiting on Submitter",
                  "type": "Move",
                  "contact": null
              },
              {
                  "id": "500VA000003KN1xYAG",
                  "caseNumber": "04646333",
                  "createdDate": "2024-04-08T07:21:44.000+0000",
                  "lastModifiedDate": "2024-04-08T07:21:44.000+0000",
                  "status": "New",
                  "type": "Move",
                  "contact": null
              },
              {
                  "id": "500VA0000037at4YAA",
                  "caseNumber": "04646320",
                  "createdDate": "2024-03-29T06:05:34.000+0000",
                  "lastModifiedDate": "2024-04-10T06:08:17.000+0000",
                  "status": "New",
                  "type": "Move",
                  "contact": null
              },
              {
                  "id": "500VA000002uYM1YAM",
                  "caseNumber": "04646298",
                  "createdDate": "2024-03-18T09:32:27.000+0000",
                  "lastModifiedDate": "2024-03-18T09:32:27.000+0000",
                  "status": "New",
                  "type": "Move",
                  "contact": null
              },
              {
                  "id": "500VA000002NORuYAO",
                  "caseNumber": "04646274",
                  "createdDate": "2024-02-27T06:38:19.000+0000",
                  "lastModifiedDate": "2024-02-27T06:38:19.000+0000",
                  "status": "New",
                  "type": "Move",
                  "contact": null
              },
              {
                  "id": "5008I0000088vO7QAI",
                  "caseNumber": "04646137",
                  "createdDate": "2023-12-20T11:20:39.000+0000",
                  "lastModifiedDate": "2023-12-20T11:20:39.000+0000",
                  "status": "New",
                  "type": "Quantity/Frequency Change",
                  "contact": null
              }
          ]
      },
      "message": "Success",
      "success": true
    }
    const req = {
      query: {
        type: ''
      }
    }
    mockCaseService.getAccountWiseCaseList.mockResolvedValue(response);
    const result = await controller.getAccountWiseCaseList(req,{accountId},fetchCaseDto);
    expect(result).toEqual(response);
  })
  //get case details success
  it('should call getCaseDetails', async () => {
    const accountId = '0018I00000C2bRmQAJ';
    const caseId = '500VA000003OEzNYAW';
    const response = {
      "status": 1000,
      "data": {
          "caseDetails": {
              "id": "500VA000003OEzNYAW",
              "caseNumber": "04646338",
              "createdDate": "2024-04-11T07:22:25.000+0000",
              "lastModifiedDate": "2024-04-12T10:17:46.000+0000",
              "orderNumber": "Q-517386",
              "priority": "P4-CT",
              "status": "Closed",
              "type": "Move",
              "siteContactName": "Gaurav",
              "siteContactPhone": "9898786767",
              "siteAddress": "118 Flanders Rd, Westborough MA 01581",
              "productType": "Sanitation",
              "caseType": "Amendment",
              "cutOffTimeZone": "Central",
              "contact": {
                  "firstName": "Gaurav1",
                  "lastName": "Narvekar",
                  "email": "gaurav.narvekar+23@zingworks.in",
                  "fullName": "Gaurav1 Narvekar"
              }
          },
          "comments": [],
          "activities": [
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
    mockCaseService.getCaseDetails.mockResolvedValue(response);
    const result = await controller.getCaseDetails(caseId);
    expect(result).toEqual(response);
  })
  //get case details failure
  it('should call getCaseDetails', async () => {
    const accountId = '0018I00000C2bRmQAJ';
    const caseId = '500VA000003OEzNYAW';
    const response = {
      "status": 1005,
      "message": "Case not found",
      "success": false
  }
    mockCaseService.getCaseDetails.mockResolvedValue(response);
    const result = await controller.getCaseDetails(caseId);
    expect(result).toEqual(response);
  })
  //add case comment success
  it('should call addCaseComment success', async () => {
    const accountId = '0018I00000C2bRmQAJ';
    const caseId = '500VA000003OEzNYAW';
    
    const response = {
      "status": 1000,
      "message": "Comment added successfully",
      "success": true
    }
    const reqObj = {
      "comment": "test commet ",
      "caseId": "500VA000003wgQCYAY",
      "contactId": "0018I00000k1qw3QAA",
      "type": "Status"
    }
    mockCaseService.addCaseComment.mockResolvedValue(response);
    const result = await controller.addCaseComment(caseId,reqObj);
    expect(result).toEqual(response);
  })
  //add case comment failure
  it('should call addCaseComment fail', async () => {
    const accountId = '0018I00000C2bRmQAJ';
    const caseId = '500VA000003OEzNYAW';
    
    const response = {
      "status": 1005,
      "message": "Case not found",
      "success": false
    }
    const reqObj = {
      "comment": "test commet ",
      "caseId": "500VA000003wgQCYAY",
      "contactId": "0018I00000k1qw3QAA",
      "type": "Status"
    }
    mockCaseService.addCaseComment.mockResolvedValue(response);
    const result = await controller.addCaseComment(caseId,reqObj);
    expect(result).toEqual(response);
  })
  //upload file success
  it('should call uploadFile success', async () => {
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
    mockCaseService.uploadFile.mockResolvedValue(response);
    const result = await controller.uploadFile(file,caseId);
    expect(result).toEqual(response);
  })
  //upload file failure
  it('should call uploadFile fail', async () => {
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
    mockCaseService.uploadFile.mockResolvedValue(response);
    const result = await controller.uploadFile(file,caseId);
    expect(result).toEqual(response);
  })
  //getCaseDocumentBody success
  it('should call getCaseDocumentBody', async () => {
    const documentId = '0698I00000C2bRmQAJ';
    const accountId = '0018I00000C2bRmQAJ';
    const mockResponse = {
      set: jest.fn(),
    } as unknown as Response;
    const mockBlob = new Blob(['mock data'], { type: 'application/pdf' });
    mockCaseService.getCaseDocumentBody.mockResolvedValue(mockBlob);
    const result = await controller.getCaseDocumentBody(documentId,accountId,mockResponse);
    expect(result).toBeInstanceOf(StreamableFile);
    expect(mockResponse.set).toHaveBeenCalledWith({ 'Content-Type': 'application/pdf' });
  })
});

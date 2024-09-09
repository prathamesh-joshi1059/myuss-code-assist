import { Test, TestingModule } from '@nestjs/testing';
import { ZipCodeController } from './zipcode.controller';
import { SfdcBaseService } from '../../../backend/sfdc/services/sfdc-base/sfdc-base.service';
import { ConfigService } from '@nestjs/config';
import { ZipcodeService } from '../../../myuss/services/zipcode/zipcode.service';
import { HttpService } from '@nestjs/axios';
import { LoggerService } from '../../../core/logger/logger.service';
import { ZipcodeFailureResponse, ZipcodeRequest, ZipcodeSuccessResponse } from '../../models/zipcode';
import { SfdcServiceableZipCodeService } from '../../../backend/sfdc/services/sfdc-serviceable-zip-code/sfdc-serviceable-zip-code.service';
import { HttpException } from '@nestjs/common';
import { ZipcodeReqDTO } from './dto/zipcode-req.dto';
describe('ZipCodeController', () => {
  let controller: ZipCodeController;
 

  let mockSfdcService = {
    getQuery: jest.fn(),
    updateSObject: jest.fn(),
    getMetadata: jest.fn(), 
    createSObject : jest.fn(),
    getSObjectByIds: jest.fn()

  };
  let mockConfigService = {
    get: jest.fn(),
  };

  let mockZipcodeService = {
    checkServiceableZipcode: jest.fn(),
  }
  let mockLoggerService = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    log:jest.fn(),
    isProduction:jest.fn(() => {return false}),
  }

  let mockSfdcServiceableZipCodeService = {
    checkServiceableZipcode: jest.fn(),
    getServiceableZipCodeByZIP:jest.fn(),
  }


  //Accessing reuest from zipcode data model class

  let zipcodeSuccessRequest: ZipcodeReqDTO = {
    postalCode: "02446"
  }

  //Accessing success response from zipcode data model class
  let zipcodeSuccessRes: ZipcodeSuccessResponse = {
    isServiceable: true,
    containmentTrayRequiredForRestroom: false
  }

  let successResponse = {
    success: true,
    status: 1000,
    message: 'Success',
    data: zipcodeSuccessRes
  };

  //Accessing failure response from zipcode data model class
  let zipcodeFailureResponse: ZipcodeFailureResponse = {
    isServiceable: false,
    containmentTrayRequiredForRestroom: false
  }

  let failureResponse = {
    success:false,
    status: 1007,
    message: 'This ZIP code is not currently eligible for web orders. Please call 1-800-TOILETS to speak with a representative.',
   data:{}
  };
 
 

 
 
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ZipCodeController],
     providers:[
      SfdcBaseService,
      {
        provide:SfdcServiceableZipCodeService,
        useValue: mockSfdcServiceableZipCodeService,
      },
      {
        provide:SfdcBaseService,
        useValue: mockSfdcService,
      },
      ZipcodeService,
      {
        provide:ZipcodeService,
        useValue:mockZipcodeService,
      },
      ConfigService,
      {
        provide:"",
        useValue:mockConfigService,
      },
      LoggerService,
      {
        provide:"",
        useValue:mockLoggerService
      }

      

     ]
    }).compile();

    controller = module.get<ZipCodeController>(ZipCodeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  //Zipcode - Success Scenario
  it('should return flag true', async () => {
    const SfdcServiceableZipCodeServiceResponse =  {
        totalSize: 1,
        done: true,
        records: [
          {
            attributes: [Object],
            Id: 'a6y8I0000004bqKQAQ',
            Name: 'Service Zip 26087',
            Zip_Code__c: '02446',
            location_code__c: 'FOX',
            Branch_Name__c: 'Foxboro, MA',
            State__c: 'MA',
            City__c: 'BROOKLINE',
            Is_Pilot__c: false,
            Out_of_Footprint__c: false,
            Containment_Tray_Required__c: 'No'
          }
        ]
      };
    mockSfdcServiceableZipCodeService.checkServiceableZipcode.mockResolvedValue(SfdcServiceableZipCodeServiceResponse);
    mockZipcodeService.checkServiceableZipcode.mockResolvedValue(successResponse);


    const result = await controller.checkServiceableZipcode(zipcodeSuccessRequest);
    
    expect(result).toHaveProperty('status', 1000);
  });

  //Zipcode - Fail Scenario
  it('Should return fail message' , async () => {
    mockZipcodeService.checkServiceableZipcode.mockResolvedValue(failureResponse);

    const result = await controller.checkServiceableZipcode(zipcodeSuccessRequest);
   
    expect(result).toHaveProperty('data');
  });
});
  
  
 
 


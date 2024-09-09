import { Test, TestingModule } from '@nestjs/testing';
import { ZipcodeService } from './zipcode.service';
import { SfdcBaseService } from '../../../backend/sfdc/services/sfdc-base/sfdc-base.service';
import { ConfigService } from '@nestjs/config';
import { SfdcServiceableZipCodeService } from '../../../backend/sfdc/services/sfdc-serviceable-zip-code/sfdc-serviceable-zip-code.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { ZipcodeReqDTO } from '../../controllers/zipcode/dto/zipcode-req.dto';
import { ZipcodeRespDto } from '../../controllers/zipcode/dto/zipcode-resp.dto';
import { ApiRespDTO } from '../../../common/dto/api-resp.dto';
import { CacheService } from '../../../core/cache/cache.service';
import { USS_CUSTOMERCARE_PHONE } from '../../../core/utils/constants';


describe('ZipcodeService', () => {
  let service: ZipcodeService;

  // Mock SfdcBase Service
  let mockSfdcBaseService = {
    getQuery: jest.fn(),
  };

  //Mock SfdcServiceableZipCodeService

  let mockSfdcServiceableZipCodeService = {
    checkServiceableZipcode: jest.fn(),
    getServiceableZipCodeByZIP:jest.fn(),
  };
  let mockCacheService ={
    get:jest.fn(),
    set:jest.fn(),
  }

  
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ZipcodeService,          
        ConfigService,
        LoggerService,  
        {
          provide: SfdcBaseService,
          useValue: mockSfdcBaseService,
        },
        {
          provide: SfdcServiceableZipCodeService,
          useValue: mockSfdcServiceableZipCodeService,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        }
        
      ],
    }).compile();

    service = module.get<ZipcodeService>(ZipcodeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  
  // Zipcode Service - Data Not Found Scenario
 
    // Zipcode Service - Success Scenario
    it('Should return USS provides services in this area message', async () => {
      // Arrange
      const request:ZipcodeReqDTO = {
        postalCode: '02446',
      };
  
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
      }
      const ZipcodeRes:ApiRespDTO<any> = {
        
        success: true,
        status: 1000,
        message: 'USS provides services in this area',
        data: 
          {
            isServiceable: true,
            containmentTrayRequiredForRestroom:false
          },

        
      };
      // Act
      mockSfdcServiceableZipCodeService.checkServiceableZipcode.mockResolvedValueOnce(SfdcServiceableZipCodeServiceResponse);
      const result = await service.checkServiceableZipcode(request.postalCode);
      // Assert
      expect(result.data).toMatchObject(ZipcodeRes.data);
      });

      // Zicode Service - Success Scenario - OR condition
      it('Should return USS provides services in this area message', async () => {
        // Arrange
        const request:ZipcodeReqDTO = {
          postalCode: '92116',
        };
    
        const SfdcServiceableZipCodeServiceResponse =   {
          attributes: {
            type: 'Serviceable_Zip_Code__c',
            url: '/services/data/v58.0/sobjects/Serviceable_Zip_Code__c/a6y8I0000004ZLsQAM'
          },
          Id: 'a6y8I0000004ZLsQAM',
          Name: 'Service Zip 16511',
          Zip_Code__c: '92116',
          location_code__c: 'SDO',
          Branch_Name__c: 'San Diego, CA',
          State__c: 'CA',
          City__c: 'SAN DIEGO',
          Is_Pilot__c: false,
          Out_of_Footprint__c: false,
          Containment_Tray_Required__c: 'Yes'
        }
    
        const ZipcodeRes:ApiRespDTO<any> = {
          
          success: true,
          status: 1000,
          message: 'USS provides services in this area',
          data: 
            {
              isServiceable: true,
              containmentTrayRequiredForRestroom:true
            },
  
          
        };
        // Act
        mockSfdcServiceableZipCodeService.checkServiceableZipcode.mockResolvedValueOnce(SfdcServiceableZipCodeServiceResponse);
        const result = await service.checkServiceableZipcode(request.postalCode);
        // Assert
        expect(result.data).toEqual(ZipcodeRes.data);
        });
      // Zipcode Service - Fail Scenario
      it('Should return This ZIP code is not currently eligible for web orders.  Please call 1-800-TOILETS to speak with a representative. message', async () => {
        // Arrange
        const request:ZipcodeReqDTO = {
          postalCode: '41104',
        };
              
          const SfdcServiceableZipCodeServiceResponse = null;
          const ZipcodeRes:ApiRespDTO<any> = {
            success: false,
            status: 1007,
            message: `This ZIP code is not currently eligible for web orders. Please call ${USS_CUSTOMERCARE_PHONE} to speak with a representative.`,
            data: 
              {
                isServiceable: false,
                containmentTrayRequiredForRestroom: null,
              }

            
          };
          // Act
          mockSfdcServiceableZipCodeService.checkServiceableZipcode.mockResolvedValueOnce(SfdcServiceableZipCodeServiceResponse);
          const result = await service.checkServiceableZipcode(request.postalCode);
          // Assert
          expect(result.message).toEqual(ZipcodeRes.message);
          });

          // Zipcode Service - Catch block
          // it('Should return This ZIP code is not currently eligible for web orders.  Please call 1-800-TOILETS to speak with a representative. message', async () => {
          //   // Arrange
          //   const request:ZipcodeReqDTO = {
          //     postalCode: '-0879',
          //   };

          //   const SfdcServiceableZipCodeServiceResponse = {
          //     totalSize: 1,
          //     done: true,
          //     records: [
          //       {
          //         attributes: [Object],
          //         Id: 'a6y8I0000004bqKQAQ',
          //         Name: 'Service Zip 26087',
          //         Zip_Code__c: '02446',
          //         location_code__c: 'FOX',
          //         Branch_Name__c: 'Foxboro, MA',
          //         State__c: 'MA',
          //         City__c: 'BROOKLINE',
          //         Is_Pilot__c: false,
                
          //       }
          //     ]
          //   }
    
             
          //     const ZipcodeRes:ApiRespDTO<any> = {
          //       success: false,
          //       status: 1008,
          //       message: 'An error occurred, please contact 1-888-320-1861-TOILETS.', 
          //       data:{}
                
                
          //     };
          //     // Act
          //     mockSfdcServiceableZipCodeService.checkServiceableZipcode.mockResolvedValueOnce(SfdcServiceableZipCodeServiceResponse);
          //     const result = await service.checkServiceableZipcode(request.postalCode);
          //     // Assert
          //     expect(result.status).toBe(1008);
          //     }
          //     );
        });
   
  

  


           
           
      
          

import { Injectable } from '@nestjs/common';
import { SfdcServiceableZipCodeService } from '../../../backend/sfdc/services/sfdc-serviceable-zip-code/sfdc-serviceable-zip-code.service';
import { ZipcodeRespDto } from '../../controllers/zipcode/dto/zipcode-resp.dto';
import { LoggerService } from '../../../core/logger/logger.service';
import { ApiRespDTO } from '../../../common/dto/api-resp.dto';
import {TIMEMS_CACHE_ZIPCODE, USS_CUSTOMERCARE_MESSAGE, USS_CUSTOMERCARE_PHONE} from '../../../core/utils/constants';
import { CacheService } from '../../../core/cache/cache.service';
@Injectable()
export class ZipcodeService {
  constructor(
    private sfdcServiceableZipCodeService: SfdcServiceableZipCodeService,
    private logger: LoggerService,
    private cacheService: CacheService,
  ) {}
  async checkServiceableZipcode(postalCode: string): Promise<ApiRespDTO<ZipcodeRespDto| Object>> {
    let zipcodeRespObj = new ApiRespDTO();
    let cachedZipcodeRespObj : ApiRespDTO<Object> = await this.cacheService.get(postalCode);
    if(cachedZipcodeRespObj){
      return cachedZipcodeRespObj
    }
    try {
      const serviceableResponse = await this.sfdcServiceableZipCodeService.checkServiceableZipcode(postalCode);
      if (serviceableResponse == undefined || serviceableResponse == null || serviceableResponse.Out_of_Footprint__c === true) {
        zipcodeRespObj = {
          success: false,
          status: 1007,
          message:
            `This ZIP code is not currently eligible for web orders. Please call ${USS_CUSTOMERCARE_PHONE} to speak with a representative.`,
          data: {},
        };
        return zipcodeRespObj;
      }
      zipcodeRespObj = {
        success: true,
        status: 1000,
        message: 'USS provides services in this area',
        data: {
          isServiceable: true,
          containmentTrayRequiredForRestroom:
            serviceableResponse.Containment_Tray_Required__c === 'Yes' ? true : false,
        },
      };
      this.cacheService.set(postalCode, zipcodeRespObj,TIMEMS_CACHE_ZIPCODE);
      return zipcodeRespObj;
    } catch (error) {
      // Log the error for debugging and monitoring purposes
      this.logger.info(`Error in checkServiceableZipcode: ${error.message}`);
      zipcodeRespObj = {
        success: false,
        status: 1008,
        message: USS_CUSTOMERCARE_MESSAGE,
        data: {},
      };
      return zipcodeRespObj;
    }
  }
}
  
        
      
              

          
        

    
    
        
    
        

        
      
      

          
          
        
    
      
        
            
            
        
        
        


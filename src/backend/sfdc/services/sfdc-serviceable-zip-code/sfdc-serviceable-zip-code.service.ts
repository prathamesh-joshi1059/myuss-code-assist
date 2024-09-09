import { Injectable } from '@nestjs/common';
import { SfdcBaseService } from '../sfdc-base/sfdc-base.service';
import { Serviceable_Zip_Code__c } from '../../model/Serviceable_Zip_Code__c';
import { LoggerService } from '../../../../core/logger/logger.service';

@Injectable()
export class SfdcServiceableZipCodeService {

  constructor(private sfdcBaseService: SfdcBaseService, private logger: LoggerService) {}

  async getServiceableZipCodeByZIP(zipCode: string): Promise<Serviceable_Zip_Code__c> {
    const safeZipCode = this.sfdcBaseService.escapeSOQLString(zipCode);
    const soql = `SELECT Id, Name, Zip_Code__c, location_code__c, Containment_Tray_Required__c FROM Serviceable_Zip_Code__c WHERE Zip_Code__c = '${safeZipCode}'`;
    const resp = await this.sfdcBaseService.getQuery(soql);
    if (resp && resp.records && resp.records.length > 0) {
      const serviceableZipCode = new Serviceable_Zip_Code__c();
      serviceableZipCode.Id = resp.records[0].Id;
      serviceableZipCode.Zip_Code__c = resp.records[0].Zip_Code__c;
      serviceableZipCode.location_code__c = resp.records[0].location_code__c;
      serviceableZipCode.Containment_Tray_Required__c = resp.records[0].Containment_Tray_Required__c;
      return serviceableZipCode;
    }
    return null;
  }
  async checkServiceableZipcode(postalCode: string): Promise<Serviceable_Zip_Code__c> {
    const serviceableZipCode = await this.sfdcBaseService.conn.
    sobject('Serviceable_Zip_Code__c')
    .select(`Id, 
          Name,
          Zip_Code__c, 
          Location_Code__c, 
          Branch_Name__c, 
          State__c, 
          City__c, 
          Is_Pilot__c, 
          Out_of_Footprint__c,
          Containment_Tray_Required__c`)
    .where({ Zip_Code__c: postalCode })
    .limit(1)
    .execute();
    if(serviceableZipCode && serviceableZipCode.length > 0){
      const zipcodeObj = new Serviceable_Zip_Code__c();
      zipcodeObj.Id = serviceableZipCode[0].Id;
      zipcodeObj.Zip_Code__c = serviceableZipCode[0].Zip_Code__c;
      zipcodeObj.Containment_Tray_Required__c = serviceableZipCode[0].Containment_Tray_Required__c;
      zipcodeObj.location_code__c = serviceableZipCode[0].Location_Code__c;
      zipcodeObj.Out_of_Footprint__c = serviceableZipCode[0].Out_of_Footprint__c;
      this.logger.info('Final zipcode response obj', JSON.stringify(zipcodeObj));
      return zipcodeObj;
    }
    else{
      return null;
    }
  }
}

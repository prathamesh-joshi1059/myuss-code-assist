import { Injectable } from '@nestjs/common';
import { SfdcBaseService } from '../sfdc-base/sfdc-base.service';
import { Serviceable_Zip_Code__c } from '../../model/Serviceable_Zip_Code__c';
import { LoggerService } from '../../../../core/logger/logger.service';

@Injectable()
export class SfdcServiceableZipCodeService {
  constructor(private sfdcBaseService: SfdcBaseService, private logger: LoggerService) {}

  async getServiceableZipCodeByZIP(zipCode: string): Promise<Serviceable_Zip_Code__c | null> {
    const safeZipCode = this.sfdcBaseService.escapeSOQLString(zipCode);
    const soql = `SELECT Id, Name, Zip_Code__c, location_code__c, Containment_Tray_Required__c FROM Serviceable_Zip_Code__c WHERE Zip_Code__c = '${safeZipCode}'`;
    const resp = await this.sfdcBaseService.getQuery(soql);
    
    if (resp?.records?.length) {
      const record = resp.records[0];
      return Object.assign(new Serviceable_Zip_Code__c(), {
        Id: record.Id,
        Zip_Code__c: record.Zip_Code__c,
        location_code__c: record.location_code__c,
        Containment_Tray_Required__c: record.Containment_Tray_Required__c,
      });
    }
    
    return null;
  }

  async checkServiceableZipcode(postalCode: string): Promise<Serviceable_Zip_Code__c | null> {
    const serviceableZipCode = await this.sfdcBaseService.conn
      .sobject('Serviceable_Zip_Code__c')
      .select(
        `Id,
         Name,
         Zip_Code__c, 
         Location_Code__c, 
         Branch_Name__c, 
         State__c, 
         City__c, 
         Is_Pilot__c, 
         Out_of_Footprint__c,
         Containment_Tray_Required__c`
      )
      .where({ Zip_Code__c: postalCode })
      .limit(1)
      .execute();
    
    if (serviceableZipCode.length) {
      const record = serviceableZipCode[0];
      const zipcodeObj = Object.assign(new Serviceable_Zip_Code__c(), {
        Id: record.Id,
        Zip_Code__c: record.Zip_Code__c,
        Containment_Tray_Required__c: record.Containment_Tray_Required__c,
        location_code__c: record.Location_Code__c,
        Out_of_Footprint__c: record.Out_of_Footprint__c,
      });
      this.logger.info('Final zipcode response obj', JSON.stringify(zipcodeObj));
      return zipcodeObj;
    }
    
    return null;
  }
}
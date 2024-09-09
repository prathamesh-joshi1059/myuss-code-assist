import { Injectable } from '@nestjs/common';
import { SfdcBaseService } from '../sfdc-base/sfdc-base.service';
import { ServiceTerritory } from '../../model/ServiceTerritory';

@Injectable()
export class SfdcServiceTerritoryService {
  constructor(private sfdcBaseService: SfdcBaseService) {}

  async getBranchLevelTerritories(): Promise<ServiceTerritory[]> {
    const territories = await this.sfdcBaseService.conn.sobject('ServiceTerritory')
    .select('Id, Service_Branch_Id__c, Name, Area_Name__c, Sales_Area__c')
    .where({
      IsActive: true,
      FSL_Serviceable__c: true
    })
    .execute();
    if (territories?.length === 0) {
      return null;
    }
    return territories.map((territory) => {
      const t = new ServiceTerritory();
      t.Id = territory.Id;
      t.Name = territory.Name;
      t.Service_Branch_Id__c = territory.Service_Branch_Id__c;
      t.Area_Name__c = territory.Area_Name__c;
      t.Sales_Area__c = territory.Sales_Area__c;
      return t;
    });
  }
}

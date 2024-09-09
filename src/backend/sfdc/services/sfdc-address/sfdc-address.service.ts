import { Injectable } from '@nestjs/common';
import { SfdcBaseService } from '../sfdc-base/sfdc-base.service';
import { USF_Address__c } from '../../model/USF_Address__c';
import { SFDC_Response } from '../../model/SFDC_Response';
import { LoggerService } from '../../../../core/logger/logger.service';
import { SFDC_AddressMapper } from '../../../../myuss/mappers/salesforce/address.mapper';
import { Address } from '../../../../myuss/models';

@Injectable()
export class SfdcAddressService {
  constructor(private sfdcBaseService: SfdcBaseService, private logger: LoggerService) {}

  async createAddress(address: USF_Address__c): Promise<SFDC_Response> {
    const addAddressDetailsResult = await this.sfdcBaseService.conn.create(
      'USF_Address__c',
      address,
      function (err, ret) {
        if (err || !ret.success) {
          console.log(err)
          return console.error(err, ret);
        }
        return ret.id;
      },
    );
    const addAddressDetailsRespModel = new SFDC_Response();
    Object.assign(addAddressDetailsRespModel, addAddressDetailsResult);
    return addAddressDetailsRespModel;
  }
  async updateAddress(address: USF_Address__c): Promise<SFDC_Response> {
    try{
      const addAddressDetailsResult = await this.sfdcBaseService.updateSObject(
        'USF_Address__c',
        address
      );
      const addAddressDetailsRespModel = new SFDC_Response();
      Object.assign(addAddressDetailsRespModel, addAddressDetailsResult);
      return addAddressDetailsRespModel;
    }catch(err){
      this.logger.error(err);
      return {
        success: false,
        id: null,
        errors: err
      }
    }
  }

  async getAddressesForAccount(accountId: string,type ='parent') {
    let soql =  `Id, USF_Account__c, USF_Street__c, USF_City__c, USF_State__c, USF_Zip_Code__c, Address_Latitude_Longitude__c, 
    Is_Primary__c, USF_Bill_To_Address__c, USF_Ship_To_Address__c, NF_Is_Parent__c, GeoCode_Accuracy__c,
    Address_Validated__c, Site_Name__c, NF_Site_Hours_Start_Time__c, NF_Site_Hours_End_Time__c, NF_Arrival_Start_Time__c, 
    NF_Arrival_End_Time__c, NF_Gate_Code__c, NF_Access_instructions__c, NF_Key_Instructions__c, NF_Other_Instructions__c, 
    NF_Placement__c,Address_Latitude_Longitude__Latitude__s,Address_Latitude_Longitude__Longitude__s`
    let soqlCondition;
    if (type === 'all') {
      soqlCondition = { USF_Account__c: accountId };
    } else if (type === 'child') {
      soqlCondition = { USF_Account__c: accountId, NF_Is_Parent__c: false };
    } else if (type === 'parent') {
      soqlCondition = { USF_Account__c: accountId, NF_Is_Parent__c: true };
    } else {
      soqlCondition = { USF_Account__c: accountId, NF_Is_Parent__c: true };
    }
    const address: USF_Address__c[] = await this.sfdcBaseService.conn
      .sobject('USF_Address__c')
      .select(soql)
      .where(soqlCondition)
      .limit(1000)
      .execute();
    return address;
  }
  async getChildAddress(addressId: string,accountId: string) {
    const address: USF_Address__c[] = await this.sfdcBaseService.conn
      .sobject('USF_Address__c')
      .select(`Id, USF_Account__c, USF_Street__c, USF_City__c, USF_State__c, USF_Zip_Code__c, Address_Latitude_Longitude__c, 
      Is_Primary__c, USF_Bill_To_Address__c, USF_Ship_To_Address__c, NF_Is_Parent__c, GeoCode_Accuracy__c,
      Address_Validated__c, Site_Name__c, NF_Site_Hours_Start_Time__c, NF_Site_Hours_End_Time__c, NF_Arrival_Start_Time__c, 
      NF_Arrival_End_Time__c, NF_Gate_Code__c, NF_Access_instructions__c, NF_Key_Instructions__c, NF_Other_Instructions__c, 
      NF_Placement__c,Address_Latitude_Longitude__Latitude__s,Address_Latitude_Longitude__Longitude__s`)
      .where({ 'NF_Parent_USF_Address__c': addressId, 'USF_Account__c': accountId})
      .limit(1000)
      .execute();
    return address;
  }
  async getAddressesByAddressValue(accountId: string, enteredAddress: string): Promise<USF_Address__c[]> {
    const address: USF_Address__c[] = await this.sfdcBaseService.conn.sobject('USF_Address__c')
      .select('Id, USF_Account__c, USF_Street__c, USF_City__c, USF_State__c, USF_Zip_Code__c, Address_Latitude_Longitude__c, Is_Primary__c, Address_Validated__c, Site_Name__c, NF_Site_Hours_Start_Time__c, NF_Site_Hours_End_Time__c, NF_Arrival_Start_Time__c, NF_Arrival_End_Time__c, NF_Gate_Code__c, NF_Access_instructions__c, NF_Key_Instructions__c, NF_Other_Instructions__c, NF_Placement__c,Address_Latitude_Longitude__Latitude__s,Address_Latitude_Longitude__Longitude__s,USF_Ship_To_Address__c')
      .where({ USF_Account__c: accountId, USF_Street__c: enteredAddress })
      .execute();
    return address;
  }
  addSubSiteAddressDetails(addressDetailsModel: Address) : USF_Address__c {
    const startTime = addressDetailsModel.startTime?.length < 12  ? 
           null : addressDetailsModel.startTime;
    const endTime =addressDetailsModel.endTime?.length < 12 ?
          null : addressDetailsModel.endTime;
    const addressModel = new Address();
    addressModel.id = addressDetailsModel.id? addressDetailsModel.id : null;
    addressModel.accountId = addressDetailsModel.accountId;
    addressModel.name = addressDetailsModel.siteName;
    addressModel.siteName = addressDetailsModel.siteName;
    addressModel.street = addressDetailsModel.street;
    addressModel.city = addressDetailsModel.city;
    addressModel.state = addressDetailsModel.state;
    addressModel.zipcode = addressDetailsModel.zipcode;
    addressModel.country = addressDetailsModel.country;
    addressModel.addressValidated = true;
    addressModel.instructions = addressDetailsModel.instructions? addressDetailsModel.instructions : null;
    addressModel.isShippingAddress = addressDetailsModel.shipToAddress? addressDetailsModel.shipToAddress : false;
    addressModel.isParentAddress = addressDetailsModel.parentRefId == addressDetailsModel.id ? true : false;
    addressModel.parentRefId = addressDetailsModel.parentRefId != addressDetailsModel.id ? addressDetailsModel.parentRefId : null;
    addressModel.shipToContactRefId = addressDetailsModel.shipToContactRefId? addressDetailsModel.shipToContactRefId : null;
    addressModel.siteContactRefId = addressDetailsModel.siteContactRefId? addressDetailsModel.siteContactRefId : null;
    addressModel.startTime = startTime;
    addressModel.endTime = endTime;
    
    return SFDC_AddressMapper.getSFDCAddressFromMyUSSAddress(addressModel); 
  }
}

import { USF_Address__c } from '../../../backend/sfdc/model/USF_Address__c';
import { Address } from '../../models/address.model';
import { SFDC_ContactMapper } from './contact.mapper';

export class SFDC_AddressMapper {
  public static getMyUSSAddressFromSFDCAddress(sfdcUSFAddress: USF_Address__c): Address {
    const address = new Address();
    address.id = sfdcUSFAddress.Id;
    address.accountId = sfdcUSFAddress.USF_Account__c;
    address.name = sfdcUSFAddress.Name;
    address.street = sfdcUSFAddress.USF_Street__c;
    address.city = sfdcUSFAddress.USF_City__c;
    address.state = sfdcUSFAddress.USF_State__c;
    address.zipcode = sfdcUSFAddress.USF_Zip_Code__c;
    address.country = sfdcUSFAddress.USF_Country__c;
    address.latitude = sfdcUSFAddress.Address_Latitude_Longitude__Latitude__s;
    address.longitude = sfdcUSFAddress.Address_Latitude_Longitude__Longitude__s;
    address.addressValidated = sfdcUSFAddress.Address_Validated__c;
    address.placementNotes = sfdcUSFAddress.NF_Placement__c;
    address.startTime = sfdcUSFAddress.NF_Site_Hours_Start_Time__c;
    address.endTime = sfdcUSFAddress.NF_Site_Hours_End_Time__c;
    address.instructions = sfdcUSFAddress.NF_Placement__c;
    address.information = sfdcUSFAddress.Additional_Information__c;
    address.geocodeAccuracy = sfdcUSFAddress.GeoCode_Accuracy__c;
    address.siteName = sfdcUSFAddress.Site_Name__c;
    address.gateCode = sfdcUSFAddress.NF_Gate_Code__c;
    // TODO: create the Contact mapper
    address.siteContact =
      sfdcUSFAddress.NF_Site_Contact__r == undefined
        ? null
        : SFDC_ContactMapper.getMyUSSContactFromSFDCContact(sfdcUSFAddress.NF_Site_Contact__r);
    address.secondarySiteContact =
      sfdcUSFAddress.NF_Secondary_Site_Contact__r == undefined
        ? null
        : SFDC_ContactMapper.getMyUSSContactFromSFDCContact(sfdcUSFAddress.NF_Secondary_Site_Contact__r);
    address.shipToContact =
      sfdcUSFAddress.NF_Ship_To_Contact__r == undefined
        ? null
        : SFDC_ContactMapper.getMyUSSContactFromSFDCContact(sfdcUSFAddress.NF_Ship_To_Contact__r);
    address.isShippingAddress = sfdcUSFAddress.USF_Ship_To_Address__c;
    address.isBillingAddress = sfdcUSFAddress.USF_Bill_To_Address__c;
    address.isParentAddress = sfdcUSFAddress.NF_Is_Parent__c;
    address.placementNotes = sfdcUSFAddress.NF_Placement__c;
    address.idRequired = sfdcUSFAddress.NF_Background_Check__c;
    address.clearanceRequired = sfdcUSFAddress.NF_Clearance_Required__c;
    return address;
  }
  public static getSFDCAddressFromMyUSSAddress(address: Address): USF_Address__c {
    const sfdcAddress = new USF_Address__c();
    sfdcAddress.Id = address.id;
    sfdcAddress.USF_Account__c = address.accountId;
    sfdcAddress.Name = address.name;
    sfdcAddress.Site_Name__c = address.siteName;
    sfdcAddress.USF_Street__c = address.street;
    sfdcAddress.USF_City__c = address.city;
    sfdcAddress.USF_State__c = address.state;
    sfdcAddress.USF_Zip_Code__c = address.zipcode;
    sfdcAddress.USF_Country__c = address.country;
    sfdcAddress.Address_Latitude_Longitude__Latitude__s = address.latitude;
    sfdcAddress.Address_Latitude_Longitude__Longitude__s = address.longitude;
    sfdcAddress.Address_Validated__c = address.addressValidated;
    sfdcAddress.NF_Placement__c = address.placementNotes;
    sfdcAddress.NF_Site_Hours_End_Time__c = address.endTime;
    sfdcAddress.NF_Site_Hours_Start_Time__c = address.startTime;
    sfdcAddress.GeoCode_Accuracy__c = address.geocodeAccuracy;
    // billing and primary should be the same
    sfdcAddress.Is_Primary__c = address.isBillingAddress;
    sfdcAddress.USF_Bill_To_Address__c = address.isBillingAddress;
    sfdcAddress.USF_Ship_To_Address__c = address.isShippingAddress;
    sfdcAddress.NF_Parent_USF_Address__c = address.parentRefId;
    sfdcAddress.NF_Is_Parent__c = address.isParentAddress;
    sfdcAddress.NF_Ship_To_Contact__c = address.shipToContactRefId;
    sfdcAddress.NF_Site_Contact__c = address.siteContactRefId;
    sfdcAddress.NF_Placement__c = address.instructions;
    
    // not mapping contacts here, that may need to be done elsewhere when appropriate
    return sfdcAddress;
  }
}

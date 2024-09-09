import { NF_Asset_Location__c } from '../../../backend/sfdc/model/NF_Asset_Location__c';
import { AssetLocations } from '../../models/asset-location.model';

export class SFDC_AssetLocation {
  static getMyUSSAssetLocationFromSFDCAssetLocation(sfdcAssetLocation: NF_Asset_Location__c) {
    const assetLocation = new AssetLocations();
    assetLocation.id = sfdcAssetLocation.Id;

    assetLocation.name = sfdcAssetLocation.Name;
    assetLocation.startDate = sfdcAssetLocation.NF_Start_Date__c;
    assetLocation.endDate = sfdcAssetLocation.NF_End_Date__c;
    assetLocation.assetId = sfdcAssetLocation.NF_Subscription_Product__r?.Id;
    assetLocation.assetName = sfdcAssetLocation.NF_Subscription_Product__r?.Description;
    assetLocation.serviceName = sfdcAssetLocation.NF_Service_Product__r?.Description;
    assetLocation.serviceId = sfdcAssetLocation.NF_Service_Product__r?.Id;
    assetLocation.subscriptionProductId = sfdcAssetLocation.NF_Subscription_Product__r?.Id;
    assetLocation.serviceProductId = sfdcAssetLocation.NF_Service_Product__r?.Id;
    assetLocation.quantity = sfdcAssetLocation.NF_Quantity__c;
    assetLocation.parentAddress = sfdcAssetLocation.NF_Placed_Jobsite__r.NF_Parent_USF_Address__r
      ? sfdcAssetLocation.NF_Placed_Jobsite__r.NF_Parent_USF_Address__r.Site_Name__c
      : sfdcAssetLocation.NF_Placed_Jobsite__r.NF_Site_Name_Address__c;
    assetLocation.siteAddress = sfdcAssetLocation.NF_Placed_Jobsite__r.NF_Site_Name_Address__c;
    assetLocation.placementNote = sfdcAssetLocation.NF_Placed_Jobsite__r.NF_Placement__c;
    assetLocation.jobsiteId = sfdcAssetLocation.NF_Placed_Jobsite__r.Id;
    assetLocation.unitNumber = sfdcAssetLocation.NF_Asset_Serial_Number__c || '';
    assetLocation.numberOfServices = sfdcAssetLocation.NF_Service_Product__r?.Number_of_Services__c;
    assetLocation.servicePrice = sfdcAssetLocation.NF_Service_Subscription__r?.Price_Override__c;
    assetLocation.isServiceContractedPrice =
      sfdcAssetLocation.NF_Service_Subscription__r?.SBQQ__QuoteLine__r?.IS2PContractedPrice__c;

    return assetLocation;
  }

  static getMyUSSAssetLocationBySerialNumberFromSFDCAssetLocation(sfdcAssetLocation: NF_Asset_Location__c) {
    const assetLocation = new AssetLocations();
    assetLocation.parentAddress = sfdcAssetLocation.NF_USS_Order__r.Ship_To__c;
    assetLocation.startDate = sfdcAssetLocation.NF_USS_Order__r.StartDate;
    assetLocation.endDate = sfdcAssetLocation.NF_USS_Order__r.EndDate;
    assetLocation.assetId = sfdcAssetLocation.NF_Asset__c;
    assetLocation.siteAddress = sfdcAssetLocation.NF_Placed_Jobsite__r.Name;
    assetLocation.placementNote = sfdcAssetLocation.NF_Placed_Jobsite__r.NF_Placement__c;
    assetLocation.bundleName = sfdcAssetLocation.NF_Bundle_Subscription_Original__r.SBQQ__Product__r.Name;
    assetLocation.serviceName = sfdcAssetLocation.NF_Service_Product__r?.Name;
    assetLocation.orderNumber = sfdcAssetLocation.NF_USS_Order__r.Global_Order_Number__c;
    assetLocation.contractId = sfdcAssetLocation.NF_USS_Order__r.Id;
    assetLocation.assetName = sfdcAssetLocation.NF_Subscription_Product__r?.Description;
    assetLocation.unitNumber = sfdcAssetLocation.NF_Asset_Serial_Number__c;
    assetLocation.subscriptionProductId = sfdcAssetLocation.NF_Bundle_Subscription_Original__r.Id;
    assetLocation.siteAddressId = sfdcAssetLocation.NF_Placed_Jobsite__r.Id;
    assetLocation.orderStatus = sfdcAssetLocation.NF_USS_Order__r.Status;
    assetLocation.numberOfServices = sfdcAssetLocation.NF_Service_Product__r?.Number_of_Services__c;
    assetLocation.servicePrice = sfdcAssetLocation.NF_Service_Subscription__r?.Price_Override__c;
    //Commented as Pricing_Type__c not availabe at higher SF enviroment
    // assetLocation.pricingType = sfdcAssetLocation.NF_Service_Subscription__r.Pricing_Type__c;

    return assetLocation;
  }
}

import { NF_Quoted_Jobsite__c } from '../../../backend/sfdc/model/NF_Quoted_Jobsite__c';
import { JobSites, QuotedJobsite, SubSite } from '../../../myuss/models/quote.model';
import { SFDC_AddressMapper } from './address.mapper';
import { SFDC_ContactMapper } from './contact.mapper';

export class SFDC_QuotedJobSitesMapper {
  static getMyUSSQuotedJobSitesFromSFDCQuotedJobSites(sfdcUSFQuotedJobSites: NF_Quoted_Jobsite__c[]): JobSites[] {
    let jobSites: JobSites[] = [];

    sfdcUSFQuotedJobSites['records'].forEach((sfQuoteJobsite) => {
      const quotedJobSite = new JobSites();
      quotedJobSite.id = sfQuoteJobsite.Id;
      quotedJobSite.siteName = sfQuoteJobsite.NF_Site_Name__c;
      quotedJobSite.name = sfQuoteJobsite.Name;
      quotedJobSite.placedProductName = sfQuoteJobsite.NF_Aggregated_Product_Name__c;
      quotedJobSite.address = SFDC_AddressMapper.getMyUSSAddressFromSFDCAddress(sfQuoteJobsite.NF_USF_Address__r);
      quotedJobSite.contact = sfQuoteJobsite.NF_Contact__r? SFDC_ContactMapper.getMyUSSContactFromSFDCContact(sfQuoteJobsite.NF_Contact__r): null
      quotedJobSite.quantityQuoted = sfQuoteJobsite.NF_Quantity_Quoted__c;
      quotedJobSite.quoteLineId = sfQuoteJobsite.NF_Quote_Line__c;
      jobSites.push(quotedJobSite);
    });
    return jobSites;
  }
  static getSFDCQuotedJobSitesFromMyUSSQuotedJobSites(jobSites: SubSite[]): NF_Quoted_Jobsite__c[] {
    let sfdcUSFQuotedJobSites: NF_Quoted_Jobsite__c[] = [];
    jobSites.forEach(site => {
      const quotedJobSite = new NF_Quoted_Jobsite__c();
      quotedJobSite.Name = site.name;
      quotedJobSite.NF_Quote__c = site.quoteId;
      quotedJobSite.NF_End_Date__c = site.endDate;
      quotedJobSite.NF_Start_Date__c = site.startDate;
      quotedJobSite.NF_Quote_Line__c = site.quoteLineId;
      quotedJobSite.NF_USF_Address__c = site.addressId;
      quotedJobSite.NF_Aggregated_Product_Name__c = site.productName;
      quotedJobSite.NF_Asset_Product__c = site.assetId;
      quotedJobSite.NF_Frequency_Product__c = site.serviceId;
      quotedJobSite.NF_PreOrder_Flow_Complete__c = site.preOrderFlowComplete;
      quotedJobSite.NF_Quantity_Quoted__c = site.quantity;
      quotedJobSite.NF_Site_Name__c = site.siteName;
      sfdcUSFQuotedJobSites.push(quotedJobSite);  
    });
    return sfdcUSFQuotedJobSites;
  }
}

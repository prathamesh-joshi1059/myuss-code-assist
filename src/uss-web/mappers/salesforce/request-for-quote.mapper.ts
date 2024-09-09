import { CreateDto_Request_for_Quote__c } from "../../../backend/sfdc/services/sfdc-rfq/dto/CreateDto_Request_for_Quote__c";
import { Request_for_Quote__c } from "../../../backend/sfdc/model/Request_for_Quote__c";

import { MyUSSEligibilityResult } from "../../models/myuss-eligibility";
import { RFQProduct, RequestForQuote, SKUs } from "../../models/request-for-quote.model";
import { Product } from "../../controllers/rfq/dto/create-web-rfq.dto";

import { RFQHelper } from "../../services/rfq/rfq.helper";

export class SFDC_RFQMapper {
  static mapFromSalesforceRequestForQuote(sfdcRFQ: Request_for_Quote__c): RequestForQuote {
    const rfq = new RequestForQuote();
    rfq.id = sfdcRFQ.RFQ_ID__c;
    rfq.formStatus = sfdcRFQ.RFQ_Form_Status__c;
    rfq.sentToMarketingCloud = sfdcRFQ.Sent_to_Marketing_Cloud__c;
    rfq.smsOptIn = sfdcRFQ.SMS_Opt_In__c;
    rfq.companyName = sfdcRFQ.Company_Name__c;
    rfq.firstName = sfdcRFQ.First_Name__c;
    rfq.lastName = sfdcRFQ.Last_Name__c;
    rfq.phoneNumber = sfdcRFQ.Phone_Number__c;
    rfq.emailAddress = sfdcRFQ.Email_Address__c;
    rfq.startDate = sfdcRFQ.Start_Date__c;
    rfq.endDate = sfdcRFQ.End_Date__c;
    rfq.deliveryZipCode = sfdcRFQ.Delivery_Zip_Code__c;
    rfq.purposeOfRental = sfdcRFQ.Purpose_of_Rental__c;
    rfq.useType = sfdcRFQ.Use_Type__c;
    rfq.rentalDuration = sfdcRFQ.Rental_Duration__c;
    rfq.myUssEligible = sfdcRFQ.MyUSS_Eligible__c;
    rfq.myUssEligibilityDetails = this.parseJSONSafely(sfdcRFQ.RFQ_ID__c, sfdcRFQ.MyUSS_Eligibility_Details__c);
    rfq.myUssEligibilityError = sfdcRFQ.MyUSS_Eligibility_Error__c;
    rfq.myUssExistingUser = sfdcRFQ.MyUSS_Existing_User__c;
    rfq.lastClickId = sfdcRFQ.Last_Click_ID__c;
    rfq.utmValues = sfdcRFQ.UTM_Values__c;
    rfq.googleAnalyticsId = sfdcRFQ.Google_Analytics_ID__c;
    rfq.products = [];
    const specialtyProducts = this.parseJSONSafely(sfdcRFQ.RFQ_ID__c, sfdcRFQ.Specialty_Products__c);
    if (specialtyProducts && specialtyProducts.length && specialtyProducts.length > 0) {
      rfq.products = rfq.products.concat(specialtyProducts);
    }
    const standardProducts = this.parseJSONSafely(sfdcRFQ.RFQ_ID__c, sfdcRFQ.Standard_Products__c);
    if (standardProducts && standardProducts.length && standardProducts.length > 0) {
      rfq.products = rfq.products.concat(standardProducts);
    }
    rfq.products = this.addSKUsToProducts(rfq.products);
    return rfq;
  }

  static parseJSONSafely(rfqId: string, input: string): any {;
    let result = null;
    try {
      result = JSON.parse(input);
    } catch (error) {
      console.error(`error parsing JSON from SFDC RFQ: ${rfqId}`, error);
    }
    return result || null;
  }

  static addSKUsToProducts(products: RFQProduct[]): RFQProduct[] {
    const rfqProducts = [];
    products.forEach((product) => {
      const skus = this.mapWebProductToSKUs(product);
      product.skus = skus;
      rfqProducts.push(product);
    });
    return rfqProducts;
  }

  static mapWebProductToSKUs(product: RFQProduct): SKUs {
    const productCode = product.code;
    let skus = this.productMap[productCode] as SKUs;
    if (!skus) {
      return new SKUs();
    } else {
      return skus;
    }
  }

  static mapWebRFQToSalesforceRFQ(rfq: RequestForQuote, eligibility: MyUSSEligibilityResult): CreateDto_Request_for_Quote__c {
    const salesforceRFQ = new CreateDto_Request_for_Quote__c();
    salesforceRFQ.RFQ_Form_Status__c = rfq.formStatus;
    salesforceRFQ.SMS_Opt_In__c = rfq.smsOptIn;
    salesforceRFQ.Sent_to_Marketing_Cloud__c = rfq.sentToMarketingCloud; 
    const companyName =  rfq.companyName ||
      rfq.firstName + ' ' + rfq.lastName;
    salesforceRFQ.Company_Name__c = companyName?.substring(0,255);
    salesforceRFQ.First_Name__c = rfq.firstName?.substring(0,255);
    salesforceRFQ.Last_Name__c = rfq.lastName?.substring(0,255);
    salesforceRFQ.Phone_Number__c = rfq.phoneNumber?.substring(0,50);
    salesforceRFQ.Email_Address__c = rfq.emailAddress?.substring(0,255);
    salesforceRFQ.Start_Date__c = rfq.startDate ? new Date(rfq.startDate) : null;
    salesforceRFQ.End_Date__c = rfq.endDate ? new Date(rfq.endDate) : null;
    salesforceRFQ.Rental_Duration__c = this.mapWebRentalDurationToSFRentalDuration(rfq.rentalDuration);
    salesforceRFQ.Purpose_of_Rental__c = this.mapWebRentalPurposeToSFRentalPurpose(rfq.purposeOfRental);
    salesforceRFQ.Use_Type__c = this.mapWebKindOfUseToSFUseType(
      rfq.useType,
    );
    salesforceRFQ.Delivery_Zip_Code__c = rfq.deliveryZipCode?.substring(0,100);
    salesforceRFQ.RFQ_ID__c = rfq.id;
    salesforceRFQ.Last_Click_ID__c = rfq.lastClickId?.substring(0,255);
    salesforceRFQ.UTM_Values__c = rfq.utmValues?.substring(0,255);
    salesforceRFQ.Google_Analytics_ID__c = rfq.googleAnalyticsId?.substring(0,255);
    if (rfq.products && rfq.products.length > 0) {
      salesforceRFQ.Standard_Products__c = JSON.stringify(rfq.products.filter(product => product.productType === 'standard'));
      // if there's no product type, assume it's a specialty product
      salesforceRFQ.Specialty_Products__c = JSON.stringify(rfq.products.filter(product => !product.productType || product.productType !== 'standard'));
    }
    salesforceRFQ.MyUSS_Eligible__c = eligibility.eligible;
    salesforceRFQ.MyUSS_Eligibility_Details__c = JSON.stringify(eligibility.rule_results)?.substring(0,4000);
    salesforceRFQ.MyUSS_Eligibility_Error__c = eligibility.error ? eligibility.error?.substring(0,2000) : '';
    salesforceRFQ.MyUSS_Existing_User__c = eligibility.existing_myuss_user;
    salesforceRFQ.Lead__c = rfq.leadId;
    // salesforceRFQ.Account__c = rfq.accountId;
    salesforceRFQ.ProbabilityModel__c = rfq.probabilityModel?.substring(0,100);
    salesforceRFQ.Win_Probability__c = rfq.winProbability * 100;
    salesforceRFQ.Priority_Group__c = rfq.priorityGroup?.substring(0,100);
    return salesforceRFQ;
  }

  static mapWebRentalDurationToSFRentalDuration(
    webRentalDuration: string,
  ): 'Under 7 Days' | '0 to 2 Months' | '3 to 5 Months' | '6+ Months' {
    switch (webRentalDuration) {
      case 'Under 7 Days':
        return 'Under 7 Days';
      case '0 to 2 Months':
        return '0 to 2 Months';
      case '3 to 5 Months':
        return '3 to 5 Months';
      case '6+ Months':
        return '6+ Months';
      default:
        return null;
    }
  }

  static mapWebRentalPurposeToSFRentalPurpose(
    webRentalPurpose: string,
  ): 'Business' | 'Personal' | 'Government' {
    if (['Business','Personal','Government'].includes(webRentalPurpose)) {
      //@ts-ignore
      return webRentalPurpose;
    }
    switch (webRentalPurpose) {
      case 'business':
        return 'Business';
      case 'personal':
        return 'Personal';
      case 'government':
        return 'Government';
      default:
        return;
    }
  }

  static mapWebKindOfUseToSFUseType(
    webKindOfUse: string,
  ): 'Construction' | 'Event' | 'Other' {
    if (['Construction','Event','Other'].includes(webKindOfUse)) {
      //@ts-ignore
      return webKindOfUse;
    }
    switch (webKindOfUse) {
      case 'construction':
        return 'Construction';
      case 'event':
        return 'Event';
      case 'other':
        return 'Other';
      default:
        return null;
    }
  }

  private static productMap = {
    // reference: https://unitedsiteservices.sharepoint.com/:x:/r/sites/DigitalMarketing/Shared%20Documents/General/RFQ%20Form/2023-10-10%20Products_v3.xlsx?d=wfd9a447f0d424ce292d0d83e0e96fedf&csf=1&web=1&e=8VZ9Ss
    // first handle the summary-level products
    'porta-potty-rentals': {bundleSKU: '110-0000', assetSKU: '111-1001', serviceSKU: '112-2001'},
    'hand-washing': {bundleSKU: '120-0000', assetSKU: '121-1102', serviceSKU: '122-2001'},
    'holding-tanks': {bundleSKU: '130-0000', assetSKU: '131-1304', serviceSKU: '132-2001'},
    'portable-restroom-trailers-rental': {bundleSKU: '', assetSKU: '', serviceSKU: ''},
    'roll-off-dumpsters': {bundleSKU: '', assetSKU: '', serviceSKU: ''},
    'shower-trailers': {bundleSKU: '', assetSKU: '', serviceSKU: ''},
    'temporary-fence-rentals': {bundleSKU: '', assetSKU: '', serviceSKU: ''},
    'temporary-power-services': {bundleSKU: '', assetSKU: '', serviceSKU: ''},
    'other-services': {bundleSKU: '', assetSKU: '', serviceSKU: ''},
    'uncategorized': {bundleSKU: '', assetSKU: '', serviceSKU: ''},
    // then handle the individual products
    '91329': {bundleSKU: '120-0000', assetSKU: '121-1202', serviceSKU: '122-2001'}, //3 Compartment Hot-Cold Sink
    '93069': {bundleSKU: '120-0000', assetSKU: '121-1102', serviceSKU: '122-2001'}, //Portable Sink Rental
    '93070': {bundleSKU: '120-0000', assetSKU: '121-1302', serviceSKU: '122-2001'}, //Hand Sanitizer Stand Rental
    '93074': {bundleSKU: '130-0000', assetSKU: '131-1304', serviceSKU: '132-2001'}, //Waste Holding Tank Rentals
    '93075': {bundleSKU: '130-0000', assetSKU: '131-1004', serviceSKU: '132-2001'}, //Water Holding Tanks
    '93079': {bundleSKU: '', assetSKU: '', serviceSKU: ''}, //Office Trailer Restrooms
    '93080': {bundleSKU: '', assetSKU: '', serviceSKU: ''}, //Ambient Pump System
    '93083': {bundleSKU: '', assetSKU: '', serviceSKU: ''}, //Septic System Service
    '93131': {bundleSKU: '', assetSKU: '', serviceSKU: ''}, //Grease Trap Service
    '93059': {bundleSKU: '110-0000', assetSKU: '211-1024', serviceSKU: ''}, //Platinum Series
    '93060': {bundleSKU: '110-0000', assetSKU: '211-1012', serviceSKU: ''}, //Gold Series
    '93061': {bundleSKU: '110-0000', assetSKU: '211-1032', serviceSKU: ''}, //Silver Series
    '93062': {bundleSKU: '110-0000', assetSKU: '111-1601', serviceSKU: ''}, //VIP Solar Restrooms
    '93063': {bundleSKU: '110-0000', assetSKU: '211-1042', serviceSKU: ''}, //ADA Series
    '93064': {bundleSKU: '110-0000', assetSKU: '211-1012', serviceSKU: ''}, //Restroom Trailer Rental Cost
    '93046': {bundleSKU: '110-0000', assetSKU: '111-1001', serviceSKU: '112-2001'}, //Standard Restroom
    '93045': {bundleSKU: '110-0000', assetSKU: '111-1101', serviceSKU: '112-2001'}, //Deluxe Restroom
    '93047': {bundleSKU: '110-0000', assetSKU: '111-1103', serviceSKU: '112-2001'}, //Flushing Restroom
    '93048': {bundleSKU: '110-0000', assetSKU: '111-1201', serviceSKU: '112-2001'}, //ADA Portable Toilet
    '93049': {bundleSKU: '110-0000', assetSKU: '111-1402', serviceSKU: '112-2001'}, //High Rise Restroom
    '93050': {bundleSKU: '110-0000', assetSKU: '111-1006', serviceSKU: '112-2001'}, //Restroom with Crane Hook
    '93051': {bundleSKU: '110-0000', assetSKU: '111-1301', serviceSKU: '112-2001'}, //Trailer Mounted Restroom
    '93052': {bundleSKU: '110-0000', assetSKU: '111-1202', serviceSKU: '112-2001'}, //Handicap Portable Toilet
    '93053': {bundleSKU: '110-0000', assetSKU: '111-1001', serviceSKU: '112-2001'}, //Porta Potty Rental Cost
    '93065': {bundleSKU: '', assetSKU: '', serviceSKU: ''}, //20 Yard Dumpster
    '93066': {bundleSKU: '', assetSKU: '', serviceSKU: ''}, //30 Yard Dumpster
    '93067': {bundleSKU: '', assetSKU: '', serviceSKU: ''}, //40 Yard Dumpster
    '93068': {bundleSKU: '', assetSKU: '', serviceSKU: ''}, //Roll Off Dumpster Rental
    '93071': {bundleSKU: '', assetSKU: '', serviceSKU: ''}, //53-Foot Shower Trailer
    '93072': {bundleSKU: '', assetSKU: '', serviceSKU: ''}, //32-Foot Shower Trailer
    '93073': {bundleSKU: '', assetSKU: '', serviceSKU: ''}, //24-Foot Shower Trailer
    '93054': {bundleSKU: '', assetSKU: '', serviceSKU: ''}, //Temporary Fence Panels
    '93055': {bundleSKU: '', assetSKU: '', serviceSKU: ''}, //Temporary Chain Link Fence
    '93056': {bundleSKU: '', assetSKU: '', serviceSKU: ''}, //Barricade Rental
    '93057': {bundleSKU: '', assetSKU: '', serviceSKU: ''}, //Temporary Privacy Fence
    '93058': {bundleSKU: '', assetSKU: '', serviceSKU: ''}, //Temporary Fence Rental Cost
    '93076': {bundleSKU: '', assetSKU: '', serviceSKU: ''}, //Temporary Power Pole Rental
    '93077': {bundleSKU: '', assetSKU: '', serviceSKU: ''}, //Portable Generator Rental
  }
}
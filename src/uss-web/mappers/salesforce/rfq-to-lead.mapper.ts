import { RFQHelper } from "../../services/rfq/rfq.helper";
import { Lead } from "../../../backend/sfdc/model/Lead";
import { RequestForQuote } from "../../../uss-web/models/request-for-quote.model";
import isEmail from 'validator/lib/isEmail';

const validRentalPurposes = ['Business', 'Personal', 'Government'];
const validUseTypes = ['Construction', 'Event', 'Other'];
const utmParamsMap = {
  utm_campaign: 'utm_campaign__c',
  utm_content: 'utm_content__c',
  utm_medium: 'utm_medium__c',
  utm_source: 'utm_source__c',
  utm_term: 'utm_term__c',
  mktsource: 'Marketing_Source__c'
};

const productCategoriesMap = {
  "hand-washing": "Hand Washing",
  "porta-potty-rentals": "RBS",
  "holding-tanks" : "Holding Tanks",
  "portable-restroom-trailers-rental": "RBS Trailers",
  "roll-off-dumpsters" : "Roll-Off",
  "shower-trailers" : "RBS Trailers",
  "temporary-fence-rentals" : "Fence",
  "temporary-power-services": "Power",
  "other-services" : "Other",
  "hydroflow" : "RBS",
  "uncategorized" : "Other"
}

export class RFQtoLeadMapper {
  public static mapRFQtoSFDCLead(rfq: RequestForQuote): Lead {
    const lead = new Lead();
    lead.FirstName = rfq.firstName?.substring(0, 40);
    lead.LastName = rfq.lastName?.substring(0, 80);
    const companyName = rfq.companyName || rfq.firstName + ' ' + rfq.lastName;
    lead.Company = companyName?.substring(0, 255);
    lead.Email = isEmail(rfq.emailAddress?.substring(0, 80))
      ? rfq.emailAddress
      : null;
    lead.Phone = rfq.phoneNumber?.substring(0, 40);
    lead.PostalCode = rfq.deliveryZipCode?.substring(0, 20);
    lead.USS_RFQ_Start_Date__c = rfq.startDate ? new Date(rfq.startDate) : null;
    lead.USS_RFQ_End_Date__c = rfq.endDate ? new Date(rfq.endDate) : null;
    lead.USS_Rental_Purpose__c =
      validRentalPurposes.indexOf(rfq.purposeOfRental) > -1
        ? rfq.purposeOfRental
        : null;
    lead.USS_Rental_Usage__c =
      validUseTypes.indexOf(rfq.useType) > -1 ? rfq.useType : null;
    lead.USS_Standard_Products__c = RFQHelper.getStandardProductsString(
      rfq.products,
    );
    lead.USS_Specialty_Products__c = RFQHelper.getSpecialtyProductsString(
      rfq.products,
    );
    lead.USS_Product_Categories__c = RFQHelper.getProductsCategoryString(
      rfq.products,productCategoriesMap
    );
    lead.Acquisition_Company__c = '';
    lead.Status = 'Marketing Qualified';
    lead.LeadSource = 'Web Lead';
    lead.Customer_Type__c = this.mapPurposeOfRentalToCustomerType(
      rfq.purposeOfRental,
    );
    lead.Google_Analytics__c = rfq.googleAnalyticsId?.substring(0, 255);
    lead.HasOptedOutOfEmail = false;
    // lead.StateCode = rfq.deliveryState; // field no longer used
    // lead.CampaignId = rfq.campaignId; // assign the campaign elsewhere
    this.mapLastClickIdToTrackingFields(rfq, lead);
    this.mapUTMValuesToLeadFields(rfq, lead);
    return lead;
  }

  private static mapLastClickIdToTrackingFields(
    rfq: RequestForQuote,
    lead: Lead,
  ): void {
    if (!rfq.lastClickId) {
      return;
    }
    let lastClickArray = rfq.lastClickId.split('|');
    if (lastClickArray.length === 2) {
      const clickType = lastClickArray[0];
      switch (clickType) {
        case 'gclid':
          lead.GCLID__c = lastClickArray[1];
          break;
        case 'fbclid':
          lead.fbclid__c = lastClickArray[1];
          break;
        case 'msclkid':
          lead.msclkid__c = lastClickArray[1];
          break;
        default:
          break;
      }
    }
  }

  private static mapPurposeOfRentalToCustomerType(
    purposeOfRental: string,
  ): 'Consumer' | 'Business' | 'Government' | 'Charity' {
    if (purposeOfRental === 'Personal') {
      return 'Consumer';
    } else if (purposeOfRental === 'Business') {
      return 'Business';
    } else if (purposeOfRental === 'Government') {
      return 'Government';
    } else {
      return 'Business';
    }
  }

  private static mapUTMValuesToLeadFields(rfq: RequestForQuote, lead: Lead): void {
    const utmValuesString = rfq.utmValues;
    if (!utmValuesString) {
      return;
    }
    // parse the pipe delimited string into an object
    // key|value|key|value
    utmValuesString.split('|').forEach((value, index, array) => {
      // if the index is even, it's a key
      if (index % 2 === 0) {
        const utmKey = value;
        const utmValue = array[index + 1];
        const leadField = utmParamsMap[utmKey];
        // if the key is a valid lead field, set the value
        if (leadField) {
          lead[leadField] = utmValue;
        }
      }
    });
  }
}
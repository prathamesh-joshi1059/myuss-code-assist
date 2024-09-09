import { EligibilityRuleResult } from "./myuss-eligibility";

export class RequestForQuote {
    id: string;
    formStatus: 'incomplete' | 'complete';
    recaptchaToken: string;
    lastClickId: string;
    googleAnalyticsId: string;
    utmValues: string;
    sentToMarketingCloud: boolean;
    companyName: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    smsOptIn: boolean;
    emailAddress: string;
    startDate: Date;
    endDate: Date;
    deliveryZipCode: string;
    purposeOfRental: 'Business' | 'Personal' | 'Government';
    useType: 'Construction' | 'Event' | 'Other';
    rentalDuration: 'Under 7 Days' | '0 to 2 Months' | '3 to 5 Months' | '6+ Months';
    products: RFQProduct[];
    leadId: string;
    probabilityModel: string;
    winProbability: number;
    myUssEligible: boolean;
    myUssEligibilityDetails: EligibilityRuleResult[];
    myUssEligibilityError: string;
    myUssExistingUser: boolean;
    priorityGroup: string;

    constructor() {
      this.products = [];
      this.myUssEligibilityDetails = [];
    }
}

export class RFQProduct {
  code: string;
  skus: SKUs; // translate the code to the sku
  name: string;
  quantity: number;
  category: {
    code: string;
    name: string;
  }
  productType: 'standard' | 'specialty';
}

export class MarketingTag {
  name: string; 
  value: string;
}

export class SKUs {
  bundleSKU: string;
  assetSKU: string;
  serviceSKU: string;
}

const marketingTagNames = [
  'utm_source', 
  'utm_medium', 
  'utm_campaign', 
  'utm_term', 
  'utm_content', 
  // google
  'gclid', 
  'dclid',
  'wbraid',
  'gbraid',
  // microsoft
  'msclkid', 
  // facebook
  'fbclid',
  // twitter
  'tclid',
  // TikTok
  'ttclid',
  // custom
  'mktsource',
]
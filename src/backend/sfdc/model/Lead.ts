export class Lead {
  Id: string;
  Company: string;
  FirstName: string;
  LastName: string;
  Phone: string;
  Email: string;
  PostalCode: string;
  USS_RFQ_Start_Date__c: Date;
  USS_RFQ_End_Date__c: Date;
  USS_Rental_Purpose__c: string; // Business, Personal, Government
  USS_Rental_Usage__c: string; // Construction, Event, Industrial, Other, Residential, Commercial
  USS_Standard_Products__c: string;
  USS_Specialty_Products__c: string;
  Acquisition_Company__c: string;
  Status: string; // Marketing Qualified
  LeadSource: string; // Web Lead
  Customer_Type__c:  'Consumer' | 'Business' | 'Government' | 'Charity'; // Business, Consumer, Charity, Government
  HasOptedOutOfEmail: boolean;
  StateCode: string;
  State: string;
  // CampaignId: string;
  USF_Campaign__c: string;
  Google_Analytics__c: string;
  GCLID__c: string;
  fbclid__c: string;
  msclkid__c: string;
  Marketing_Source__c: string;
  // utm fields
  utm_campaign__c: string;
  utm_content__c: string;
  utm_medium__c: string;
  utm_source__c: string;
  utm_term__c: string;
  USS_Product_Categories__c : string;
}
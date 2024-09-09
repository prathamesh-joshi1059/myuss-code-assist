export class Product2 {
  Id: string;
  ProductCode: string;
  Name: string;
  ProductType__c: string;
  Requires_Parent_Asset__c: boolean;
  AVA_SFCPQ__TaxCode__c: string;
  ProductCategory__c: string;
  Line_Type__c: 'One-Time' | 'Recurring';
  SBQQ__SubscriptionType__c: 'One-time' | 'Renewable';
  Asset_Summary__c: string;
  Description2__c: string;
  SBQQ__Options__r: SBQQ__ProductOption__c[];
  PricebookEntries: PricebookEntry[];
  Number_of_Services__c?: number;
}

export class SBQQ__ProductOption__c {
  Id: string;
  SBQQ__OptionalSKU__c: string;
  SBQQ__OptionalSKU__r: Product2;
  AdditionalOptions__c: string;
  SBQQ__Number__c: any;
  SBQQ__Type__c: string;
  SBQQ__Feature__c: string;
}

export class PricebookEntry {
  Id: string;
}

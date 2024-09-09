export class CreateQuoteDataSample {
  quoteTemplateId = 'a6M8I0000004Cl5UAE';
  accountId = '0018I00000fYFDpQAO';
  contactId = '0038I00000d8vxeQAA';
  pricebookId = '01s1N000007nDwhQAE';
  serviceableZipCode = 'a6y8I0000004bp4QAA';
  shippingAddress = 'a8x8I000000CmyOQAS';
  billTiming = 'Bill in Advance';
  billingPeriod = '28 Day Bill Period';
  customerType = 'Consumer';
  businessType = 'Consumer';
  orderType = 'Recurring without End Date';
  quoteName = `Test Quote ${new Date().toISOString()}`;
  startDate = '2023-09-01';
  endDate = '2049-12-31';
  productIdBundle = '01t3m00000PPH5MAAX';
  pricebookEntryIdBundle = '01u3m00000O2tSBAAZ'; // Restroom Bundle - Standard PB
  prodSubType = 'Renewable';
  productIdAsset = '01t3m00000NTiw6AAD';
  productOptionIdAsset = 'a6D8I0000008aKcUAI';
  pricebookEnteryIdAsset = '01u3m00000O2tTvAAJ'; // Std Rest - Standard PB

  opportunity = {
    AccountId: this.accountId,  // this is the account id in the context
    Name: 'Test Opportunity', // this is usually the Account 
    Opportunity_Name_Extension__c: '', // leave this blank
    StageName: 'Prospecting',
    Amount: 1000,
    CloseDate: '2023-09-29',
    LeadSource: 'MyUSS',
    USF_Bill_To_Account__c: this.accountId,
    USF_Start_Date__c: this.startDate,
    USF_End_Date__c: this.endDate,
    USF_Order_Type__c: this.orderType,
    USF_Primary_Contact__c: this.contactId,
    USF_Won_Reason__c: null,
    USS_Product_Categories__c: 'RBS',
  };

  purchaseOrder = {
    Name: `Test PO ${new Date().toISOString()}`,
    Account__c: this.accountId,
    Amount__c: 1000,
    Expiration_Date__c: '2049-12-31', // default to 12/31/2049
  };

  address = {
    USF_Account__c: this.accountId,
    USF_City__c: 'Boston',
    USF_Country__c: 'US',
    USF_Ship_To_Address__c: true,
    USF_State__c: 'MA',
    USF_Street__c: '118 Flanders Rd',
    USF_Zip_Code__c: '01581',
    Site_Name__c: 'Test Site Name',
    Address_Latitude_Longitude__Latitude__s: 42.278927,
    Address_Latitude_Longitude__Longitude__s: -71.5732386,
    NF_Placement__c: 'By the office',
    NF_Ship_To_Contact__c: this.contactId,
    NF_Site_Contact__c: this.contactId,
    Address_Validated__c: true,
    GeoCode_Accuracy__c: 'Address',
    NF_Is_Parent__c: true,
  };

  quote = {
    // Name: quoteName,
    SBQQ__Account__c: this.accountId,
    SBQQ__StartDate__c: this.startDate,
    SBQQ__EndDate__c: this.endDate,
    Duration__c: '12-24 Months', // picklist
    SBQQ__Opportunity2__c: null,
    SBQQ__PriceBook__c: this.pricebookId,
    SBQQ__PricebookId__c: this.pricebookId,
    SBQQ__PrimaryContact__c: this.contactId,
    SBQQ__Primary__c: true,
    Bill_Timing__c: this.billTiming,
    Billing_Period__c: this.billingPeriod,
    Customer_Type__c: this.customerType,
    Business_Type__c: this.businessType,
    Decline_Damage_Waiver__c: true,
    Serviceable_Zip_Code__c: this.serviceableZipCode,
    Shipping_Address__c: this.shippingAddress,
    Order_Type__c: this.orderType,
    Quote_Name__c: this.quoteName,
    BillToContact__c: this.contactId,
    AutoPay__c: true,
    Can_be_Ordered_in_Salesforce__c: true,
    Billing_Complete__c: false,
    InvoiceDeliveryMethod__c: 'Email',
    OtherInstructions__c: 'Test other instructions',
    Payment_Method_Id__c: null,
    Payment_Mode__c: 'creditDebit',
    PreOrder_Flow_Complete__c: false,
    PrimarySiteContact__c: this.contactId,
    Ship_To_Contact__c: this.contactId,
    Site_Complete__c: false,
    Billing_Approval_Status__c: 'Not Submitted',
    Purchase_Order__c: null,
    isCheckPaymentMethod__c: false,
    Facility_Name__c: null,
    Subdivision_Name__c: null,
    Fuel_Surcharge_Percent__c: 14.9,
  };

  quoteLineBundle = {
    SBQQ__Quote__c: null,
    SBQQ__Bundle__c: true,
    SBQQ__StartDate__c: this.startDate,
    SBQQ__EndDate__c: this.endDate,
    SBQQ__PricebookEntryId__c: this.pricebookEntryIdBundle,
    SBQQ__ProductSubscriptionType__c: this.prodSubType,
    SBQQ__Product__c: this.productIdBundle,
    SBQQ__Quantity__c: 1,
    SBQQ__TaxCode__c: null,
    SBQQ__SubscriptionPricing__c: 'Fixed Price',
    SBQQ__SubscriptionType__c: this.prodSubType,
    Prod_Subscription_Type__c: this.prodSubType,
    QuantityUnitOfMeasure__c: null,
    Requires_Parent_Asset__c: false,
    Sort_Order__c: '00000000100000',
    USF_Address__c: this.shippingAddress,
    CustomerOwned__c: false,
    AdditionalOptions__c: null,
    Asset_Summary__c: 'Standard Restroom',
  };

  quoteLineAsset = {
    SBQQ__Quote__c: null,
    SBQQ__Bundle__c: false,
    SBQQ__RequiredBy__c: null,
    SBQQ__StartDate__c: this.startDate,
    SBQQ__EndDate__c: this.endDate,
    SBQQ__Product__c: this.productIdAsset,
    SBQQ__ProductOption__c: this.productOptionIdAsset,
    SBQQ__PricebookEntryId__c: this.pricebookEnteryIdAsset,
    SBQQ__ProductSubscriptionType__c: this.prodSubType,
    SBQQ__Quantity__c: 1,
    SBQQ__TaxCode__c: 'SANIRENT',
    SBQQ__SubscriptionPricing__c: 'Fixed Price',
    SBQQ__SubscriptionType__c: this.prodSubType,
    Prod_Subscription_Type__c: this.prodSubType,
    QuantityUnitOfMeasure__c: null,
    Requires_Parent_Asset__c: false,
    Sort_Order__c: '00000000300010',
    USF_Address__c: this.shippingAddress,
    CustomerOwned__c: false,
    AdditionalOptions__c: null,
    Asset_Summary__c: 'Standard Restroom',
  };

  quoteLineService = {
    SBQQ__Quote__c: null,
    SBQQ__Bundle__c: false,
    SBQQ__RequiredBy__c: null,
    SBQQ__StartDate__c: this.startDate,
    SBQQ__EndDate__c: this.endDate,
    SBQQ__Product__c: '01t3m00000NTivwAAD',
    SBQQ__ProductOption__c: 'a6D8I0000008aRVUAY',
    SBQQ__PricebookEntryId__c: '01u3m00000O2tTsAAJ',
    SBQQ__ProductSubscriptionType__c: this.prodSubType,
    SBQQ__Quantity__c: 1,
    SBQQ__TaxCode__c: 'SANISERV',
    SBQQ__SubscriptionPricing__c: 'Fixed Price',
    SBQQ__SubscriptionType__c: this.prodSubType,
    Prod_Subscription_Type__c: this.prodSubType,
    QuantityUnitOfMeasure__c: 'Each',
    Requires_Parent_Asset__c: true,
    Sort_Order__c: '00000000200010',
    USF_Address__c: this.shippingAddress,
    CustomerOwned__c: false,
    AdditionalOptions__c: null,
    Asset_Summary__c: 'Standard Restroom',
  };

  quoteLineHandSani = {
    SBQQ__Quote__c: null,
    SBQQ__Bundle__c: false,
    SBQQ__RequiredBy__c: null,
    SBQQ__StartDate__c: this.startDate,
    SBQQ__EndDate__c: this.endDate,
    SBQQ__Product__c: '01t3m00000POgw6AAD',
    SBQQ__ProductOption__c: 'a6D8I0000008aMGUAY',
    SBQQ__PricebookEntryId__c: '01u3m00000O2tVmAAJ',
    SBQQ__ProductSubscriptionType__c: this.prodSubType,
    SBQQ__Quantity__c: 1,
    SBQQ__TaxCode__c: 'SANISERV',
    SBQQ__SubscriptionPricing__c: 'Fixed Price',
    SBQQ__SubscriptionType__c: this.prodSubType,
    Prod_Subscription_Type__c: this.prodSubType,
    QuantityUnitOfMeasure__c: 'Each',
    Requires_Parent_Asset__c: false,
    Sort_Order__c: '00000000400010',
    USF_Address__c: this.shippingAddress,
    CustomerOwned__c: false,
    AdditionalOptions__c: null,
    Asset_Summary__c: 'Standard Restroom',
  };

  quoteLineDelivery = {
    SBQQ__Quote__c: null,
    SBQQ__Bundle__c: false,
    SBQQ__RequiredBy__c: null,
    SBQQ__StartDate__c: this.startDate,
    SBQQ__EndDate__c: this.endDate,
    SBQQ__Product__c: '01t3m00000POgxIAAT',
    SBQQ__ProductOption__c: 'a6D8I0000008aMRUAY',
    SBQQ__PricebookEntryId__c: '01u3m00000O2tVpAAJ',
    SBQQ__ProductSubscriptionType__c: 'One-time',
    SBQQ__Quantity__c: 1,
    SBQQ__TaxCode__c: 'FR010000',
    SBQQ__SubscriptionPricing__c: 'Fixed Price',
    SBQQ__SubscriptionType__c: 'One-time',
    Prod_Subscription_Type__c: 'One-time',
    QuantityUnitOfMeasure__c: 'Each',
    Requires_Parent_Asset__c: true,
    Sort_Order__c: '00000000500010',
    USF_Address__c: this.shippingAddress,
    CustomerOwned__c: false,
    AdditionalOptions__c: null,
    Asset_Summary__c: 'Standard Restroom',
  };

  quoteLinePickup = {
    SBQQ__Quote__c: null,
    SBQQ__Bundle__c: false,
    SBQQ__RequiredBy__c: null,
    SBQQ__StartDate__c: this.startDate,
    SBQQ__EndDate__c: this.endDate,
    SBQQ__Product__c: '01t3m00000POgxNAAT',
    SBQQ__ProductOption__c: 'a6D8I0000008aV2UAI',
    SBQQ__PricebookEntryId__c: '01u3m00000O2tWPAAZ',
    SBQQ__ProductSubscriptionType__c: 'One-time',
    SBQQ__Quantity__c: 1,
    SBQQ__TaxCode__c: 'FR010000',
    SBQQ__SubscriptionPricing__c: 'Fixed Price',
    SBQQ__SubscriptionType__c: 'One-time',
    Prod_Subscription_Type__c: 'One-time',
    QuantityUnitOfMeasure__c: 'Each',
    Requires_Parent_Asset__c: true,
    Sort_Order__c: '00000000600010',
    USF_Address__c: this.shippingAddress,
    CustomerOwned__c: false,
    AdditionalOptions__c: null,
    Asset_Summary__c: 'Standard Restroom',
  };

  quoteLinePickupCart = {
    SBQQ__Quote__c: null,
    SBQQ__Bundle__c: false,
    SBQQ__RequiredBy__c: null,
    SBQQ__StartDate__c: this.startDate,
    SBQQ__EndDate__c: this.endDate,
    SBQQ__Product__c: '01t3m00000POgwyAAD',
    SBQQ__ProductOption__c: null,
    SBQQ__PricebookEntryId__c: '01u8I000007VB5PQAW',
    SBQQ__ProductSubscriptionType__c: 'One-time',
    SBQQ__Quantity__c: 1,
    SBQQ__TaxCode__c: 'FR010000',
    SBQQ__SubscriptionPricing__c: 'Fixed Price',
    SBQQ__SubscriptionType__c: 'One-time',
    Prod_Subscription_Type__c: 'One-time',
    QuantityUnitOfMeasure__c: 'Each',
    Requires_Parent_Asset__c: false,
    Sort_Order__c: '50000000000007',
    USF_Address__c: this.shippingAddress,
    CustomerOwned__c: false,
    AdditionalOptions__c: null,
    Asset_Summary__c: 'Cart-level P&D Sanitation',
  };

  quoteLineDeliveryCart = {
    SBQQ__Quote__c: null,
    SBQQ__Bundle__c: false,
    SBQQ__RequiredBy__c: null,
    SBQQ__StartDate__c: this.startDate,
    SBQQ__EndDate__c: this.endDate,
    SBQQ__Product__c: '01t3m00000POgwjAAD',
    SBQQ__ProductOption__c: null,
    SBQQ__PricebookEntryId__c: '01u3m00000O2tXOAAZ',
    SBQQ__ProductSubscriptionType__c: 'One-time',
    SBQQ__Quantity__c: 1,
    SBQQ__TaxCode__c: 'FR010000',
    SBQQ__SubscriptionPricing__c: 'Fixed Price',
    SBQQ__SubscriptionType__c: 'One-time',
    Prod_Subscription_Type__c: 'One-time',
    QuantityUnitOfMeasure__c: 'Each',
    Requires_Parent_Asset__c: false,
    Sort_Order__c: '50000000000008',
    USF_Address__c: this.shippingAddress,
    CustomerOwned__c: false,
    AdditionalOptions__c: null,
    Asset_Summary__c: 'Cart-level P&D Sanitation',
  };

  quotedJobsite = {
    NF_Quote__c: null,
    NF_Quote_Line__c: null, // bundle
    NF_Aggregated_Product_Name__c: 'Std Rest 1 Svc 1 Day Wk',
    NF_Asset_Product__c: this.productIdAsset,
    NF_Frequency_Product__c: this.quoteLineService.SBQQ__Product__c,
    NF_PreOrder_Flow_Complete__c: false,
    NF_Quantity_Quoted__c: 1,
    NF_SiteName__c: null,
    NF_Start_Date__c: this.startDate,
    NF_End_Date__c: this.endDate,
    NF_USF_Address__c: this.shippingAddress,
  };
}

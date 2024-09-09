import exp from "constants"

  export const fuel_Surcharge_Percent__c = 14.9
  export const SBQQ__SubscriptionPricing__c = 'Fixed Price'
  export const quoteLineBundle_Sort_Order__c = '00000000100000'
  export const quoteLineAsset_Sort_Order__c = '00000000300010'
  export const quoteLineService_QuantityUnitOfMeasure__c ='Each'
  export const quoteLineService_Sort_Order__c = '00000000200010'
  export const additionalServices_Sort_Order__c = '00000000400010'
  export const quoteLineDelivery_Sort_Order__c = '00000000500010'
  export const quoteLinePickup_Sort_Order__c = '00000000600010'
  export const quoteLinePickupCart_Sort_Order__c = '50000000000006' 
  export const quoteLineDeliveryCart_Sort_Order__c = '50000000000008'
  export const templatesData = [
    {
      "label1": "One Standard Restroom with hand sanitizer",
      "label2": "One Standard Restroom with hand sanitizer",
      "url":"https://storage.googleapis.com/myuss_portal_dev/1.png",
      "service":"Once per week service",
      "products": [
        {
          "bundle": {
            "bundleProductCode": "110-0000",
            "bundleName": "Restroom Bundle",
            "qty": 1
          },
          "asset": {
            "assetId": "test",
            "assetName": "Std Rest",
            "assetProductCode": "111-1001"
          },
          "service": {
            "serviceId": "test",
            "serviceName": "1 Svc 1 Day Wk",
            "serviceProductCode": "112-2001"
          },
          "ancillary": {
            "ancillaryServiceId": "test",
            "ancillaryServiceName": "Hand Sani Refill",
            "ancillaryServiceProductCode": "112-2208"
          }
        }
      ]
    },
    {
      "label1": "One Standard Restroom with hand sanitizer",
      "label2": "One Standard Restroom with hand sanitizer",
      "url":"https://storage.googleapis.com/myuss_portal_dev/2.png",
      "service":"Twice per week service",
      "products": [
        {
          "bundle": {
            "bundleProductCode": "110-0000",
            "bundleName": "Restroom Bundle",
            "qty": 1
          },
          "asset": {
            "assetId": "test",
            "assetName": "Std Rest",
            "assetProductCode": "111-1001"
          },
          "service": {
            "serviceId": "test",
            "serviceName": "1 Svc 2 Days Wk",
            "serviceProductCode": "112-2002"
          },
          "ancillary": {
            "ancillaryServiceId": "test",
            "ancillaryServiceName": "Hand Sani Refill",
            "ancillaryServiceProductCode": "112-2208"
          }
        }
      ]
    },
    {
      "label1": "One Standard Restroom with one 2-station hand sink",
      "label2": "One Standard Restroom with one 2-station hand sink (No Hand Sani Refill)",
      "service":"Twice per week service",
      "url":"https://storage.googleapis.com/myuss_portal_dev/3.png",
      "products": [
        {
          "bundle": {
            "bundleProductCode": "110-0000",
            "bundleName": "Restroom Bundle",
            "qty": 1
          },
          "asset": {
            "assetId": "test",
            "assetName": "Std Rest",
            "assetProductCode": "111-1001"
          },
          "service": {
            "serviceId": "test",
            "serviceName": "1 Svc 2 Days Wk",
            "serviceProductCode": "112-2002"
          }
        },
        {
          "bundle": {
            "bundleProductCode": "120-0000",
            "bundleName": "Hand Cleaning Bundle",
            "qty": 1
          },
          "asset": {
            "assetId": "test",
            "assetName": "2 Stn Hand Sink",
            "assetProductCode": "121-1102"
          },
          "service": {
            "serviceId": "test",
            "serviceName": "1 Svc 2 Days Wk",
            "serviceProductCode": "122-2002"
          }
        }
      ]
    },
    {
      "label1": "Two Standard Restrooms with one 2-station hand sink",
      "label2": "Two Standard Restrooms with one 2-station hand sink (No Hand Sani Refill)",
      "url":"https://storage.googleapis.com/myuss_portal_dev/4.png",
      "service":"Twice per week service",
      "products": [
        {
          "bundle": {
            "bundleProductCode": "110-0000",
            "bundleName": "Restroom Bundle",
            "qty": 2
          },
          "asset": {
            "assetId": "test",
            "assetName": "Std Rest",
            "assetProductCode": "111-1001"
          },
          "service": {
            "serviceId": "test",
            "serviceName": "1 Svc 2 Days Wk",
            "serviceProductCode": "112-2002"
          }
        },
        {
          "bundle": {
            "bundleProductCode": "120-0000",
            "bundleName": "Hand Cleaning Bundle",
            "qty": 1
          },
          "asset": {
            "assetId": "test",
            "assetName": "2 Stn Hand Sink",
            "assetProductCode": "121-1102"
          },
          "service": {
            "serviceId": "test",
            "serviceName": "1 Svc 2 Days Wk",
            "serviceProductCode": "122-2002"
          }
        }
      ]
    }
  ]

  export const Manual_Payment_Message = {
    message: "You and added email address(es) will receive an invoice for each billing period which will be responsible for payment by check or credit card through the payment portal.",
  }

  export const Maximum_Number_Of_Tries = 5;
  export const API_VERSION = '58.0';
  export const limitForFetchPaymentMethodFromStripe = 50;
  export const TimeOutForFetchDataInCache = 3000;
  export const fileSizeLimit = 5 * 1024 * 1024; // 5 MB
  export const allowedExtensions = ['pdf','doc','docx','png','jpeg','jpg','xls','xlsx'];
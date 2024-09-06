export const TIMEMS_CACHE_USER = 24 * 60 * 60 * 1000;
export const TIMEMS_CACHE_PRODUCT = 24 * 60 * 60 * 1000;
export const TIMEMS_CACHE_REQUEST_FOR_QUOTE = 900000;
export const DEFAULT_END_DATE = '2049-12-31';
export const USS_Product_Categories = 'RBS';
export const OPPORTUNITY_AMOUNT = 1000;
export const OPPORTUNITY_LEAD_SOURCE = 'MyUSS';
export const OPPORTUNITY_STAGE = 'Prospecting';
export const QUOTE_INVOICE_DELIVERY_METHOD = 'Email';
export const QUOTE_PAYMENT_MODE = 'creditDebit';
export const QUOTE_BILLING_APPROVAL_STATUS = 'Not Submitted';
export const QUOTE_BILLING_SYSTEM = 'ZAB';
export const FUEL_SURCHARGE_PERCENT__C = 14.9;
export const SBQQ__SUBSCRIPTIONPRICING__C = 'Fixed Price';
export const QUOTELINEBUNDLE_SORT_ORDER__C = '00000000100000';
export const QUOTELINEASSET_SORT_ORDER__C = '00000000300010';
export const QUOTELINESERVICE_QUANTITYUNITOFMEASURE__C = 'Each';
export const QUOTELINESERVICE_SORT_ORDER__C = '00000000200010';
export const ADDITIONALSERVICES_SORT_ORDER__C = '00000000400010';
export const QUOTELINEDELIVERY_SORT_ORDER__C = '00000000500010';
export const QUOTELINEPICKUP_SORT_ORDER__C = '00000000600010';
export const QUOTELINEPICKUPCART_SORT_ORDER__C = '50000000000006';
export const QUOTELINEDELIVERYCART_SORT_ORDER__C = '50000000000008';
export const USS_CUSTOMERCARE_MESSAGE = "An error occurred, please contact 1-888-320-1861-TOILETS.";
export const USS_CUSTOMERCARE_EMAIL = 'myussadmin@unitedsiteservices.com';
export const USS_CUSTOMERCARE_PHONE = '1-888-320-1861';
export const MYUSS_SYSTEM_USERNAME = 'MyUSS System User';
export const TEMPLATES_DATA = [
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
          "assetName": "Standard Restroom",
          "assetProductCode": "111-1001"
        },
        "service": {
          "serviceId": "test",
          "serviceName": "1 Service 1 Day per Week",
          "serviceProductCode": "112-2001"
        },
        "ancillary": {
          "ancillaryServiceId": "test",
          "ancillaryServiceName": "Hand Sanitizer Refill",
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
          "assetName": "Standard Restroom",
          "assetProductCode": "111-1001"
        },
        "service": {
          "serviceId": "test",
          "serviceName": "1 Service 2 Days per Week",
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
          "assetName": "Standard Restroom",
          "assetProductCode": "111-1001"
        },
        "service": {
          "serviceId": "test",
          "serviceName": "1 Service 2 Days per Week",
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
          "assetName": "Standard Restroom",
          "assetProductCode": "111-1001"
        },
        "service": {
          "serviceId": "test",
          "serviceName": "1 Service 2 Days per Week",
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
          "assetName": "2 Station Hand Wash Sink",
          "assetProductCode": "121-1102"
        },
        "service": {
          "serviceId": "test",
          "serviceName": "1 Service 2 Days per Week",
          "serviceProductCode": "122-2002"
        }
      }
    ]
  }
];

export const TIMEMS_CACHE_ZIPCODE =  60 * 60 * 1000;
export const USF_WON_REASON = "MySiteServices"

 
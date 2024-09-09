import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../../core/logger/logger.service';

import { SfdcContractService } from '../../../backend/sfdc/services/sfdc-contract/sfdc-contract.service';
import { SfdcBaseService } from '../../../backend/sfdc/services/sfdc-base/sfdc-base.service';

import { ContractService } from './contract.service';
import { PaymentMethodsService } from '../payment/payment-methods.service';
import { StripeService } from "../../../backend/stripe/services/stripe/stripe.service"
import { SfdcAccountService } from '../../../backend/sfdc/services/sfdc-account/sfdc-account.service';
import {TrackUserActionService} from "../../../core/track-user-action/track-user-action-service";

describe('ContractService', () => {
  let service: ContractService;

  // Mock Config Service
  let mockConfigService = {
    get: jest.fn(),
  };

  // Mock the SfdcBaseService
  let mockSfdcService = {
    login: jest.fn(),
    getQuery: jest.fn(),
    updateSObject: jest.fn(),
    getMetadata: jest.fn(),
    createSObject: jest.fn(),
    updateSObjectByExternalId: jest.fn(),
    getSObjectById: jest.fn(),
    getSObjectRecordsByField: jest.fn(),
    getSObjectByIds: jest.fn(),
    getApex: jest.fn(),
    patchApex: jest.fn(),
    getDocumentBodyJSF: jest.fn(),
    postApex: jest.fn(),
    getDocumentBody: jest.fn(),
  };

  // Mock Logger Service
  let mockLoggerService = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    info: jest.fn(),
  };

  // Mock the SfdcContractService
  let mockSfdcContractService = {
    getContractDetails: jest.fn(),
    getContractDetailsSoql: jest.fn(),
    fetchContracts: jest.fn(),
    getActiveOrderCount: jest.fn(),
    fetchContractIds: jest.fn(),
    fetchNotification: jest.fn(),
    getContractByOrderIdAndZIP: jest.fn(),
  };

  let mockPaymentMethodsService = {
    getStripeCustomer: jest.fn(),
    createStripeCustomer: jest.fn(),
    getPaymentMethods: jest.fn(),
    getPaymentDetails: jest.fn(),
    createSetupIntent: jest.fn(),
  };
  let mockUserActionService = {
    trackUserAction: jest.fn(),
    
  }
  

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractService,
       
        StripeService,
        SfdcAccountService,
        TrackUserActionService,
        {provide: PaymentMethodsService, useValue: mockPaymentMethodsService},
      {provide: SfdcContractService, useValue: mockSfdcContractService},
      {provide: SfdcBaseService, useValue: mockSfdcService},
      {provide: ConfigService, useValue: mockConfigService},
      {provide: LoggerService, useValue: mockLoggerService}
      ],
    }).compile();

    service = module.get<ContractService>(ContractService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  //Get Contracts array as per status - Activated , Suspended , Draft - Failure
  it('should respond with 1006 status code.', async () => {
    const SfdcContractsRes =      [
      {
        "attributes": {
          "type": "Contract",
          "url": "/services/data/v58.0/sobjects/Contract/8008I000000JOhQQAW"
        },
        "Id": "8008I000000JOhQQAW",
        "SBQQ__Quote__r": {
          "attributes": {
            "type": "SBQQ__Quote__c",
            "url": "/services/data/v58.0/sobjects/SBQQ__Quote__c/a6O8I000000HIquUAG"
          },
          "Shipping_Address__r": {
            "attributes": {
              "type": "USF_Address__c",
              "url": "/services/data/v58.0/sobjects/USF_Address__c/a8x8I000000CrhkQAC"
            },
            "Address_Latitude_Longitude__Latitude__s": 42.26256,
            "Address_Latitude_Longitude__Longitude__s": -71.60518
          },
          "Recurring_Subtotal__c": 880.4
        },
        "Payment_Method_ID__c": "pm_1OWhXHKX1Bgoxru0viId0dYq",
        "Status": "Draft",
        "Reference_Number__c": "516103",
        "Ship_To__c": "7 Maple Avenue, Westborough, MA,01581, US, Westborough, MA, 01581",
        "Ship_To_Zip_Code__c": "01581",
        "LastModifiedDate": "2024-01-25T14:51:28.000+0000",
        "Bill_To_Address__r": {
          "attributes": {
            "type": "USF_Address__c",
            "url": "/services/data/v58.0/sobjects/USF_Address__c/a8x8I000000CqxWQAS"
          },
          "Name": "4862 35th St, San Diego, - San Diego - CA",
          "Address_Latitude_Longitude__Latitude__s": 32.7666,
          "Address_Latitude_Longitude__Longitude__s": -117.11754
        },
        "billingEffectiveDateCombined__c": "2024-02-19",
        "AutoPay__c": false
      },
      {
        "attributes": {
          "type": "Contract",
          "url": "/services/data/v58.0/sobjects/Contract/8008I000000JOlhQAG"
        },
        "Id": "8008I000000JOlhQAG",
        "SBQQ__Quote__r": {
          "attributes": {
            "type": "SBQQ__Quote__c",
            "url": "/services/data/v58.0/sobjects/SBQQ__Quote__c/a6O8I000000HJE1UAO"
          },
          "Shipping_Address__r": {
            "attributes": {
              "type": "USF_Address__c",
              "url": "/services/data/v58.0/sobjects/USF_Address__c/a8x8I000000CrKCQA0"
            },
            "Address_Latitude_Longitude__Latitude__s": 42.27584,
            "Address_Latitude_Longitude__Longitude__s": -71.57286
          },
          "Recurring_Subtotal__c": 2571.09
        },
        "Payment_Method_ID__c": "pm_1OUT7bKX1Bgoxru0QhkBHwtW",
        "Status": "Activated",
        "Reference_Number__c": "516166",
        "Ship_To__c": "United Site Services, Inc. Flanders Road, Westborough, MA,01581, US, Westborough, MA, 01581",
        "Ship_To_Zip_Code__c": "01581",
        "LastModifiedDate": "2024-01-24T04:53:56.000+0000",
        "Bill_To_Address__r": {
          "attributes": {
            "type": "USF_Address__c",
            "url": "/services/data/v58.0/sobjects/USF_Address__c/a8x8I000000CqwdQAC"
          },
          "Name": "4813 Mansfield St, San Di - San Diego - CA",
          "Address_Latitude_Longitude__Latitude__s": 32.76584,
          "Address_Latitude_Longitude__Longitude__s": -117.11785
        },
        "billingEffectiveDateCombined__c": "2024-02-20",
        "AutoPay__c": false
      },
      {
        "attributes": {
          "type": "Contract",
          "url": "/services/data/v58.0/sobjects/Contract/8008I000000JOrkQAG"
        },
        "Id": "8008I000000JOrkQAG",
        "SBQQ__Quote__r": {
          "attributes": {
            "type": "SBQQ__Quote__c",
            "url": "/services/data/v58.0/sobjects/SBQQ__Quote__c/a6O8I000000HJg4UAG"
          },
          "Shipping_Address__r": {
            "attributes": {
              "type": "USF_Address__c",
              "url": "/services/data/v58.0/sobjects/USF_Address__c/a8x8I000000CqvpQAC"
            },
            "Address_Latitude_Longitude__Latitude__s": 42.3512,
            "Address_Latitude_Longitude__Longitude__s": -71.12221
          },
          "Recurring_Subtotal__c": 311.24
        },
        "Payment_Method_ID__c": "pm_1OWCRbKX1Bgoxru0IVtZkRMk",
        "Status": "Draft",
        "Reference_Number__c": "516289",
        "Ship_To__c": "16A Winslow Rd, Brookline, MA 02446, USA, Brookline, MA, 02446",
        "Ship_To_Zip_Code__c": "02446",
        "LastModifiedDate": "2024-01-25T14:51:34.000+0000",
        "Bill_To_Address__r": {
          "attributes": {
            "type": "USF_Address__c",
            "url": "/services/data/v58.0/sobjects/USF_Address__c/a8x8I000000CrtCQAS"
          },
          "Name": "7 E Main St, Westborough, - Westborough - MA",
          "Address_Latitude_Longitude__Latitude__s": 42.27012,
          "Address_Latitude_Longitude__Longitude__s": -71.61252
        },
        "billingEffectiveDateCombined__c": "2024-02-24",
        "AutoPay__c": false
      },
      {
        "attributes": {
          "type": "Contract",
          "url": "/services/data/v58.0/sobjects/Contract/8008I000000JOiiQAG"
        },
        "Id": "8008I000000JOiiQAG",
        "SBQQ__Quote__r": {
          "attributes": {
            "type": "SBQQ__Quote__c",
            "url": "/services/data/v58.0/sobjects/SBQQ__Quote__c/a6O8I000000HJ0gUAG"
          },
          "Shipping_Address__r": {
            "attributes": {
              "type": "USF_Address__c",
              "url": "/services/data/v58.0/sobjects/USF_Address__c/a8x8I000000CqvpQAC"
            },
            "Address_Latitude_Longitude__Latitude__s": 42.3512,
            "Address_Latitude_Longitude__Longitude__s": -71.12221
          },
          "Recurring_Subtotal__c": 569.16
        },
        "Payment_Method_ID__c": "pm_1OWzncKX1Bgoxru0P4LFzEWl",
        "Status": "Draft",
        "Reference_Number__c": "516153",
        "Ship_To__c": "16A Winslow Rd, Brookline, MA 02446, USA, Brookline, MA, 02446",
        "Ship_To_Zip_Code__c": "02446",
        "LastModifiedDate": "2024-01-25T14:51:37.000+0000",
        "Bill_To_Address__r": {
          "attributes": {
            "type": "USF_Address__c",
            "url": "/services/data/v58.0/sobjects/USF_Address__c/a8x8I000000CqvpQAC"
          },
          "Name": "16A Winslow Rd, Brookline - Brookline - MA",
          "Address_Latitude_Longitude__Latitude__s": 42.3512,
          "Address_Latitude_Longitude__Longitude__s": -71.12221
        },
        "billingEffectiveDateCombined__c": "2024-02-20",
        "AutoPay__c": false
      },
    
    ]
    const CustomerIdResp = 'cus_PJ3eJH9mtdNuTc';

    const PaymentMethodsResp = {
      "success": true,
      "status": 1000,
      "message": "Success",
      "data": [
        {
          "id": "pm_1OWzncKX1Bgoxru0P4LFzEWl",
          "object": "payment_method",
          "billing_details": {
            "address": {
              "city": null,
              "country": "IN",
              "line1": null,
              "line2": null,
              "postal_code": null,
              "state": null
            },
            "email": null,
            "name": null,
            "phone": null
          },
          "card": {
            "brand": "amex",
            "checks": {
              "address_line1_check": null,
              "address_postal_code_check": null,
              "cvc_check": "pass"
            },
            "country": "US",
            "exp_month": 4,
            "exp_year": 2057,
            "fingerprint": "jxvigucE5VnjHVHG",
            "funding": "credit",
            "generated_from": null,
            "last4": "8431",
            "networks": {
              "available": [
                "amex"
              ],
              "preferred": null
            },
            "three_d_secure_usage": {
              "supported": true
            },
            "wallet": null
          },
          "created": 1704885500,
          "customer": "cus_PJ3eJH9mtdNuTc",
          "livemode": false,
          "metadata": {},
          "type": "card"
        },
        {
          "id": "pm_1OWhXHKX1Bgoxru0viId0dYq",
          "object": "payment_method",
          "billing_details": {
            "address": {
              "city": null,
              "country": "IN",
              "line1": null,
              "line2": null,
              "postal_code": null,
              "state": null
            },
            "email": null,
            "name": null,
            "phone": null
          },
          "card": {
            "brand": "amex",
            "checks": {
              "address_line1_check": null,
              "address_postal_code_check": null,
              "cvc_check": "pass"
            },
            "country": "US",
            "exp_month": 9,
            "exp_year": 2064,
            "fingerprint": "ehcKDkSKRW2P4YD1",
            "funding": "credit",
            "generated_from": null,
            "last4": "0005",
            "networks": {
              "available": [
                "amex"
              ],
              "preferred": null
            },
            "three_d_secure_usage": {
              "supported": false
            },
            "wallet": null
          },
          "created": 1704815295,
          "customer": "cus_PJ3eJH9mtdNuTc",
          "livemode": false,
          "metadata": {},
          "type": "card"
        },
        {
          "id": "pm_1OWCRbKX1Bgoxru0IVtZkRMk",
          "object": "payment_method",
          "billing_details": {
            "address": {
              "city": null,
              "country": "IN",
              "line1": null,
              "line2": null,
              "postal_code": null,
              "state": null
            },
            "email": null,
            "name": null,
            "phone": null
          },
          "card": {
            "brand": "mastercard",
            "checks": {
              "address_line1_check": null,
              "address_postal_code_check": null,
              "cvc_check": "pass"
            },
            "country": "US",
            "exp_month": 8,
            "exp_year": 2032,
            "fingerprint": "iX8LgFQmeINm9HxM",
            "funding": "credit",
            "generated_from": null,
            "last4": "3222",
            "networks": {
              "available": [
                "mastercard"
              ],
              "preferred": null
            },
            "three_d_secure_usage": {
              "supported": true
            },
            "wallet": null
          },
          "created": 1704695779,
          "customer": "cus_PJ3eJH9mtdNuTc",
          "livemode": false,
          "metadata": {},
          "type": "card"
        },
       
      ]
    }
    

    mockSfdcContractService.fetchContracts.mockResolvedValue(SfdcContractsRes);
    mockPaymentMethodsService.getStripeCustomer.mockResolvedValue(CustomerIdResp);
    mockPaymentMethodsService.getPaymentMethods.mockResolvedValue(PaymentMethodsResp);

    const result = await service.fetchContracts(['0018I00000k1WugQAE'],['Activated','Suspended','Draft'],'ACT-01640982');

   expect(result.status).toEqual(1006);
 
  });

  // Exception Handling
  it('should throw an error if fetchContracts fails', async () => {
    mockSfdcContractService.fetchContracts.mockResolvedValue(null);

   const result =  await expect(service.fetchContracts(['0018I00000k1WugQAE'],['Activated','Suspended','Draft'],'ACT-01640982'));
    expect(mockSfdcContractService.fetchContracts).toBeCalledTimes(2);
  });

  //Get Contract details for perticuler contract by passing quote id
  // it('Should return contract details for perticular contract by passing quote id', async () => {
  //   const SfdcContractRes = [
  //     "Contract" {
  //       Asset_Locations__r: null,
  //       attributes: {
  //         type: 'Contract',
  //         url: '/services/data/v58.0/sobjects/Contract/8008I000000J93WQAS'
  //       },
  //       Id: '8008I000000J93WQAS',
  //       SBQQ__Quote__r: {
  //         attributes: [Object],
  //         Id: 'a6O8I000000HBqYUAW',
  //         Primary_Contact__c: 'David  Williams',
  //         SBQQ__PrimaryContact__r: [Object]
  //       },
  //       Name: null,
  //       Reference_Number__c: '513401',
  //       BillCycleDay__c: null,
  //       Billing_Period__c: '28 Day Bill Period',
  //       NF_EEC_Percent__c: 0,
  //       NF_ESF_Percent__c: 0,
  //       Fuel_Surcharge_Percent__c: 24,
  //       InvoiceDeliveryMethod__c: 'Email',
  //       LastBillingDate__c: null,
  //       Location_Code__c: 'FOX',
  //       Status: 'Draft',
  //       Order_Type__c: 'Recurring without End Date',
  //       Facility_Name__c: null,
  //       Bill_To_Contact_Name__c: 'David Williams',
  //       Bill_To_Contact_Email__c: null,
  //       Subdivision_Name__c: null,
  //       AutoPay__c: true,
  //       Payment_Method_ID__c: 'pm_1O4L0kKX1Bgoxru0itUlYTfV',
  //       StartDate: '2023-10-25',
  //       EndDate: '2049-12-31',
  //       AccountId: '0018I00000jJnLkQAK',
  //       CreatedDate: '2023-10-23T10:05:54.000+0000',
  //       LastModifiedDate: '2024-01-25T14:47:43.000+0000',
  //       Bill_to_Email_Address_1__c: null,
  //       Bill_to_Email_Address_2__c: null,
  //       Bill_to_Email_Address_3__c: null,
  //       Bill_to_Email_Address_4__c: null,
  //       Bill_to_Email_Address_5__c: null,
  //       Bill_to_Email_Address_6__c: null,
  //       Purchase_Order__r: {
  //         attributes: [Object],
  //         Id: 'aEx8I000000CcyjSAC',
  //         Name: '#PO-123456',
  //         Amount__c: 1000,
  //         Expiration_Date__c: '2049-12-31'
  //       },
  //       Ship_To__c: "Boston Children's Hospital\n300 Longwood Avenue, Boston, MA, 02115",
  //       Ship_To_Street__c: "Boston Children's Hospital\n300 Longwood Avenue",
  //       Ship_To_City__c: 'Boston',
  //       Ship_To_State__c: 'MA',
  //       Ship_To_Zip_Code__c: '02115',
  //       SecondaryBillToContact__r: null,
  //       PrimaryContact__r: {
  //         attributes: [Object],
  //         Id: '0038I00000foPAIQA2',
  //         FirstName: 'David',
  //         LastName: 'Williams',
  //         Phone: '9202354910',
  //         Email: 'gaurav.narvekar+43@zingworks.in',
  //         MailingStreet: null,
  //         MailingCity: null,
  //         MailingState: null,
  //         MailingStateCode: null,
  //         MailingPostalCode: null
  //       },
  //       Bill_To_Address__r: {
  //         attributes: [Object],
  //         Id: 'a8x8I000000CoorQAC',
  //         USF_Account__c: '0018I00000jJnLkQAK',
  //         Name: "Brigham and Women's Hospi - Boston - MA",
  //         NF_Parent_USF_Address__c: null,
  //         USF_Street__c: "Brigham and Women's Hospital, 75 Francis St, Boston, MA 02115, USA",
  //         USF_City__c: 'Boston',
  //         USF_State__c: 'MA',
  //         USF_Zip_Code__c: '02115',
  //         USF_Country__c: 'US',
  //         Address_Latitude_Longitude__Latitude__s: 42.33611,
  //         Address_Latitude_Longitude__Longitude__s: -71.10748,
  //         Is_Primary__c: false,
  //         USF_Ship_To_Address__c: true,
  //         USF_Bill_To_Address__c: false,
  //         NF_Is_Parent__c: true,
  //         Address_Validated__c: false,
  //         GeoCode_Accuracy__c: 'Address',
  //         Site_Name__c: "Brigham and Women's Hospital, 75 Francis St, Boston, MA 02115, USA",
  //         NF_Site_Hours_Start_Time__c: '09:30:00.125Z',
  //         NF_Site_Hours_End_Time__c: '18:30:00.125Z',
  //         NF_Arrival_Start_Time__c: null,
  //         NF_Arrival_End_Time__c: null,
  //         NF_Gate_Code__c: 'Gate 1',
  //         NF_Access_instructions__c: null,
  //         NF_Key_Instructions__c: null,
  //         NF_Other_Instructions__c: 'Near gate 1',
  //         NF_Placement__c: null,
  //         Additional_Information__c: 'Need Entry pass'
  //       },
  //       Maintenance_Plans__r: { totalSize: 2, done: true, records: [Array] },
  //       SBQQ__Subscriptions__r: { totalSize: 13, done: true, records: [Array] },
  //       Work_Orders__r: { totalSize: 2, done: true, records: [Array] }
  //     }
  //   ]

  //   const getStripeCustomerRes = {
  //     "object": "search_result",
  //     "data": [
  //       {
  //         "id": "cus_Oqz9HmcZ4fbWqR",
  //         "object": "customer",
  //         "address": null,
  //         "balance": 0,
  //         "created": 1697802492,
  //         "currency": null,
  //         "default_source": null,
  //         "delinquent": false,
  //         "description": null,
  //         "discount": null,
  //         "email": "gaurav.narvekar+43@zingworks.in",
  //         "invoice_prefix": "4E2A4611",
  //         "invoice_settings": {
  //           "custom_fields": null,
  //           "default_payment_method": null,
  //           "footer": null,
  //           "rendering_options": null
  //         },
  //         "livemode": false,
  //         "metadata": {
  //           "sfdc_account_id": "ACT-01640759"
  //         },
  //         "name": "Niagara Bottling, LLC",
  //         "next_invoice_sequence": 1,
  //         "phone": null,
  //         "preferred_locales": [],
  //         "shipping": null,
  //         "tax_exempt": "none",
  //         "test_clock": null
  //       }
  //     ],
  //     "has_more": false,
  //     "next_page": null,
  //     "url": "/v1/customers/search"
  //   }

  //   const SfdcgetContractDetailsRes = {
  //     "Asset_Locations__r": null,
  //     "attributes": {
  //       "type": "Contract",
  //       "url": "/services/data/v58.0/sobjects/Contract/8008I000000J93WQAS"
  //     },
  //     "Id": "8008I000000J93WQAS",
  //     "Name": null,
  //     "Reference_Number__c": "513401",
  //     "BillCycleDay__c": null,
  //     "Billing_Period__c": "28 Day Bill Period",
  //     "NF_EEC_Percent__c": 0,
  //     "NF_ESF_Percent__c": 0,
  //     "Fuel_Surcharge_Percent__c": 14.9,
  //     "InvoiceDeliveryMethod__c": "Email",
  //     "LastBillingDate__c": null,
  //     "Location_Code__c": "FOX",
  //     "Status": "Draft",
  //     "Order_Type__c": "Recurring without End Date",
  //     "Facility_Name__c": null,
  //     "Bill_To_Contact_Name__c": "David Williams",
  //     "Bill_To_Contact_Email__c": null,
  //     "Subdivision_Name__c": null,
  //     "AutoPay__c": true,
  //     "Payment_Method_ID__c": "pm_1O4L0kKX1Bgoxru0itUlYTfV",
  //     "StartDate": "2023-10-25",
  //     "EndDate": "2049-12-31",
  //     "AccountId": "0018I00000jJnLkQAK",
  //     "CreatedDate": "2023-10-23T10:05:54.000+0000",
  //     "LastModifiedDate": "2023-11-02T16:25:11.000+0000",
  //     "Bill_to_Email_Address_1__c": null,
  //     "Bill_to_Email_Address_2__c": null,
  //     "Bill_to_Email_Address_3__c": null,
  //     "Bill_to_Email_Address_4__c": null,
  //     "Bill_to_Email_Address_5__c": null,
  //     "Bill_to_Email_Address_6__c": null,
  //     "Purchase_Order__r": {
  //       "attributes": {
  //         "type": "Purchase_Order__c",
  //         "url": "/services/data/v58.0/sobjects/Purchase_Order__c/aEx8I000000CcyjSAC"
  //       },
  //       "Id": "aEx8I000000CcyjSAC",
  //       "Name": "#PO-123456",
  //       "Amount__c": 1000,
  //       "Expiration_Date__c": "2049-12-31"
  //     },
  //     "Ship_To__c": "Boston Children's Hospital\n300 Longwood Avenue, Boston, MA, 02115",
  //     "Ship_To_Street__c": "Boston Children's Hospital\n300 Longwood Avenue",
  //     "Ship_To_City__c": "Boston",
  //     "Ship_To_State__c": "MA",
  //     "Ship_To_Zip_Code__c": "02115",
  //     "SecondaryBillToContact__r": null,
  //     "PrimaryContact__r": {
  //       "attributes": {
  //         "type": "Contact",
  //         "url": "/services/data/v58.0/sobjects/Contact/0038I00000foPAIQA2"
  //       },
  //       "Id": "0038I00000foPAIQA2",
  //       "FirstName": "David",
  //       "LastName": "Williams",
  //       "Phone": "9202354910",
  //       "Email": "gaurav.narvekar+43@zingworks.in",
  //       "MailingStreet": null,
  //       "MailingCity": null,
  //       "MailingState": null,
  //       "MailingStateCode": null,
  //       "MailingPostalCode": null
  //     },
  //     "Bill_To_Address__r": {
  //       "attributes": {
  //         "type": "USF_Address__c",
  //         "url": "/services/data/v58.0/sobjects/USF_Address__c/a8x8I000000CoorQAC"
  //       },
  //       "Id": "a8x8I000000CoorQAC",
  //       "USF_Account__c": "0018I00000jJnLkQAK",
  //       "Name": "Brigham and Women's Hospi - Boston - MA",
  //       "NF_Parent_USF_Address__c": null,
  //       "USF_Street__c": "Brigham and Women's Hospital, 75 Francis St, Boston, MA 02115, USA",
  //       "USF_City__c": "Boston",
  //       "USF_State__c": "MA",
  //       "USF_Zip_Code__c": "02115",
  //       "USF_Country__c": "US",
  //       "Address_Latitude_Longitude__Latitude__s": 42.33611,
  //       "Address_Latitude_Longitude__Longitude__s": -71.10748,
  //       "Is_Primary__c": false,
  //       "USF_Ship_To_Address__c": true,
  //       "USF_Bill_To_Address__c": false,
  //       "NF_Is_Parent__c": true,
  //       "Address_Validated__c": false,
  //       "GeoCode_Accuracy__c": "Address",
  //       "Site_Name__c": "Brigham and Women's Hospital, 75 Francis St, Boston, MA 02115, USA",
  //       "NF_Site_Hours_Start_Time__c": "09:30:00.125Z",
  //       "NF_Site_Hours_End_Time__c": "18:30:00.125Z",
  //       "NF_Arrival_Start_Time__c": null,
  //       "NF_Arrival_End_Time__c": null,
  //       "NF_Gate_Code__c": "Gate 1",
  //       "NF_Access_instructions__c": null,
  //       "NF_Key_Instructions__c": null,
  //       "NF_Other_Instructions__c": "Near gate 1",
  //       "NF_Placement__c": null,
  //       "Additional_Information__c": "Need Entry pass"
  //     },
  //     "Maintenance_Plans__r": {
  //       "totalSize": 2,
  //       "done": true,
  //       "records": [
  //         {
  //           "attributes": {
  //             "type": "MaintenancePlan",
  //             "url": "/services/data/v58.0/sobjects/MaintenancePlan/1MP8I0000008llYWAQ"
  //           },
  //           "Id": "1MP8I0000008llYWAQ",
  //           "Subscription__c": "a6a8I000000Ha57QAC",
  //           "Active__c": false,
  //           "StartDate": "2023-10-27",
  //           "EndDate": "2049-12-31",
  //           "Day_of_Week__c": "Friday",
  //           "Last_Generated_Date__c": null,
  //           "Service_Frequency__c": "2x",
  //           "Site_Name__c": "300 Longwood Avenue, Boston, MA, USA",
  //           "Site_City__c": "Boston",
  //           "Frequency": 1,
  //           "FrequencyType": "Weeks",
  //           "Site_Address__r": {
  //             "attributes": {
  //               "type": "USF_Address__c",
  //               "url": "/services/data/v58.0/sobjects/USF_Address__c/a8x8I000000ComqQAC"
  //             },
  //             "Id": "a8x8I000000ComqQAC",
  //             "USF_Account__c": "0018I00000jJnLkQAK",
  //             "Name": "Boston Children's Hospita - Boston - MA",
  //             "NF_Parent_USF_Address__c": null,
  //             "USF_Street__c": "Boston Children's Hospital\n300 Longwood Avenue",
  //             "USF_City__c": "Boston",
  //             "USF_State__c": "MA",
  //             "USF_Zip_Code__c": "02115",
  //             "USF_Country__c": "US",
  //             "Address_Latitude_Longitude__Latitude__s": 42.33704,
  //             "Address_Latitude_Longitude__Longitude__s": -71.10561,
  //             "Is_Primary__c": false,
  //             "USF_Ship_To_Address__c": true,
  //             "USF_Bill_To_Address__c": false,
  //             "NF_Is_Parent__c": true,
  //             "Address_Validated__c": true,
  //             "GeoCode_Accuracy__c": "Address",
  //             "Site_Name__c": "300 Longwood Avenue, Boston, MA, USA",
  //             "NF_Site_Hours_Start_Time__c": null,
  //             "NF_Site_Hours_End_Time__c": null,
  //             "NF_Arrival_Start_Time__c": null,
  //             "NF_Arrival_End_Time__c": null,
  //             "NF_Gate_Code__c": "Gate A",
  //             "NF_Access_instructions__c": null,
  //             "NF_Key_Instructions__c": null,
  //             "NF_Other_Instructions__c": "Near at security cabin 1",
  //             "NF_Placement__c": "Testing 123",
  //             "Additional_Information__c": "Need entry pass"
  //           },
  //           "Maintenance_Lines__r": {
  //             "totalSize": 2,
  //             "done": true,
  //             "records": [
  //               {
  //                 "attributes": {
  //                   "type": "Maintenance_Line__c",
  //                   "url": "/services/data/v58.0/sobjects/Maintenance_Line__c/aAY8I0000008Y18WAE"
  //                 },
  //                 "Id": "aAY8I0000008Y18WAE",
  //                 "Customer_Owned__c": false,
  //                 "Product__r": {
  //                   "attributes": {
  //                     "type": "Product2",
  //                     "url": "/services/data/v58.0/sobjects/Product2/01t3m00000NTiw6AAD"
  //                   },
  //                   "ProductCode": "111-1001",
  //                   "Name": "Std Rest",
  //                   "Description": "Standard Restroom"
  //                 },
  //                 "Effective_From__c": "2023-10-25",
  //                 "End_Date__c": "2049-12-31",
  //                 "Quantity__c": 1,
  //                 "ServiceSubscription__c": "a6a8I000000Ha5GQAS",
  //                 "Subscription__c": "a6a8I000000Ha57QAC"
  //               },
  //               {
  //                 "attributes": {
  //                   "type": "Maintenance_Line__c",
  //                   "url": "/services/data/v58.0/sobjects/Maintenance_Line__c/aAY8I0000008Y1AWAU"
  //                 },
  //                 "Id": "aAY8I0000008Y1AWAU",
  //                 "Customer_Owned__c": false,
  //                 "Product__r": {
  //                   "attributes": {
  //                     "type": "Product2",
  //                     "url": "/services/data/v58.0/sobjects/Product2/01t3m00000NTiuFAAT"
  //                   },
  //                   "ProductCode": "121-1102",
  //                   "Name": "2 Stn Hand Sink",
  //                   "Description": "2 Station Hand Wash Sink"
  //                 },
  //                 "Effective_From__c": "2023-10-25",
  //                 "End_Date__c": "2049-12-31",
  //                 "Quantity__c": 1,
  //                 "ServiceSubscription__c": "a6a8I000000Ha5CQAS",
  //                 "Subscription__c": "a6a8I000000Ha58QAC"
  //               }
  //             ]
  //           }
  //         },
  //         {
  //           "attributes": {
  //             "type": "MaintenancePlan",
  //             "url": "/services/data/v58.0/sobjects/MaintenancePlan/1MP8I0000008llZWAQ"
  //           },
  //           "Id": "1MP8I0000008llZWAQ",
  //           "Subscription__c": "a6a8I000000Ha57QAC",
  //           "Active__c": false,
  //           "StartDate": "2023-10-31",
  //           "EndDate": "2049-12-31",
  //           "Day_of_Week__c": "Tuesday",
  //           "Last_Generated_Date__c": null,
  //           "Service_Frequency__c": "2x",
  //           "Site_Name__c": "300 Longwood Avenue, Boston, MA, USA",
  //           "Site_City__c": "Boston",
  //           "Frequency": 1,
  //           "FrequencyType": "Weeks",
  //           "Site_Address__r": {
  //             "attributes": {
  //               "type": "USF_Address__c",
  //               "url": "/services/data/v58.0/sobjects/USF_Address__c/a8x8I000000ComqQAC"
  //             },
  //             "Id": "a8x8I000000ComqQAC",
  //             "USF_Account__c": "0018I00000jJnLkQAK",
  //             "Name": "Boston Children's Hospita - Boston - MA",
  //             "NF_Parent_USF_Address__c": null,
  //             "USF_Street__c": "Boston Children's Hospital\n300 Longwood Avenue",
  //             "USF_City__c": "Boston",
  //             "USF_State__c": "MA",
  //             "USF_Zip_Code__c": "02115",
  //             "USF_Country__c": "US",
  //             "Address_Latitude_Longitude__Latitude__s": 42.33704,
  //             "Address_Latitude_Longitude__Longitude__s": -71.10561,
  //             "Is_Primary__c": false,
  //             "USF_Ship_To_Address__c": true,
  //             "USF_Bill_To_Address__c": false,
  //             "NF_Is_Parent__c": true,
  //             "Address_Validated__c": true,
  //             "GeoCode_Accuracy__c": "Address",
  //             "Site_Name__c": "300 Longwood Avenue, Boston, MA, USA",
  //             "NF_Site_Hours_Start_Time__c": null,
  //             "NF_Site_Hours_End_Time__c": null,
  //             "NF_Arrival_Start_Time__c": null,
  //             "NF_Arrival_End_Time__c": null,
  //             "NF_Gate_Code__c": "Gate A",
  //             "NF_Access_instructions__c": null,
  //             "NF_Key_Instructions__c": null,
  //             "NF_Other_Instructions__c": "Near at security cabin 1",
  //             "NF_Placement__c": "Testing 123",
  //             "Additional_Information__c": "Need entry pass"
  //           },
  //           "Maintenance_Lines__r": {
  //             "totalSize": 2,
  //             "done": true,
  //             "records": [
  //               {
  //                 "attributes": {
  //                   "type": "Maintenance_Line__c",
  //                   "url": "/services/data/v58.0/sobjects/Maintenance_Line__c/aAY8I0000008Y19WAE"
  //                 },
  //                 "Id": "aAY8I0000008Y19WAE",
  //                 "Customer_Owned__c": false,
  //                 "Product__r": {
  //                   "attributes": {
  //                     "type": "Product2",
  //                     "url": "/services/data/v58.0/sobjects/Product2/01t3m00000NTiw6AAD"
  //                   },
  //                   "ProductCode": "111-1001",
  //                   "Name": "Std Rest",
  //                   "Description": "Standard Restroom"
  //                 },
  //                 "Effective_From__c": "2023-10-25",
  //                 "End_Date__c": "2049-12-31",
  //                 "Quantity__c": 1,
  //                 "ServiceSubscription__c": "a6a8I000000Ha5GQAS",
  //                 "Subscription__c": "a6a8I000000Ha57QAC"
  //               },
  //               {
  //                 "attributes": {
  //                   "type": "Maintenance_Line__c",
  //                   "url": "/services/data/v58.0/sobjects/Maintenance_Line__c/aAY8I0000008Y1BWAU"
  //                 },
  //                 "Id": "aAY8I0000008Y1BWAU",
  //                 "Customer_Owned__c": false,
  //                 "Product__r": {
  //                   "attributes": {
  //                     "type": "Product2",
  //                     "url": "/services/data/v58.0/sobjects/Product2/01t3m00000NTiuFAAT"
  //                   },
  //                   "ProductCode": "121-1102",
  //                   "Name": "2 Stn Hand Sink",
  //                   "Description": "2 Station Hand Wash Sink"
  //                 },
  //                 "Effective_From__c": "2023-10-25",
  //                 "End_Date__c": "2049-12-31",
  //                 "Quantity__c": 1,
  //                 "ServiceSubscription__c": "a6a8I000000Ha5CQAS",
  //                 "Subscription__c": "a6a8I000000Ha58QAC"
  //               }
  //             ]
  //           }
  //         }
  //       ]
  //     },
  //     "SBQQ__Subscriptions__r": {
  //       "totalSize": 13,
  //       "done": true,
  //       "records": [
  //         {
  //           "attributes": {
  //             "type": "SBQQ__Subscription__c",
  //             "url": "/services/data/v58.0/sobjects/SBQQ__Subscription__c/a6a8I000000Ha57QAC"
  //           },
  //           "Id": "a6a8I000000Ha57QAC",
  //           "SBQQ__RequiredById__c": null,
  //           "SBQQ__StartDate__c": "2023-10-25",
  //           "SBQQ__EndDate__c": "2049-12-31",
  //           "NF_Service_Start_Date__c": null,
  //           "NF_Service_End_Date__c": null,
  //           "Price_Override__c": 0,
  //           "Product_Type__c": "Bundle",
  //           "SBQQ__ChargeType__c": "Recurring",
  //           "SBQQ__Product__r": {
  //             "attributes": {
  //               "type": "Product2",
  //               "url": "/services/data/v58.0/sobjects/Product2/01t3m00000PPH5MAAX"
  //             },
  //             "Id": "01t3m00000PPH5MAAX",
  //             "ProductCode": "110-0000",
  //             "Name": "Restroom Bundle",
  //             "Description": "Restroom Bundle Configuration",
  //             "SBQQ__Taxable__c": false
  //           },
  //           "SBQQ__Quantity__c": 1,
  //           "AVA_SFCPQ__TaxAmount__c": null
  //         },
  //         {
  //           "attributes": {
  //             "type": "SBQQ__Subscription__c",
  //             "url": "/services/data/v58.0/sobjects/SBQQ__Subscription__c/a6a8I000000Ha58QAC"
  //           },
  //           "Id": "a6a8I000000Ha58QAC",
  //           "SBQQ__RequiredById__c": null,
  //           "SBQQ__StartDate__c": "2023-10-25",
  //           "SBQQ__EndDate__c": "2049-12-31",
  //           "NF_Service_Start_Date__c": null,
  //           "NF_Service_End_Date__c": null,
  //           "Price_Override__c": 0,
  //           "Product_Type__c": "Bundle",
  //           "SBQQ__ChargeType__c": "Recurring",
  //           "SBQQ__Product__r": {
  //             "attributes": {
  //               "type": "Product2",
  //               "url": "/services/data/v58.0/sobjects/Product2/01t3m00000PPH5RAAX"
  //             },
  //             "Id": "01t3m00000PPH5RAAX",
  //             "ProductCode": "120-0000",
  //             "Name": "Hand Cleaning Bundle",
  //             "Description": "Hand Cleaning Bundle Configuration",
  //             "SBQQ__Taxable__c": false
  //           },
  //           "SBQQ__Quantity__c": 1,
  //           "AVA_SFCPQ__TaxAmount__c": null
  //         },
  //         {
  //           "attributes": {
  //             "type": "SBQQ__Subscription__c",
  //             "url": "/services/data/v58.0/sobjects/SBQQ__Subscription__c/a6a8I000000Ha59QAC"
  //           },
  //           "Id": "a6a8I000000Ha59QAC",
  //           "SBQQ__RequiredById__c": "a6a8I000000Ha58QAC",
  //           "SBQQ__StartDate__c": "2023-10-25",
  //           "SBQQ__EndDate__c": "2049-12-31",
  //           "NF_Service_Start_Date__c": null,
  //           "NF_Service_End_Date__c": null,
  //           "Price_Override__c": 15,
  //           "Product_Type__c": "P n D",
  //           "SBQQ__ChargeType__c": "One-Time",
  //           "SBQQ__Product__r": {
  //             "attributes": {
  //               "type": "Product2",
  //               "url": "/services/data/v58.0/sobjects/Product2/01t3m00000POh0MAAT"
  //             },
  //             "Id": "01t3m00000POh0MAAT",
  //             "ProductCode": "123-3010",
  //             "Name": "Pick Hand per Unit",
  //             "Description": "Pickup Hand Cleaning - Per Unit Charge",
  //             "SBQQ__Taxable__c": false
  //           },
  //           "SBQQ__Quantity__c": 1,
  //           "AVA_SFCPQ__TaxAmount__c": null
  //         },
  //         {
  //           "attributes": {
  //             "type": "SBQQ__Subscription__c",
  //             "url": "/services/data/v58.0/sobjects/SBQQ__Subscription__c/a6a8I000000Ha5AQAS"
  //           },
  //           "Id": "a6a8I000000Ha5AQAS",
  //           "SBQQ__RequiredById__c": "a6a8I000000Ha57QAC",
  //           "SBQQ__StartDate__c": "2023-10-25",
  //           "SBQQ__EndDate__c": "2049-12-31",
  //           "NF_Service_Start_Date__c": null,
  //           "NF_Service_End_Date__c": null,
  //           "Price_Override__c": 40,
  //           "Product_Type__c": "Asset",
  //           "SBQQ__ChargeType__c": "Recurring",
  //           "SBQQ__Product__r": {
  //             "attributes": {
  //               "type": "Product2",
  //               "url": "/services/data/v58.0/sobjects/Product2/01t3m00000NTiw6AAD"
  //             },
  //             "Id": "01t3m00000NTiw6AAD",
  //             "ProductCode": "111-1001",
  //             "Name": "Std Rest",
  //             "Description": "Standard Restroom",
  //             "SBQQ__Taxable__c": false
  //           },
  //           "SBQQ__Quantity__c": 1,
  //           "AVA_SFCPQ__TaxAmount__c": null
  //         },
  //         {
  //           "attributes": {
  //             "type": "SBQQ__Subscription__c",
  //             "url": "/services/data/v58.0/sobjects/SBQQ__Subscription__c/a6a8I000000Ha5BQAS"
  //           },
  //           "Id": "a6a8I000000Ha5BQAS",
  //           "SBQQ__RequiredById__c": "a6a8I000000Ha58QAC",
  //           "SBQQ__StartDate__c": "2023-10-25",
  //           "SBQQ__EndDate__c": "2049-12-31",
  //           "NF_Service_Start_Date__c": null,
  //           "NF_Service_End_Date__c": null,
  //           "Price_Override__c": 15,
  //           "Product_Type__c": "P n D",
  //           "SBQQ__ChargeType__c": "One-Time",
  //           "SBQQ__Product__r": {
  //             "attributes": {
  //               "type": "Product2",
  //               "url": "/services/data/v58.0/sobjects/Product2/01t3m00000POh0HAAT"
  //             },
  //             "Id": "01t3m00000POh0HAAT",
  //             "ProductCode": "123-3009",
  //             "Name": "Del Hand per Unit",
  //             "Description": "Delivery Hand Cleaning - Per Unit Charge",
  //             "SBQQ__Taxable__c": false
  //           },
  //           "SBQQ__Quantity__c": 1,
  //           "AVA_SFCPQ__TaxAmount__c": null
  //         },
  //         {
  //           "attributes": {
  //             "type": "SBQQ__Subscription__c",
  //             "url": "/services/data/v58.0/sobjects/SBQQ__Subscription__c/a6a8I000000Ha5CQAS"
  //           },
  //           "Id": "a6a8I000000Ha5CQAS",
  //           "SBQQ__RequiredById__c": "a6a8I000000Ha58QAC",
  //           "SBQQ__StartDate__c": "2023-10-25",
  //           "SBQQ__EndDate__c": "2049-12-31",
  //           "NF_Service_Start_Date__c": "2023-10-25",
  //           "NF_Service_End_Date__c": "2049-12-31",
  //           "Price_Override__c": 328.28,
  //           "Product_Type__c": "Service",
  //           "SBQQ__ChargeType__c": "Recurring",
  //           "SBQQ__Product__r": {
  //             "attributes": {
  //               "type": "Product2",
  //               "url": "/services/data/v58.0/sobjects/Product2/01t3m00000POgyQAAT"
  //             },
  //             "Id": "01t3m00000POgyQAAT",
  //             "ProductCode": "122-2002",
  //             "Name": "1 Svc 2 Days Wk",
  //             "Description": "1 Service 2 Days per Week",
  //             "SBQQ__Taxable__c": false
  //           },
  //           "SBQQ__Quantity__c": 1,
  //           "AVA_SFCPQ__TaxAmount__c": null
  //         },
  //         {
  //           "attributes": {
  //             "type": "SBQQ__Subscription__c",
  //             "url": "/services/data/v58.0/sobjects/SBQQ__Subscription__c/a6a8I000000Ha5DQAS"
  //           },
  //           "Id": "a6a8I000000Ha5DQAS",
  //           "SBQQ__RequiredById__c": "a6a8I000000Ha58QAC",
  //           "SBQQ__StartDate__c": "2023-10-25",
  //           "SBQQ__EndDate__c": "2049-12-31",
  //           "NF_Service_Start_Date__c": null,
  //           "NF_Service_End_Date__c": null,
  //           "Price_Override__c": 40,
  //           "Product_Type__c": "Asset",
  //           "SBQQ__ChargeType__c": "Recurring",
  //           "SBQQ__Product__r": {
  //             "attributes": {
  //               "type": "Product2",
  //               "url": "/services/data/v58.0/sobjects/Product2/01t3m00000NTiuFAAT"
  //             },
  //             "Id": "01t3m00000NTiuFAAT",
  //             "ProductCode": "121-1102",
  //             "Name": "2 Stn Hand Sink",
  //             "Description": "2 Station Hand Wash Sink",
  //             "SBQQ__Taxable__c": false
  //           },
  //           "SBQQ__Quantity__c": 1,
  //           "AVA_SFCPQ__TaxAmount__c": null
  //         },
  //         {
  //           "attributes": {
  //             "type": "SBQQ__Subscription__c",
  //             "url": "/services/data/v58.0/sobjects/SBQQ__Subscription__c/a6a8I000000Ha5EQAS"
  //           },
  //           "Id": "a6a8I000000Ha5EQAS",
  //           "SBQQ__RequiredById__c": "a6a8I000000Ha57QAC",
  //           "SBQQ__StartDate__c": "2023-10-25",
  //           "SBQQ__EndDate__c": "2049-12-31",
  //           "NF_Service_Start_Date__c": null,
  //           "NF_Service_End_Date__c": null,
  //           "Price_Override__c": 15,
  //           "Product_Type__c": "P n D",
  //           "SBQQ__ChargeType__c": "One-Time",
  //           "SBQQ__Product__r": {
  //             "attributes": {
  //               "type": "Product2",
  //               "url": "/services/data/v58.0/sobjects/Product2/01t3m00000POgxNAAT"
  //             },
  //             "Id": "01t3m00000POgxNAAT",
  //             "ProductCode": "113-3010",
  //             "Name": "Pick Rest per Unit",
  //             "Description": "Pickup Restroom - Per Unit Charge",
  //             "SBQQ__Taxable__c": false
  //           },
  //           "SBQQ__Quantity__c": 1,
  //           "AVA_SFCPQ__TaxAmount__c": null
  //         },
  //         {
  //           "attributes": {
  //             "type": "SBQQ__Subscription__c",
  //             "url": "/services/data/v58.0/sobjects/SBQQ__Subscription__c/a6a8I000000Ha5FQAS"
  //           },
  //           "Id": "a6a8I000000Ha5FQAS",
  //           "SBQQ__RequiredById__c": "a6a8I000000Ha57QAC",
  //           "SBQQ__StartDate__c": "2023-10-25",
  //           "SBQQ__EndDate__c": "2049-12-31",
  //           "NF_Service_Start_Date__c": null,
  //           "NF_Service_End_Date__c": null,
  //           "Price_Override__c": 15,
  //           "Product_Type__c": "P n D",
  //           "SBQQ__ChargeType__c": "One-Time",
  //           "SBQQ__Product__r": {
  //             "attributes": {
  //               "type": "Product2",
  //               "url": "/services/data/v58.0/sobjects/Product2/01t3m00000POgxIAAT"
  //             },
  //             "Id": "01t3m00000POgxIAAT",
  //             "ProductCode": "113-3009",
  //             "Name": "Del Rest per Unit",
  //             "Description": "Delivery Restroom - Per Unit Charge",
  //             "SBQQ__Taxable__c": false
  //           },
  //           "SBQQ__Quantity__c": 1,
  //           "AVA_SFCPQ__TaxAmount__c": null
  //         },
  //         {
  //           "attributes": {
  //             "type": "SBQQ__Subscription__c",
  //             "url": "/services/data/v58.0/sobjects/SBQQ__Subscription__c/a6a8I000000Ha5GQAS"
  //           },
  //           "Id": "a6a8I000000Ha5GQAS",
  //           "SBQQ__RequiredById__c": "a6a8I000000Ha57QAC",
  //           "SBQQ__StartDate__c": "2023-10-25",
  //           "SBQQ__EndDate__c": "2049-12-31",
  //           "NF_Service_Start_Date__c": "2023-10-25",
  //           "NF_Service_End_Date__c": "2049-12-31",
  //           "Price_Override__c": 336.48,
  //           "Product_Type__c": "Service",
  //           "SBQQ__ChargeType__c": "Recurring",
  //           "SBQQ__Product__r": {
  //             "attributes": {
  //               "type": "Product2",
  //               "url": "/services/data/v58.0/sobjects/Product2/01t3m00000POgudAAD"
  //             },
  //             "Id": "01t3m00000POgudAAD",
  //             "ProductCode": "112-2002",
  //             "Name": "1 Svc 2 Days Wk",
  //             "Description": "1 Service 2 Days per Week",
  //             "SBQQ__Taxable__c": false
  //           },
  //           "SBQQ__Quantity__c": 1,
  //           "AVA_SFCPQ__TaxAmount__c": null
  //         },
  //         {
  //           "attributes": {
  //             "type": "SBQQ__Subscription__c",
  //             "url": "/services/data/v58.0/sobjects/SBQQ__Subscription__c/a6a8I000000Ha5HQAS"
  //           },
  //           "Id": "a6a8I000000Ha5HQAS",
  //           "SBQQ__RequiredById__c": null,
  //           "SBQQ__StartDate__c": "2023-10-25",
  //           "SBQQ__EndDate__c": "2049-12-31",
  //           "NF_Service_Start_Date__c": null,
  //           "NF_Service_End_Date__c": null,
  //           "Price_Override__c": 45,
  //           "Product_Type__c": "P n D",
  //           "SBQQ__ChargeType__c": "One-Time",
  //           "SBQQ__Product__r": {
  //             "attributes": {
  //               "type": "Product2",
  //               "url": "/services/data/v58.0/sobjects/Product2/01t3m00000POgwyAAD"
  //             },
  //             "Id": "01t3m00000POgwyAAD",
  //             "ProductCode": "113-3005",
  //             "Name": "Pick Sani Standard",
  //             "Description": "Pickup Sanitation - Standard",
  //             "SBQQ__Taxable__c": false
  //           },
  //           "SBQQ__Quantity__c": 1,
  //           "AVA_SFCPQ__TaxAmount__c": null
  //         },
  //         {
  //           "attributes": {
  //             "type": "SBQQ__Subscription__c",
  //             "url": "/services/data/v58.0/sobjects/SBQQ__Subscription__c/a6a8I000000Ha5IQAS"
  //           },
  //           "Id": "a6a8I000000Ha5IQAS",
  //           "SBQQ__RequiredById__c": null,
  //           "SBQQ__StartDate__c": "2023-10-25",
  //           "SBQQ__EndDate__c": "2049-12-31",
  //           "NF_Service_Start_Date__c": null,
  //           "NF_Service_End_Date__c": null,
  //           "Price_Override__c": 45,
  //           "Product_Type__c": "P n D",
  //           "SBQQ__ChargeType__c": "One-Time",
  //           "SBQQ__Product__r": {
  //             "attributes": {
  //               "type": "Product2",
  //               "url": "/services/data/v58.0/sobjects/Product2/01t3m00000POgwjAAD"
  //             },
  //             "Id": "01t3m00000POgwjAAD",
  //             "ProductCode": "113-3001",
  //             "Name": "Del Sani Standard",
  //             "Description": "Delivery Sanitation - Standard",
  //             "SBQQ__Taxable__c": false
  //           },
  //           "SBQQ__Quantity__c": 1,
  //           "AVA_SFCPQ__TaxAmount__c": null
  //         },
  //         {
  //           "attributes": {
  //             "type": "SBQQ__Subscription__c",
  //             "url": "/services/data/v58.0/sobjects/SBQQ__Subscription__c/a6a8I000000Ha5JQAS"
  //           },
  //           "Id": "a6a8I000000Ha5JQAS",
  //           "SBQQ__RequiredById__c": null,
  //           "SBQQ__StartDate__c": "2023-10-25",
  //           "SBQQ__EndDate__c": "2049-12-31",
  //           "NF_Service_Start_Date__c": null,
  //           "NF_Service_End_Date__c": null,
  //           "Price_Override__c": 0,
  //           "Product_Type__c": "Ancillary",
  //           "SBQQ__ChargeType__c": "One-Time",
  //           "SBQQ__Product__r": {
  //             "attributes": {
  //               "type": "Product2",
  //               "url": "/services/data/v58.0/sobjects/Product2/01t3m00000POgxhAAD"
  //             },
  //             "Id": "01t3m00000POgxhAAD",
  //             "ProductCode": "113-3501",
  //             "Name": "Permit Fee",
  //             "Description": "Permit Fee",
  //             "SBQQ__Taxable__c": false
  //           },
  //           "SBQQ__Quantity__c": 1,
  //           "AVA_SFCPQ__TaxAmount__c": null
  //         }
  //       ]
  //     },
  //     "Work_Orders__r": {
  //       "totalSize": 2,
  //       "done": true,
  //       "records": [
  //         {
  //           "attributes": {
  //             "type": "WorkOrder",
  //             "url": "/services/data/v58.0/sobjects/WorkOrder/0WO8I000000ghN1WAI"
  //           },
  //           "Id": "0WO8I000000ghN1WAI",
  //           "WorkType": {
  //             "attributes": {
  //               "type": "WorkType",
  //               "url": "/services/data/v58.0/sobjects/WorkType/08q8I0000008QGgQAM"
  //             },
  //             "Name": "Pickup"
  //           },
  //           "Site_Address__c": "a8x8I000000ComqQAC",
  //           "Status": "New",
  //           "StartDate": "2049-12-31T05:01:00.000+0000",
  //           "EndDate": "2050-01-01T04:59:00.000+0000",
  //           "Actual_Start__c": null,
  //           "Actual_End__c": null,
  //           "Duration": 19,
  //           "DurationInMinutes": 19,
  //           "Product_Information__c": "Std Rest : 1, 2 Stn Hand Sink : 1",
  //           "ShipTo_Information__c": "Placement - Testing 123\nOther Instructions - Near at security cabin 1",
  //           "Special_Instructions__c": "Background Check - Required\nAdditional Information - Need entry pass",
  //           "Count_of_WOLI__c": 2,
  //           "Completed_WOLI__c": 0,
  //           "Pickup_Reason_Code__c": null,
  //           "Service_Appointments__r": {
  //             "totalSize": 1,
  //             "done": true,
  //             "records": [
  //               {
  //                 "attributes": {
  //                   "type": "ServiceAppointment",
  //                   "url": "/services/data/v58.0/sobjects/ServiceAppointment/08p8I000001974dQAA"
  //                 },
  //                 "Id": "08p8I000001974dQAA",
  //                 "Status": "None",
  //                 "EarliestStartTime": "2049-12-31T05:01:00.000+0000",
  //                 "DueDate": "2050-01-01T04:59:00.000+0000",
  //                 "SchedStartTime": null,
  //                 "SchedEndTime": null,
  //                 "Canceled_Reason__c": null,
  //                 "ActualStartTime": null,
  //                 "ActualEndTime": null,
  //                 "FSL__InternalSLRGeolocation__Latitude__s": 42.33761,
  //                 "FSL__InternalSLRGeolocation__Longitude__s": -71.105829,
  //                 "ServiceResources": null
  //               }
  //             ]
  //           }
  //         },
  //         {
  //           "attributes": {
  //             "type": "WorkOrder",
  //             "url": "/services/data/v58.0/sobjects/WorkOrder/0WO8I000000ghN2WAI"
  //           },
  //           "Id": "0WO8I000000ghN2WAI",
  //           "WorkType": {
  //             "attributes": {
  //               "type": "WorkType",
  //               "url": "/services/data/v58.0/sobjects/WorkType/08q8I0000008QGLQA2"
  //             },
  //             "Name": "Delivery"
  //           },
  //           "Site_Address__c": "a8x8I000000ComqQAC",
  //           "Status": "New",
  //           "StartDate": "2023-10-25T04:01:01.000+0000",
  //           "EndDate": "2023-10-26T03:59:59.000+0000",
  //           "Actual_Start__c": null,
  //           "Actual_End__c": null,
  //           "Duration": 22,
  //           "DurationInMinutes": 22,
  //           "Product_Information__c": "Std Rest : 1, 2 Stn Hand Sink : 1",
  //           "ShipTo_Information__c": "Placement - Testing 123\nOther Instructions - Near at security cabin 1",
  //           "Special_Instructions__c": "Background Check - Required\nAdditional Information - Need entry pass",
  //           "Count_of_WOLI__c": 2,
  //           "Completed_WOLI__c": 0,
  //           "Pickup_Reason_Code__c": null,
  //           "Service_Appointments__r": null
  //         }
  //       ]
  //     }
  //   }

  //   const getPaymentDetailsRes = {
  //     "id": "pm_1O4L0kKX1Bgoxru0itUlYTfV",
  //     "object": "payment_method",
  //     "billing_details": {
  //       "address": {
  //         "city": null,
  //         "country": "IN",
  //         "line1": null,
  //         "line2": null,
  //         "postal_code": null,
  //         "state": null
  //       },
  //       "email": null,
  //       "name": null,
  //       "phone": null
  //     },
  //     "card": {
  //       "brand": "mastercard",
  //       "checks": {
  //         "address_line1_check": null,
  //         "address_postal_code_check": null,
  //         "cvc_check": "pass"
  //       },
  //       "country": "US",
  //       "exp_month": 6,
  //       "exp_year": 2027,
  //       "fingerprint": "iX8LgFQmeINm9HxM",
  //       "funding": "credit",
  //       "generated_from": null,
  //       "last4": "3222",
  //       "networks": {
  //         "available": [
  //           "mastercard"
  //         ],
  //         "preferred": null
  //       },
  //       "three_d_secure_usage": {
  //         "supported": true
  //       },
  //       "wallet": null
  //     },
  //     "created": 1698055527,
  //     "customer": "cus_Oqz9HmcZ4fbWqR",
  //     "livemode": false,
  //     "metadata": {},
  //     "type": "card"
  //   }
  //   mockPaymentMethodsService.getStripeCustomer.mockResolvedValue(getStripeCustomerRes);
  //   mockSfdcContractService.getContractDetails.mockResolvedValue(SfdcgetContractDetailsRes);
  //   mockPaymentMethodsService.getPaymentDetails.mockResolvedValue(getPaymentDetailsRes);

  //   const contract = await service.getContractDetails('ACT-01640759','8008I000000J93WQAS',);

  //   expect(contract.data).toEqual(SfdcContractRes);
  
  // });


});

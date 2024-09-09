import { Test, TestingModule } from '@nestjs/testing';
import { PaymentMethodsController } from './payment.controller';
import { PaymentMethodsService } from '../../services/payment/payment-methods.service';
import { StripeService } from '../../../backend/stripe/services/stripe/stripe.service';
import {
  Stripe_getPaymentMethods_FailureResponse,
  Stripe_getPaymentMethods_Request,
  Stripe_getPaymentMethods_SuccessResponse,
  Stripe_getStripeCustomer_failureResponse,
  Stripe_getStripeCustomer_Request,
  Stripe_getStripeCustomer_successResponse,
  Stripe_setupIntent_FailureResponse,
  Stripe_setupIntent_Request,
  Stripe_setupIntent_SuccessResponse,
} from '../../models/stripe';
import { UserService } from '../../services/user/user.service';
import { SfdcContractService } from '../../../backend/sfdc/services/sfdc-contract/sfdc-contract.service';
import { ContractService } from '../../services/contract/contract.service';
import { SfdcQuoteService } from '../../../backend/sfdc/services/sfdc-quote/sfdc-quote.service';
import { SfdcUssPortalUserService } from '../../../backend/sfdc/services/sfdc-uss-portal-user/sfdc-uss-portal-user.service';
import {SfdcBaseService} from '../../../backend/sfdc/services/sfdc-base/sfdc-base.service';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../../core/logger/logger.service';
import { CacheService } from '../../../core/cache/cache.service';
jest.mock('../../../core/cache/cache.service');
import { SfdcDocumentService } from '../../../backend/sfdc/services/sfdc-document/sfdc-document.service';
import { SfdcAccountService } from '../../../backend/sfdc/services/sfdc-account/sfdc-account.service';
import {ApiRespDTO} from '../../../common/dto/api-resp.dto';
import {StripeCreateCustomerReqDTO, StripeGetPaymentMethodsReqDTO, StripeSetupIntentReqDTO} from "./dto/payment-req.dto";
import { TrackUserActionService } from '../../../core/track-user-action/track-user-action-service';

describe('PaymentMethodsController', () => {
  let controller: PaymentMethodsController;

  let mockPaymentMethodsService = {
    getStripeCustomer: jest.fn(),
    createNewStripeCustomer: jest.fn(),
    getPaymentMethods: jest.fn(),
    createSetupIntent: jest.fn(),
  };

  let mockStripeService = {
    getCustomerByUSSAccountId: jest.fn(),
    getPaymentMethods: jest.fn(),
    createCustomer: jest.fn(),
    createSetupIntent: jest.fn(),
  };

  // Let mock user service 
  let mockUserService = {
    fetchUsersDetails: jest.fn(),
    hasAccessToAccountold: jest.fn(),
    hasAccessToAccount: jest.fn(),
    fetchProfile: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    updateCache: jest.fn(),


  };

  // Get / Create stripe customer - Request
  let getCustomerRequest: StripeCreateCustomerReqDTO = {
    accountNumber:  "ACT-01640759",
    email:  "gaurav.narvekar+43@zingworks.in",
    accountName:   "Niagara Bottling, LLC",
  };
   
   
   
 
  
   


  // Get / Create stripe customer - Success Response
  let getCustomerSuccessResponse: ApiRespDTO<any> = {
    success: true,
    status: 1000,
    message: 'Success',
    data: {
      stripeCustomerId: 'cus_Oqz9HmcZ4fbWqR',
      exist: true,
    },
  };

  // Get / Create stripe customer - Failure Response

  let getCustomerFailureResponse: Stripe_getStripeCustomer_failureResponse = {
    status: 200,
    message: 'Fail',
    data: {
      error: 'Something went wrong',
    },
  };

  // Get payment methods list - Request

  let getPaymentMethodsRequest: Stripe_getPaymentMethods_Request = {
    stripeCustomerId: 'cus_OOFVB9Bu0LaaLo',
  };


  // Get paayment methods list - Failure Response

  let getPaymentMethodFailureResponse: Stripe_getPaymentMethods_FailureResponse =
    {
      status: 200,
      message: 'Fail',
      data: {
        error: 'Something went wrong',
      },
    };

  // Create setup intent - Request
  let createSetupIntentRequest: Stripe_setupIntent_Request = {
    customer_id: 'cus_OOFVB9Bu0LaaLo',
  };

  //Create setup intent - Success Response
  let createSetupIntentSuccessResponse: Stripe_setupIntent_SuccessResponse = {
    message: 'Success',
    client_secret:
      'seti_1NuYxZKX1Bgoxru0MP42pxH3_secret_OhyvgqjkkzH6aWkwGr6IlGKu3I7qCP1',
  };

  //Create setup intent - Failure Response

  let createSetupIntentFailureResponse: Stripe_setupIntent_FailureResponse = {
    message: 'Fail',
    status: 200,
    data: {
      error: 'Something went wrong',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentMethodsController],
      providers: [
      
        SfdcContractService,
        ContractService,
        SfdcQuoteService,
        SfdcUssPortalUserService,
        SfdcBaseService,
        ConfigService,
        LoggerService,
        SfdcDocumentService,
        SfdcAccountService,
        TrackUserActionService,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: PaymentMethodsService,
          useValue: mockPaymentMethodsService,
        },
        {
          provide: StripeService,
          useValue: mockStripeService,
        },
        CacheService,
      ],
    }).compile();

    controller = module.get<PaymentMethodsController>(PaymentMethodsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Stripe get customer / create customer - Success Scenario

  it('Should return stripe customer id of existing customer', async () => {
   
    const req = {
      user: {
        sub: '1234567890'
      }
    };
    const paymentMethodServicceRes =  {
      "object": "search_result",
      "data": [
        {
          "id": "cus_Oqz9HmcZ4fbWqR",
          "object": "customer",
          "address": null,
          "balance": 0,
          "created": 1697802492,
          "currency": null,
          "default_source": null,
          "delinquent": false,
          "description": null,
          "discount": null,
          "email": "gaurav.narvekar+43@zingworks.in",
          "invoice_prefix": "4E2A4611",
          "invoice_settings": {
            "custom_fields": null,
            "default_payment_method": null,
            "footer": null,
            "rendering_options": null
          },
          "livemode": false,
          "metadata": {
            "sfdc_account_id": "ACT-01640759"
          },
          "name": "Niagara Bottling, LLC",
          "next_invoice_sequence": 1,
          "phone": null,
          "preferred_locales": [],
          "shipping": null,
          "tax_exempt": "none",
          "test_clock": null
        }
      ],
      "has_more": false,
      "next_page": null,
      "url": "/v1/customers/search"
    }
    mockUserService.hasAccessToAccount.mockResolvedValueOnce(true);
    

    mockPaymentMethodsService.getStripeCustomer.mockResolvedValueOnce(paymentMethodServicceRes);

   const result = await  controller.createStripeCustomer(req,getCustomerRequest);
    // expect(result.).toEqual('cus_OX8rO94vpCHhJ3');
    expect(result).toEqual(getCustomerSuccessResponse);
  });

  // Stripe get Customer / create customer - Success Scenario - New Customer Creation
  // it('Should create new customer under stripe and return message customer created successfully', async () => {
   
  //   const req = {
  //     user: {
  //       sub: '1234567890'
  //     }
  //   };
  //   const paymentMethodServicceRes =  {
   
  //   data:{}
  //   }

  //   const request = {
  //     accountNumber: 'ACT-01640691',
  //     accountName: 'Frontier Logistics, LP',
  //     email: 'rohini1996@zingworks.in,'
  //   }
        
    
  //       const response = {
          
  //           "id": "cus_NffrFeUfNV2Hibighj",
  //           "object": "customer",
  //           "address": null,
  //           "balance": 0,
  //           "created": 1680893993,
  //           "currency": null,
  //           "default_source": null,
  //           "delinquent": false,
  //           "description": null,
  //           "discount": null,
  //           "email": "jennyrosen@example.com",
  //           "invoice_prefix": "0759376C",
  //           "invoice_settings": {
  //             "custom_fields": null,
  //             "default_payment_method": null,
  //             "footer": null,
  //             "rendering_options": null
  //           },
  //           "livemode": false,
  //           "metadata": {},
  //           "name": "Jenny Rosen",
  //           "next_invoice_sequence": 1,
  //           "phone": null,
  //           "preferred_locales": [],
  //           "shipping": null,
  //           "tax_exempt": "none",
  //           "test_clock": null
          
  //       };

  //   mockUserService.hasAccessToAccount.mockResolvedValueOnce(true);
    

  //   mockPaymentMethodsService.getStripeCustomer.mockResolvedValueOnce(paymentMethodServicceRes);
  //   mockPaymentMethodsService.createNewStripeCustomer.mockResolvedValueOnce(response);

  //  const result = await  controller.createStripeCustomer(req,request);
  //   // expect(result.).toEqual('cus_OX8rO94vpCHhJ3');
  //   expect(result.message).toEqual('Customer created successfully');
  // });

 

  // Get payment methods list - Success Scenario

  it('Should return payment method id', async () => {

    const request:StripeGetPaymentMethodsReqDTO = {
      stripe_customer_id: 'cus_OOFVB9Bu0LaaLo'
    }

    
  // Get payment method list - Success Response

  let getPaymentMethodsSuccessResponse: ApiRespDTO=
  {
    success: true,
    message: 'Success',
    status: 1000,
    data: [
      {
        id: 'card_1NbT0pKX1Bgoxru0sVheyzKx',
        object: 'payment_method',
        billing_details: {
          address: {
            city: null,
            country: null,
            line1: null,
            line2: null,
            postal_code: null,
            state: null,
          },
          email: null,
          name: null,
          phone: null,
        },
        card: {
          brand: 'visa',
          checks: {
            address_line1_check: null,
            address_postal_code_check: null,
            cvc_check: 'pass',
          },
          country: 'US',
          exp_month: 12,
          exp_year: 2024,
          fingerprint: 'YioBSOxpExUegjOp',
          funding: 'credit',
          generated_from: null,
          last4: '4242',
          networks: {
            available: ['visa'],
            preferred: null,
          },
          three_d_secure_usage: {
            supported: true,
          },
          wallet: null,
        },
        created: 1691174771,
        customer: 'cus_OOFVB9Bu0LaaLo',
        livemode: false,
        metadata: {},
        type: 'card',
      },
    ],
   
  };

    mockPaymentMethodsService.getPaymentMethods.mockResolvedValueOnce(getPaymentMethodsSuccessResponse);
    const result = await controller.getPaymentMethods(request);
    expect(result.success).toBe(true);
   

   
    
  });

  //Get payment methods list - Failure Scenario

  it('Should return Payment methods not found message', async () => {
    const request:StripeGetPaymentMethodsReqDTO = {
      stripe_customer_id: '123'
    }
    const getPaymentMethodFailureResponse: ApiRespDTO<any> = {
      success: false,
      message: 'Fail',
      status: 1009,
      data: {},
    };
    mockPaymentMethodsService.getPaymentMethods.mockResolvedValueOnce(getPaymentMethodFailureResponse);
    const result = await controller.getPaymentMethods(request);

    
    expect(result.message).toEqual('Payment methods not found');
  });

  // Create setup intent - Success Scenario

  it('Should return client secret', async () => {
    const request:StripeSetupIntentReqDTO = {
      customer_id: 'cus_OOFVB9Bu0LaaLo'
    }

    const response = {
      success: true,
      status: 1000,
      message: 'Success',
      data:
      {
        client_secret:
          'seti_1NuYxZKX1Bgoxru0MP42pxH3_secret_OhyvgqjkkzH6aWkwGr6IlGKu3I7qCP1',
      }
       
    };
    mockPaymentMethodsService.createSetupIntent.mockResolvedValueOnce(response);
    const result = await controller.createSetupIntent(request);
    expect(result.status).toBe(1000);
    }
  );
  });

  // Create setup intent - Failure Scenario

 


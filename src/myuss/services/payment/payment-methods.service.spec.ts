import { Test, TestingModule } from '@nestjs/testing';

import { PaymentMethodsService } from './payment-methods.service';
import { StripeService } from '../../../backend/stripe/services/stripe/stripe.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { SfdcAccountService } from '../../../backend/sfdc/services/sfdc-account/sfdc-account.service';
import { SfdcBaseService } from '../../../backend/sfdc/services/sfdc-base/sfdc-base.service';
import { ConfigService } from '@nestjs/config';
import { response } from 'express';
import {ApiRespDTO} from "../../../common/dto/api-resp.dto"
import {USS_CUSTOMERCARE_MESSAGE} from '../../../core/utils/constants';

describe('PaymentMethodsService', () => {
  let service: PaymentMethodsService;

  // Mock Stripe Service
  let mockStripeService = {
    getPaymentMethods: jest.fn(),
    getCustomerByUSSAccountId: jest.fn(),
    createCustomer: jest.fn(),
    createSetupIntent: jest.fn(),
    getPaymentDetails: jest.fn(),
  };

  let mockSfdcAccountService = {
    getAccount: jest.fn(),
    getAccountByName: jest.fn(),
    getAccountNumberByUSSAccountId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentMethodsService,

        SfdcBaseService,
        ConfigService,
        { provide: StripeService, useValue: mockStripeService },
        { provide: SfdcAccountService, useValue: mockSfdcAccountService },
        LoggerService,
      ],
    }).compile();

    service = module.get<PaymentMethodsService>(PaymentMethodsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Get Stripe Customer
  it('Should return stripe customer Id', async () => {
    //Arrange

   

    const accountNumber = 'ACT-01640662';

    const response: ApiRespDTO<any> = {
      success: true,
      status:1000,
      message:"Success",
      data:{
        object: 'search_result',
        data: [
          {
            id: 'cus_OX8rO94vpCHhJ3',
            object: 'customer',
            address: null,
            balance: 0,
            created: 1693225791,
            currency: null,
            default_source: 'card_1Nk4aMKX1Bgoxru0Xe09m4eP',
            delinquent: false,
            description: null,
            discount: null,
            email: null,
            invoice_prefix: 'F892DE41',
            invoice_settings: {
              custom_fields: null,
              default_payment_method: null,
              footer: null,
              rendering_options: null,
            },
            livemode: false,
            metadata: {
              sfdc_account_id: 'ACT-01640651',
            },
            name: 'Frontier Logistics, LP',
            next_invoice_sequence: 1,
            phone: null,
            preferred_locales: [],
            shipping: null,
            tax_exempt: 'none',
            test_clock: null,
          },
        ],
        has_more: false,
        next_page: null,
        url: '/v1/customers/search',
      }
    };

   

    mockStripeService.getCustomerByUSSAccountId.mockResolvedValue(response);

    //Act

    const result = await service.getStripeCustomer(accountNumber);

    // Assert

    expect(result).toMatchObject(response);
  });

  //Get Stripe Customer -Exception handling
  it('Should return An error occurred, please contact 1-888-320-1861-TOILETS. message1', async () => {
    //Arrange

    const accountNumber = {no:"124324"}

    const response: ApiRespDTO<any> = {
      success: false,
      status:1008,
      message:USS_CUSTOMERCARE_MESSAGE,
      data:{}
    };

    mockStripeService.getCustomerByUSSAccountId.mockResolvedValue(response);

    //Act

    const result = await service.getStripeCustomer(accountNumber.no);

    // Assert

    expect(result.data).toEqual({});
  });

  // Check existing stripe customer

  // it('Should check if user is existing under stripe or not', async () => {
  //   //Arrange
  //   const accountNumber = 'ACT-01640651';

  //   const stripeRes = {
  //     status: 200,
  //     message: 'Success',
  //     data: {
  //       stripeCustomerId: 'cus_OX8rO94vpCHhJ3',
  //       exist: true,
  //     },
  //   };
  //   mockStripeService.getCustomerByUSSAccountId.mockResolvedValue(stripeRes);

  //   // Act

  //   const result = await service.getStripeCustomer(accountNumber);

   

  //   // Assert
  // expect(result.data).toBeDefined();});

  // Create new stripe customer

  it('Should create new stripe customer', async () => {
    // Arrange
const request = {
  accountNumber: 'ACT-01640651',
  name: 'Frontier Logistics, LP',
  email: 'rohini.nagtilak@zing.com,'
}
    

    const response = {
      
        "id": "cus_NffrFeUfNV2Hib",
        "object": "customer",
        "address": null,
        "balance": 0,
        "created": 1680893993,
        "currency": null,
        "default_source": null,
        "delinquent": false,
        "description": null,
        "discount": null,
        "email": "jennyrosen@example.com",
        "invoice_prefix": "0759376C",
        "invoice_settings": {
          "custom_fields": null,
          "default_payment_method": null,
          "footer": null,
          "rendering_options": null
        },
        "livemode": false,
        "metadata": {},
        "name": "Jenny Rosen",
        "next_invoice_sequence": 1,
        "phone": null,
        "preferred_locales": [],
        "shipping": null,
        "tax_exempt": "none",
        "test_clock": null
      
    };

    mockStripeService.createCustomer.mockResolvedValue(response);

    //Act

    const result = await service.createNewStripeCustomer(request.accountNumber, request.name, request.email);

    // Assert

    expect(result.success).toEqual(true);
  });

  // Create new stripe customer - Exception handling
  it('Should return 1008 status code', async () => {
    // Arrange
    const request = {
      accountNumber: null,
      name: null,
      email:null
    };

    
    const response = {
      success: false,
      status:1008,
      message:USS_CUSTOMERCARE_MESSAGE,
      data:{}
    };

    mockStripeService.createCustomer.mockResolvedValue(response);

    //Act

    const result = await service.createNewStripeCustomer(request.accountNumber, request.name, request.email);

    // Assert

    expect(result.status).toEqual(1000);
  });


  
  // Get payment methods for stripe customer
  it('Should return all payment methods for customer', async () => {
    // Arrange

    const stripeCustmerId = 'cus_OOFVB9Bu0LaaLo';

    const response = {
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
    mockStripeService.getPaymentMethods.mockResolvedValue(response);

    // Act
    const result = await service.getPaymentMethods(stripeCustmerId);

    // Assert

    expect(result.data).toBeDefined();
  });

  // Get payment (Payment Method) details for customer

  it('Should return payment details of customer', async () => {
    // Arrange
    const stripeCustomeId = 'cus_Oqd8cbxIVJfYkC';

    const paymentMethodId = 'pm_1O3EwjKX1Bgoxru0yrRz7BwL';

    const res = {
      id: 'pm_1O3EwjKX1Bgoxru0yrRz7BwL',
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
        country: 'United States',
        exp_month: 6,
        exp_year: 2027,
        fingerprint: 'uxZdfP7PuKBklKwJ',
        funding: 'credit',
        generated_from: null,
        last4: '8210',
        networks: {
          available: ['visa'],
          preferred: null,
        },
        three_d_secure_usage: {
          supported: true,
        },
        wallet: null,
      },
      created: 1696279757,
      customer: 'cus_Oqd8cbxIVJfYkC',
      livemode: false,
      metadata: {
        order_id: '6735',
      },
      redaction: null,
      type: 'card',
    };

    mockStripeService.getPaymentDetails.mockResolvedValue(res);

    // Act
    const result = await service.getPaymentDetails(
      
      paymentMethodId,
    );

    // Assert

    expect(result.data.id).toEqual(paymentMethodId);
  });

  // Create setup intent for future payments

  it('Should return client secret for future payment' , async () => {

    //Act

    const stripeCustomerId = "cus_Oqd8cbxIVJfYkC";

    const stripeRes = {
      id: 'seti_1O3GJcKX1Bgoxru0Jdspfq8M',
      object: 'setup_intent',
      application: null,
      automatic_payment_methods: { allow_redirects: 'always', enabled: true },
      cancellation_reason: null,
      client_secret: 'seti_1O3GJcKX1Bgoxru0Jdspfq8M_secret_OqyGLD4xxDc6z2xuqbGpsl2u1jzed4f',
      created: 1697799148,
      customer: 'cus_OqxsqyVtRtRnfQ',
      description: null,
      flow_directions: null,
      last_setup_error: null,
      latest_attempt: null,
      livemode: false,
      mandate: null,
      metadata: {},
      next_action: null,
      on_behalf_of: null,
      payment_method: null,
      payment_method_configuration_details: { id: 'pmc_1O32l9KX1Bgoxru0i3Ote7Mv', parent: null },
      payment_method_options: {
        card: {
          mandate_options: null,
          network: null,
          request_three_d_secure: 'automatic'
        },
        us_bank_account: { verification_method: 'automatic' }
      },
      payment_method_types: [ 'card', 'us_bank_account' ],
      single_use_mandate: null,
      status: 'requires_payment_method',
      usage: 'off_session'
    }

    mockStripeService.createSetupIntent.mockResolvedValue(stripeRes);

    // Act

    const result = await service.createSetupIntent(stripeCustomerId);

    // Assert

    expect(result.data.client_secret).toMatch('seti_1O3GJcKX1Bgoxru0Jdspfq8M_secret_OqyGLD4xxDc6z2xuqbGpsl2u1jzed4f');


  })

});

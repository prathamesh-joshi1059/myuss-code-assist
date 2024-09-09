import { Body, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { Stripe_Create_Customer_Req } from '../../../sfdc/model/Stripe';
import { limitForFetchPaymentMethodFromStripe } from '../../../../myuss/services/quote/constants';


@Injectable()
export class StripeService {
 
    private stripe:Stripe;
    private paymentMethodConfigurationId: string;

    constructor(private configService: ConfigService){
     
      this.paymentMethodConfigurationId = this.configService.get<string>('STRIPE_PAYMENT_METHOD_CONFIGURATION_ID');
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
          apiVersion:'2023-08-16',
      });
    };

    async getPaymentMethods(stripeCustomerId: string) {
      const paymentMethods =  await this.stripe.paymentMethods.list({
        customer: stripeCustomerId, limit: limitForFetchPaymentMethodFromStripe
      });
      return paymentMethods;
     }

     async getCustomerByUSSAccountId(ussAccountId: string) {
      const getcustomer = await this.stripe.customers.search({
        query: `metadata['sfdc_account_id']:'${ussAccountId}'`,
      });
      return getcustomer;
    }

      
    async createCustomer(@Body() body:Stripe_Create_Customer_Req,) {
      const customer = await this.stripe.customers.create({
        name: body.name,
        email: body.email,
        metadata: {
          sfdc_account_id: body.ussAccountId,
        }
      });
      return customer;
    }
    async createSetupIntent(customerId: string) {
      const setupIntent = await this.stripe.setupIntents.create({
        customer: customerId,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never',
        },
        usage: 'off_session',
        payment_method_configuration: this.paymentMethodConfigurationId
      });
      return setupIntent;
    }
    async getPaymentDetails(paymentMethodId:string){
      const paymentDetails = await this.stripe.paymentMethods.retrieve(paymentMethodId)
      return paymentDetails;
    }
  }

      
     

 

    
    
     
    


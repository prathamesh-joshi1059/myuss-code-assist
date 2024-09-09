import { Body, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { Stripe_Create_Customer_Req } from '../../../sfdc/model/Stripe';
import { limitForFetchPaymentMethodFromStripe } from '../../../../myuss/services/quote/constants';

@Injectable()
export class StripeService {
  private stripe: Stripe;
  private paymentMethodConfigurationId: string;

  constructor(private configService: ConfigService) {
    this.paymentMethodConfigurationId = this.configService.get<string>('STRIPE_PAYMENT_METHOD_CONFIGURATION_ID');
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-08-16',
    });
  }

  async getPaymentMethods(stripeCustomerId: string): Promise<Stripe.ApiList<Stripe.PaymentMethod>> {
    const paymentMethods = await this.stripe.paymentMethods.list({
      customer: stripeCustomerId,
      limit: limitForFetchPaymentMethodFromStripe,
    });
    return paymentMethods;
  }

  async getCustomerByUSSAccountId(ussAccountId: string): Promise<Stripe.ApiList<Stripe.Customer>> {
    const getCustomer = await this.stripe.customers.search({
      query: `metadata['sfdc_account_id']:'${ussAccountId}'`,
    });
    return getCustomer;
  }

  async createCustomer(@Body() body: Stripe_Create_Customer_Req): Promise<Stripe.Customer> {
    const customer = await this.stripe.customers.create({
      name: body.name,
      email: body.email,
      metadata: {
        sfdc_account_id: body.ussAccountId,
      },
    });
    return customer;
  }

  async createSetupIntent(customerId: string): Promise<Stripe.SetupIntent> {
    const setupIntent = await this.stripe.setupIntents.create({
      customer: customerId,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
      usage: 'off_session',
      payment_method_configuration: this.paymentMethodConfigurationId,
    });
    return setupIntent;
  }

  async getPaymentDetails(paymentMethodId: string): Promise<Stripe.PaymentMethod> {
    const paymentDetails = await this.stripe.paymentMethods.retrieve(paymentMethodId);
    return paymentDetails;
  }
}
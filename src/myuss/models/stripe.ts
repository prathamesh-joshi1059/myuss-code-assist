export class Stripe_createCustomer_Request {
  email: string;
  name: string;
  ussAccountId: string;
}

export class Stripe_getStripeCustomer_Request {
  // ussAccountId: string;
  email: string;
  name: string;
  accountNumber: string;
}

export class Stripe_getStripeCustomer_successResponse {
  status: number;
  message: string;
  data: {
    stripeCustomerId: string;
    exist: boolean;
  };
}

export class Stripe_getStripeCustomer_failureResponse {
  status: number;
  message: string;
  data: {
    error: string;
  };
}

export class Stripe_getPaymentMethods_Request {
  stripeCustomerId: string;
}

export class Stripe_getPaymentMethods_SuccessResponse {
  status: number;
  data: [
    {
      id: string;
      object: string;
      billing_details: {
        address: {
          city: null;
          country: null;
          line1: null;
          line2: null;
          postal_code: null;
          state: null;
        };
        email: null;
        name: null;
        phone: null;
      };
      card: {
        brand: string;
        checks: {
          address_line1_check: null;
          address_postal_code_check: null;
          cvc_check: string;
        };
        country: string;
        exp_month: number;
        exp_year: number;
        fingerprint: string;
        funding: string;
        generated_from: null;
        last4: string;
        networks: {
          available: [string];
          preferred: null;
        };
        three_d_secure_usage: {
          supported: boolean;
        };
        wallet: null;
      };
      created: number;
      customer: string;
      livemode: boolean;
      metadata: {};
      type: string;
    },
  ];
  message: string;
}

export class Stripe_getPaymentMethods_FailureResponse {
  status: number;
  message: string;
  data: {
    error: string;
  };
}

export class Stripe_setupIntent_Request {
  customer_id: string;
}

export class Stripe_setupIntent_SuccessResponse {
  client_secret: string;
  message: string;
}

export class Stripe_setupIntent_FailureResponse {
  status: number;
  message: string;
  data: {
    error: string;
  };
}

export class Stripe_paymentMethodBackToQuote_Request {
  id: string;
  paymentMethodId: string;
}

export class Stripe_paymentMethodBackToQuote_SuccessResponse {
  status: number;
  message: string;
  data: {};
}

export class Stripe_paymentMethodBackToQuote_FailureResponse {
  status: number;
  message: string;
}
export class Stripe_getPaymentDetails_Request {
  paymentMethodId: string;
  customer_id: string;
}

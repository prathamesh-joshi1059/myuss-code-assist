export class SetupIntentRespDTO {
  success: boolean;
  stripe_client_secret: string;
  status_code: string;
  default_message: string;
  address: string;
  start_date: string;
  account_name: string;
  first_invoice_amount: number;
  recurring_invoice_amount: number;
  order_update_jwt: string;
}
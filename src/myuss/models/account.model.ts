import { Address } from './address.model';
import { BillingDetails } from './billing-details.model';
import { Contact } from './contact.model';
import { PurchaseOrder } from './purchase-order';
import { Quote } from './quote.model';
import { User } from './user.model';

export class Account {
  id: string;
  name: string;
  accountNumber: string;
  customerType: string;
  businessType: string;
  primaryPayerEmail: string;
  primaryPayerId: string;
  billingAddressId: string;
  shippingAddressId: string;
  primaryContactId: string;
  outstandingBalance?: number;
  contacts: Contact[];
  addresses: Address[];
  purchaseOrders: PurchaseOrder[];
  quotes: Quote[];
  defaultBillingDetails: BillingDetails;
  requirements: {
    purchaseOrder: boolean;
    lienRelease: boolean;
    autoPay: boolean;
  };
  accountOwner?: User;
}

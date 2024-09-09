import { type } from "os";
import { Address } from "./address.model";
import { Contact } from "./contact.model";

export class BillingDetails {
  isAutoPay: boolean;
  invoiceDeliveryMethod: string;
  billingProfile: string;
  billingAddress: Address;
  billingContact: Contact;
  additionalBillingEmailAddresses: string[];
}

export class PaymentMethod {
  id: string;
  type: string;
  lastFour: string;
  expirationDate: Date;
  cardType: string;
  isDefault: boolean;
  isExpired: boolean;
}
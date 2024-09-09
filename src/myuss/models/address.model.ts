import { Contact } from "./contact.model";

export class Address {
  id?: string;
  addressId?: string;
  accountId: string;
  name?: string;
  city: string;
  state: string;
  zipcode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  addressValidated?: boolean;
  geocodeAccuracy?: string;
  siteContact?: Contact;
  secondarySiteContact?: Contact;
  shipToContact?: Contact;
  isShippingAddress?: boolean;
  isBillingAddress?: boolean;
  isParentAddress?: boolean;
  placementNotes?: string;
  parentRefId?: string;
  shipToContactRefId?: string;
  siteContactRefId?: string;
  startTime?: string;
  endTime?: string;
  siteName?: string;
  instructions?: string;
  street?: string;
  isParent? : boolean;
  gateCode?: string;
  information?: string;
  clearanceRequired?: boolean;
  idRequired?: boolean;
  contactExist?: boolean;
  contactId?: string;
  shipToAddress?: boolean;
}

export class SiteAddress {
  id?: string;
  accountId?: string;
  addressId?: string;
  city: string;
  country: string;
  shipToAddress?: boolean;
  state: string;
  street?: string;
  zipcode: string;
  siteName?: string;
  latitude?: number;
  longitude?: number;
  addressExist?: boolean;
}

export class SiteDetails extends SiteAddress {
  startTime?: string | null;
  endTime?: string | null;
  gateCode?: string | null;
  instructions?: string | null;
  information?: string | null;
  idRequired?: boolean;
  clearanceRequired?: boolean;
}

export class BillingAddress {
  addressRefId?: string;
  addressExist?: boolean;
  address: string;
  city: string;
  state: string;
  zipcode: string;
}
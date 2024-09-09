import { Case_Order_Relationship__c } from 'src/backend/sfdc/model/Case_Order_Relationship__c';
import { AssetLocations } from './asset-location.model';


import { Project } from "./project.model";
import {QuoteModel} from "./quote.model";

export class userDataObj {
  data: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    id: string;
    accountId: string;
    accountName: string;
    autoPayRequirement: string;
    businessType: string;
    customerType: string;
    emailForCC: string[];
    contactId: string;
    accountNumber: string;
    quotes: string[];
    contracts: string[];
   
  };
}
export class UserDetailsObj {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  id: string;
  accountId: string;
  accountName: string;
  autoPayRequirement: string;
  businessType: string;
  customerType: string;
  emailForCC: string[];
  contactId: string;
  accountNumber: string;
  quotes: string[];
  contracts: string[];
}

export class BillAddress {
  lat: number;
  lng: number;
}
export class Card {
  cardBrand: string;
  cardNo: string;
  cardExpMonth: number;
  cardExpYear: number;
  cardCvc: number;
  country: string;
  displayBrand: string;
  expired?: boolean;
}
export class BankDetails {
  accountHolderType?: string;
  accountType?: string;
  bankName?: string;
  cardNo?: string;
  email?: string;
}

export class GetPaymentMethodsResObj {
  paymentMethodId: string;
  type: string; // card/us_bank_account
  card?: Card;
  bank?: BankDetails;
}

export class GetWorkOrder {
  id: string;
  type: string;
  status: string;
  startDate: Date;
  endDate: Date;
}

export class SearchByUnitNumber {
  assetDetails: AssetLocations;
  completedServices: GetWorkOrder[];
  upcomingServices: GetWorkOrder[];
}

export class ContractModel {
  quoteId?: string;
  contractId?: string;
  name?: string;
  lastModifiedDate?: Date;
  startDate?: Date;
  shippingAddress?: string;
  zipcode?: string;
  billAddress?: BillAddress;
  shippingAddressLat?: number;
  shippingAddressLng?: number;
  paymentMethodId?: string;
  recurringSubtotal?: number;
  nextInvoiceDate?: string;
  isAutoPay?: boolean;
  status?: string;
  easyPayDetails?: BankDetails;
  easyPayMode?: string;
  quoteName?: string;
  endDate?: Date;
  contractDocumnetId?: string;
  contractDocumentName?: string;
  quoteSummary?: QuoteSummary[];
  siteDetails?: SiteDetail;
  billingDetails?: BillingDetail;
  workOrder?: WorkOrders[];
  assetLocations?: AssetLocations[];
  productDetails?: ProductDetail[];
    orderType?:            string;
    projectDetails?:       Project;
    contractNumber?: string;
    casesCount?:number;
  quoteModel:QuoteModel;
  caseTypeWiseCasesCount?:Case_Order_Relationship__c; // added for case type wise count
}

export class AncillaryService {
  ancillaryServiceId?: string;
  ancillaryServiceOptionalId?: string;
  ancillaryServiceQty?: number;
  ancillaryServiceName?: string;
}

export class BillingDetail {
  firstName?: string;
  lastName?: string;
  secondaryBillingContact?: BillingDetail;
  phone?: string;
  cardDetails?: CardDetail;
  bankDetails?: BankDetails;
  manualPaymentDetails?: ManualPaymentDetails;
  email?: string;
}

export class CardDetail {
  cardBrand?: string;
  cardNo?: string;
  cardExpMonth?: number;
  cardExpYear?: number;
  country?: string;
  displayBrand?: string;
  expired?: boolean;
}

export class ManualPaymentDetails {
  message?: string;
}

export class ProductDetail {
  addressId?: string;
  placementNotes?: string;
  siteName?: string;
  bundles?: AssetLocations[];
  isEdited?: boolean;
}

export class QuoteSummary {
  bundleId?: string;
  bundleOptionalId?: string;
  bundleQty?: number;
  bundleName?: string;
  asset?: Asset[];
  service?: Service[];
  ancillaryServices?: AncillaryService[];
  pAndD?: PAndD[];
  scheduledServices?: ScheduledServices;
}
export class Asset {
  assetId?: string;
  assetOptionalId?: string;
  assetQty?: number;
  assetName?: string;
}

export class PAndD {
  aAndDId?: string;
  aAndDOptionalId?: string;
  aAndDQty?: number;
  aAndDName?: string;
}

export class ScheduledServices {
  startDate?: Date;
  endDate?: Date;
  day?: string;
  frequency?: number;
  serviceFrequency?: string;
  frequencyType?: string;
}

export class Service {
  serviceId?: string;
  serviceOptionalId?: string;
  serviceQty?: number;
  serviceName?: string;
  numberOfServices?: number;
  servicePrice?: number;
}

export class SiteDetail {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  state?: string;
  street?: string;
  zipcode?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  siteStartTime?: string;
  siteEndTime?: string;
  placementNotes?: PlacementNotes;
}

export class PlacementNotes {
  siteInstruction?: string;
  placementInstruction?: string;
}

export class WorkOrders {
  type?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  id?: string;
  productInfo?: string;
  originalStatus?: string;
}

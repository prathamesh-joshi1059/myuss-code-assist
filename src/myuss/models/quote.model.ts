import { SBQQ__QuoteLine__c } from '../../backend/sfdc/model/SBQQ__QuoteLine__c';
import { Account } from './account.model';
import { Address } from './address.model';
import { Contact } from './contact.model';
import { Product } from './product';
import { PurchaseOrder } from './purchase-order';
import { NF_Quoted_Jobsite__c } from '../../backend/sfdc/model/NF_Quoted_Jobsite__c';
import { Project } from './project.model';

export class Quote {
  id: string;
  name: string;
  description: string;
  currentDocumentId: string;
  globalReferenceNumber: string;
  accountId: string;
  accountName: string;
  account: Account;
  serviceAddress: Address;
  primaryContact: Contact;
  siteContact: Contact;
  autoPay: boolean;
  billingAddress: Address;
  billingContact: Contact;
  paymentMethodId: string;
  status: string;
  bundles: Bundle[];
  quoteLines: QuoteLine[];
  quotedJobsites: QuotedJobsite[];
  createdDate: any;
  lastModifiedDate: any;
  purchaseOrder: PurchaseOrder;
}

export class Bundle {
  id: string;
  name?: string;
  key: number;
  quantity: number;
  bundleProduct: BundleProduct;
  assetProduct: BundleProduct;
  serviceProduct: BundleProduct;
  additionalProducts: BundleProduct[];
  deliveryProduct: BundleProduct;
  pickupProduct: BundleProduct;
  type?: string;
  bundleQty?: number;
}

export class QuoteLine {
  id: string;
  name: string;
  quoteId: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  tax: number;
  totalPrice: number;
  fees: QuoteLineFee[];
}

export class QuoteLineFee {
  id: string;
  quoteLineId: string;
  type: string;
  name: string;
  description: string;
  price: number;
  tax: number;
  total: number;
}

export class QuotedJobsite {
  id: string;
  name: string;
  description: string;
  address: Address;
  contact: Contact;
  quoteLines: QuoteLine[];
}

export class SfdcRespModel {
  id: string;
  success: boolean;
  errors: string[];
  message?: string;
}

export class QuoteLinesModel {
  quoteLineBundle: SBQQ__QuoteLine__c;
  quoteLineAsset: SBQQ__QuoteLine__c;
  quoteLineService: SBQQ__QuoteLine__c;
  quoteLineAdditionalServiceArr: SBQQ__QuoteLine__c[];
  quoteLineDelivery: SBQQ__QuoteLine__c;
  quoteLinePickup: SBQQ__QuoteLine__c;
  quotedJobsite: NF_Quoted_Jobsite__c;
  key?: number;
}
export class WorkOrder {
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  id: string;
  productInfo: string;
}

export class QuotesProducts {
  unitType: string;
  qty: string;
  frequency: string;
  addtionalServices: string;
}

export class SiteInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  siteStartTime: string;
  siteEndTime: string;
  placementNotes: {
    siteInstruction: string;
    placementInstruction: string;
  };
}

export class BillingInfo {
  firstName: string;
  lastName: string;
  emailIds: string[];
  phone: string;
  cardDetails: {
    cardBrand: string;
    cardNo: string;
    cardExpMonth: string;
    cardExpYear: string;
    cardCvc: string;
    counry: string;
  };
  bankDetails: {
    accountHolderType: string;
    bankName: string;
    cardNo: string;
  };
  manualPaymentDetails: {
    message: string;
  };
}

export class CardDetails {
  cardBrand: string;
  cardNo: string;
  cardExpMonth: string;
  cardExpYear: string;
  cardCvc: string;
  counry: string;
}

export class AncillaryServices {
  id: string;
  name: string;
  productCode: string;
}
export class Bundles {
  bundleProductCode: string;
  bundleName: string;
  asset: Assets[];
  service: Services[];
  ancillaryService: BundleAnicllaryServices[];
}
export class Assets {
  id: string;
  assetName: string;
  assetProductCode: string;
}
export class Services {
  id: string;
  serviceName: string;
  serviceProductCode: string;
}

export class BundleAnicllaryServices {
  id: string;
  ancillaryServiceName: string;
  ancillaryServiceProductCode: string;
}

export class BundleDetails {
  bundleId: string;
  bundleProductCode: string;
  bundleName: string;
  assetList: AssetDetails[];
  serviceList: ServiceDetails[];
  ancillaryServiceList: AncillaryServiceDetails[];
  type?: string;
  bundleQty?: number;
  pAndDList?: any;
}
export class ServiceDetails {
  id: string;
  serviceName: string;
  serviceProductCode: string;
  serviceOptionalId?: string;
  serviceTaxCode?: string;
  quantity?: number;
  numberOfServices?: number;
  servicePrice?: number;
}
export class AssetDetails {
  id: string;
  assetName: string;
  assetProductCode: string;
  assetOptionalId: string;
  assetTaxCode?: string;
  quantity?: number;
}
export class AncillaryServiceDetails {
  id: string;
  ancillaryServiceName: string;
  ancillaryServiceProductCode?: string;
  ancillaryServiceOptionalId?: string;
  quantity?: number;
}

export class ProductDetails {
  productIdBundle: string;
  productOptionSkuBundle: string;
  bundleSummery: string;
  bundleQty: number;
  productIdService: string;
  productOptionSkuService: string;
  serviceSummery: string;
  serviceTaxcode: string;
  productIdAsset: string;
  productOptionSkuAsset: string;
  assetSummary: string;
  assetTaxcode: string;
  pricebookEntryIdBundle: string;
  pricebookEnteryIdService: string;
  pricebookEnteryIdAsset: string;
  additionalProduct: AdditionalProduct[];
}

export class BundleProduct {
  id: string;
  name: string;
  summary: string;
  productCode: string;
  chargeType: 'One-Time' | 'Recurring';
  taxCode: string;
  priceBookEntryId: string;
  productOptionId: string;
  productOptionType: string;
  featureId: string;
}

export class AdditionalProduct {
  productIdAS: string;
  productOptionSkuAS: string;
  aSSummery: string;
  aSTaxCode: string;
}

//MyUSS Model

export class QuoteModel {
  quoteId: string;
  quoteNumber: string;
  quoteDate: string;
  quoteName: string;
  account: Account;
  startDate: string;
  endDate: string;
  //opportunity:Opportunity;
  priceBookId: string;
  primaryContact: Contact;
  billToContact: Contact;
  primarySiteContact: Contact;
  shipToContact: Contact;
  shippingAddress: Address;
  billTiming: string;
  billingPeriod: string;
  declineDamageWaiver: boolean | true;
  orderType: string;
  //primary:;
  isAutoPay: boolean | true;
  billToAddress: Address;
  billingComplete: boolean | true;
  orderedinSalesforce: boolean | true;
  invoiceDeliveryMethod: string;
  paymentMethodId: string;
  paymentMode: string;
  preOrderFlowComplete: boolean | true;
  siteComplete: boolean | true;
  billingApprovalStatus: string;
  purchaseOrder: PurchaseOrder;
  facilityName: string;
  subdivisionName: string;
  status: string;
  ordered: boolean;
  billCycleDay: string;
  chargeType: string;
  eECPercent: number;
  eSFPercent: number;
  fuelSurchargePercent: number;
  lastBillingDate: string;
  legalEntity?: string;
  legalEntityCode: string;
  branchCode: string;
  customerType: string;
  BusinessType: string;
  jobSites: JobSites[];
  quoteDocuments: QuoteDocument[];
  creditCardPaymentStatus: string;
  billingSystem: string;
  cPQTemplate: string;
  enableServerSidePricingCalculation: boolean;
  taxEntityUseCode: string;
  avaTaxCompanyCode: string;
  aVASFCPQIsSellerImporterOfRecord: boolean;
  avaSalesTaxAmount: number;
  avaSalesTaxMessage: string;
  duration: string;
  //createdBy: User;
  createdById: string;
  createdDate: string;
  expirationDate: string;
  quoteExpiryDate:string;
  sourceSystem: string;
  quoteReferenceNumber: string;
  ussContact: Contact;

  oneTimeSubtotal: number;
  oneTimeTax: number;
  oneTimeTotal: number;
  recurringSubtotal: number;
  recurringTax: number;
  recurringTotal: number;
  secondaryContactData: Contact;

  quoteLines: QuoteLineModel[];
  projectDetails: Project;
  currentStatus? : number;
  estimatedEndDate?:string;
}

export class QuoteDocument {
  documentId: string;

  documentName: string;
  version: string;
}
export class QuoteLineModel {
  quoteLineId: string;
  quoteId: string;
  requiredBy: string;
  lineNumber: number;
  name: string;
  product: ProductModel;
  quantity: number;
  listPrice: number;
  floorPrice: number;
  unitCost: number;
  netPrice: number;
  customerPrice: number;

  applyFuelSurcharge: boolean;
  fuelSurchargePercent: number;
  fuelSurchargePerUnit: number;
  fuelSurchargeAmount: number;

  applyHoustonFranchiseFee: boolean;
  houstonFranchiseFeePerUnit: number;
  houstonFranchiseFeesPercent: number;
  houstonFranchiseAmount: number;

  ESFAmount: number;
  ESFPercent: number;

  EECAmount: number;
  EECPercent: number;

  salesTaxAmount: number;

  productType: string;

  ussNetAmount: number;
  chargeType: string;

  startDate: string;
  endDate: string;
  priceBookId: string;
  subscriptionTerm: string;
  productSubscriptionType: string;

  subscriptionPricing: number;
  subscriptionType: string;
  defaultSubscriptionTerm: string;
  productCode: string;
  aVASFCPQLocationCode: string;
  address: Address;
  taxable: boolean;
  taxCode: string;
  taxPercentage: number;
  shipAddress: Address;
  taxAmount: number;

  jobsites: JobSites[];
  bunddled: boolean;

  quantityUnitOfMeasure: string;
  requiresParentAsset: boolean;
  sortOrder: string;

  customerOwned: boolean;

  assetSummary: string;
  productOptionId: string;
  productOption: ProductOption;

  targetPrice: number;
  productNetAmount: number;
  serviceFrequency: string;
  serviceEndDate: string;
  effectiveEndDate: string;
  serviceStartDate: string;
  effectiveStartDate: string;
  ESFPrice: number;

  tax: number;
  productOptionType: string;
  optionalLevel: number;
  bundledQuantity: number;
}

export class JobSites {
  id: string;
  name: string;
  address: Address;
  quantityQuoted: number;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  addressLattitude: string;
  addressLongitude: string;
  isPrimary: boolean;
  shipToAddress: Address;
  billToAddress: Address;
  isParent: boolean;
  addressValidated: boolean;
  geoCodeAccuracy: string;
  siteName: string;
  siteHoursStartTime: string;
  siteHoursEndTime: string;
  arrivalStartTime: string;
  arrivalEndTime: string;
  gateCode: string;
  accessInstructions: string;
  otherInstructions: string;
  backgroundCheck: string;
  clearanceRequired: string;
  additionalInformation: string;
  placement: string;
  placedProductName: string;
  quoteLineId?: string;
  productDetails?: ProductDetilsForSubsite;
  contact: Contact;
  isEdited: boolean;
  serviceSubscriptionId?: string;
  subscriptionProductId?: string;
  serviceProductId?: string;
  unitNumber?: string;
  servicePrice?: number;




}
export class ProductDetilsForSubsite {
  bundleId: string;
  assetId: string;
  serviceId: string;
  bundleName: string;
  assetName: string;
  serviceName: string;
  ancillaryServiceList: { ancillaryServiceId: string; ancillaryServiceName: string }[];
  quantity: number;
}

export class ProductModel {
  id: string;
  productCode: string;
  name: string;
  productType: string;
  requiredParentAsset: boolean;
  avaSfcpqTaxcode: string;
  productCategory: string;
  productChargeType: string;
  productSubscriptionType: string;
  assetSummary: string;
  description: string;
  products: ProductModel[];
  priceBookId: string;
  applyFuelSurcharge: boolean;
  applyEnhancedSafetyFee: boolean;
  applyEEC: boolean;
  productOptions?: ProductOption[];
}

export class PlytixProductModel{
  family : string;
  gtin : string;
  status  : string;
  created  : string;
  thumbnail  : string;
  assets  : string[];
  categories  : string;
  label  : string;
  sku  : string;
  features  : string;
  excerpt  : string;
  description  : string;
  deliveryPickupDesc  : string;
  cleanSanitaryDesc  : string;
  imageGallary: string[];
  lastModified:string;

  toJSON() {
    return {
      family: this.family,
      gtin: this.gtin,
      status: this.status,
      created: this.created,
      thumbnail: this.thumbnail,
      assets: this.assets,
      categories: this.categories,
      label: this.label,
      sku: this.sku,
      features: this.features,
      excerpt: this.excerpt,
      description: this.description,
      deliveryPickupDesc: this.deliveryPickupDesc,
      cleanSanitaryDesc: this.cleanSanitaryDesc,
      imageGallary: this.imageGallary,
      lastModified: this.lastModified
    };
  }
}

export class ProductModelWithPlytixInfo extends ProductModel {
  thumbnail: string;
  label: string;
  deliveryPickupDesc: string;
  cleanSanitaryDesc: string;
  features: string;
  assets: string[];
  categories: string;
  family: string;
  sku: string;
  excerpt: string;
}

export class ProductOption {
  id: string;
  productId: string;
  product: ProductModel;
  additionalProductId: string;
  optionsNumber: string;
  optionsType: string;
  featureId: string;
}
//dto for siteDetailsRequest

//new for sub site
export class SubSite {
  name: string;
  quoteId: string;
  endDate: string;
  startDate: string;
  quoteLineId?: string;
  addressId: string;
  assetId: string;
  serviceId: string;
  preOrderFlowComplete: boolean;
  quantity: number;
  siteName: string;
  productName: string;
}

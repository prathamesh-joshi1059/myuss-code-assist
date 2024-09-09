import { Project } from "./project.model";

export class User {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  title: string;
}
export class UserDetails extends User {
  ussPortalUserId: string;
  emailVerified: boolean;
  accountId: string;
  accountName: string;
  businessType: string;
  customerType: string;
  emailForCC: string[];
  contactId: string;
  quotes: string[];
  contracts: string[];
  accountNumber: string;
  autoPayRequirement: string;
  accounts: Partial<UserDetails>[];
  myussEnabled: boolean;
  myussQuotesEnabled: boolean;
  myussHomeEnabled: boolean;
  myussEasyPayEnabled: boolean;
  myussBillingEnabled: boolean;
  myussOrdersEnabled: boolean;
  myussCasesEnabled: boolean;
  myussProjectsEnabled: boolean;
  myussAssetScanningEnabled:boolean;
  accountDetails?: AccountDetailsForRedis[];
  poRequired: boolean;
  auth0Id?: string;
  accountPaymentStatus: string;
  myussUserRole:string;
  myussModules: Record<string, boolean>;
  enforceRBAC: boolean;
  myussBypassTermsAndConditions:boolean;
}
export class AccountDetailsForRedis {
  accountId: string;
  contracts: string[];
  quotes: string[];
  auth0Id: string;
}
export class AccountDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  contactId: string;
  accountId: string;
  accountName: string;
  accountNumber: string;
  autoPayRequirement: string;
  businessType: string;
  customerType: string;
  emailForCC: string[];
  myussEnabled: boolean;
  myussQuotesEnabled: boolean;
  myussHomeEnabled: boolean;
  myussEasyPayEnabled: boolean;
  myussBillingEnabled: boolean;
  myussOrdersEnabled: boolean;
  myussCasesEnabled: boolean;
  myussProjectsEnabled: boolean;
  poRequired: boolean;
  accountPaymentStatus: string; 
  myussUserRole: string;
  myussModules:  Record<string, boolean>;
  myussBypassTermsAndConditions:boolean;
}
export class UpdateUser {
  Id: string;
  FirstName: string;
  LastName: string;
}
export class DraftModelResponse {
  id: string;
  lastModifiedDate: string;
  name: string;
  shippingAddress: string;
  zipcode: string;
  billAddress: Position;
  currentStatus: number;
  status: string;
}
export class DraftModel {
  
  firestorePaymentMethodId: string;
  isAutoPay: boolean;
  id: string;
  lastModifiedDate: string;
  name: string;
  shippingAddress?: string;
  zipcode?: string;
  billAddress?: Position;
  shipAddress?: Position;
  currentStatus: number;
  status: string;
  siteComplete: boolean;
  billingComplete: boolean;
  paymentMethodId: string;
  isCheckPaymentMethod: boolean;
  paymentMode?: string;
  source?: string;
  projectDetails?: Project;
  startDate?: string;
  endDate?: string;
  createdDate?:string;
  expiryDate?:string;
  quoteName?:string;
}
export class Position {
  lat: number;
  lng: number;
}
export class FirestorePaymentDetails {
  quoteId: string;
  paymentMethodId: string;
  isAutoPay: boolean;
}

export class AccountContactRelationModel{
   id: string;
   contactId: string;
   contactName: string;
   ussPortalId: string;
   accountId: string;
   accountName: string;
   myUssUserRole:string;
   myUssModules: string;
   isActive: boolean;
   roles: string;
   email: string;
   auth0Id: string;
   phoneNumber: string;
   status: string;
}

export class CreateUserResponseModel {
  email: string;
  success: boolean;
  error: string;    
  isExistingUser?: boolean;
}


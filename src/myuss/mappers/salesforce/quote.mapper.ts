import { SBQQ__Quote__c } from '../../../backend/sfdc/model/SBQQ__Quote__c';

import {
  QuoteDocument,
  QuoteModel,
  UserDetails,
  User as MyUssUser,
  Contact as MyUssContact,
  Account,
  PurchaseOrder,
  Address,
} from '../../../myuss/models';
import { SFDC_AccountMapper } from './account.mapper';
import { SFDC_ContactMapper } from './contact.mapper';
import { SFDC_QuoteLineMapper } from './quote-line.mapper';
import { SFDC_AddressMapper } from './address.mapper';
import { SFDC_QuotedJobSitesMapper } from './job-site.mapper';
import { SBQQ__QuoteLine__c } from '../../../backend/sfdc/model/SBQQ__QuoteLine__c';
import { SBQQ__QuoteDocument__c } from '../../../backend/sfdc/model/SBQQ__QuoteDocument__c';
import { SFDC__QuoteDocumentMapper } from './quote-document.mapper';
import { GeneralUtils } from '../../../core/utils/general.utils';
import { MYUSS_SYSTEM_USERNAME, USS_CUSTOMERCARE_EMAIL, USS_CUSTOMERCARE_PHONE } from '../../../core/utils/constants';
import { Contact } from '../../../backend/sfdc/model/Contact';
import { User } from '../../../backend/sfdc/model/User';
import { SFDC_ProjectMapper } from './project.mapper';
import { Contact as MyUSSContact } from '../../models/contact.model';
import { SFDC_PurchaseOrderMapper } from './purchase-order.mapper';


export class SFDC_QuoteMapper {
  public static getMyUSSQuoteModeFromCPQ(cpqQuote: SBQQ__Quote__c): QuoteModel {
    const quote = new QuoteModel();
    quote.quoteId = cpqQuote.Id;
    quote.quoteNumber = cpqQuote.Name;
    quote.quoteName = cpqQuote.Quote_Name__c;
    quote.account = !cpqQuote.SBQQ__Account__r?new Account():SFDC_AccountMapper.getMyUSSAccountFromSFDCAccount(cpqQuote.SBQQ__Account__r);
    quote.startDate = cpqQuote.SBQQ__StartDate__c;
    quote.endDate = cpqQuote.SBQQ__EndDate__c;
    //quote.opportunity= cpqQuote.
    quote.priceBookId = cpqQuote.SBQQ__PricebookId__c;
    quote.primaryContact = !cpqQuote.SBQQ__PrimaryContact__r?new MyUSSContact():SFDC_ContactMapper.getMyUSSContactFromSFDCContact(cpqQuote.SBQQ__PrimaryContact__r);
    quote.primarySiteContact = !cpqQuote.SBQQ__PrimaryContact__c
      ? new MyUssContact()
      : SFDC_ContactMapper.getMyUSSContactFromSFDCContact(cpqQuote.SBQQ__PrimaryContact__r);
    quote.secondaryContactData = !cpqQuote.SecondaryBillToContact__r
     ? new MyUssContact()
     : SFDC_ContactMapper.getMyUSSContactFromSFDCContact(cpqQuote.SecondaryBillToContact__r);
       
    //quote.billToContact= cpqQuote.
    //quote.primarySiteContact= cpqQuote.
    //quote.shipToContact= cpqQuote.
    quote.shippingAddress = SFDC_AddressMapper.getMyUSSAddressFromSFDCAddress(cpqQuote.Shipping_Address__r);
    quote.billTiming = cpqQuote.Bill_Timing__c;
    quote.billingPeriod = cpqQuote.Billing_Period__c;
    quote.declineDamageWaiver = cpqQuote.Decline_Damage_Waiver__c;
    quote.orderType = cpqQuote.Order_Type__c;
    //quote.primary= cpqQuote.
    quote.isAutoPay = cpqQuote.AutoPay__c;
    quote.billToAddress= cpqQuote.Bill_To_Address__r ? SFDC_AddressMapper.getMyUSSAddressFromSFDCAddress(cpqQuote.Bill_To_Address__r) : new Address();
    quote.billingComplete = cpqQuote.Billing_Complete__c;
    quote.orderedinSalesforce = true;
    quote.invoiceDeliveryMethod = cpqQuote.InvoiceDeliveryMethod__c;
    quote.paymentMethodId = cpqQuote.Payment_Method_Id__c;
    quote.paymentMode = cpqQuote.Payment_Mode__c;
    quote.preOrderFlowComplete = cpqQuote.PreOrder_Flow_Complete__c;
    quote.siteComplete = cpqQuote.Site_Complete__c;
    quote.billingApprovalStatus = cpqQuote.Billing_Approval_Status__c;
    quote.purchaseOrder = cpqQuote.Purchase_Order__r ? SFDC_PurchaseOrderMapper.getMyUSSPurchaseOrderFromSFDCPurchaseOrder(cpqQuote.Purchase_Order__r) : new PurchaseOrder()
    quote.facilityName = cpqQuote.Facility_Name__c;
    quote.subdivisionName = cpqQuote.Subdivision_Name__c;
    quote.status = cpqQuote.SBQQ__Status__c;
    quote.currentStatus = 0;
    quote.ordered = cpqQuote.SBQQ__Ordered__c;
    quote.billCycleDay = cpqQuote.BillCycleDay__c;
    quote.chargeType = cpqQuote.Charge_Type__c;
    quote.eECPercent = cpqQuote.EEC_Percent__c;
    quote.eSFPercent = cpqQuote.ESF_Percent__c;
    quote.fuelSurchargePercent = cpqQuote.Fuel_Surcharge_Percent__c;
    quote.lastBillingDate = cpqQuote.LastBillingDate__c;
    quote.legalEntity = cpqQuote.Legal_Entity__c;
    quote.legalEntityCode = cpqQuote.Legal_entity_code__c;
    quote.branchCode = cpqQuote.Location_Code__c;
    quote.customerType = cpqQuote.Customer_Type__c;
    quote.BusinessType = cpqQuote.Business_Type__c;
    quote.jobSites =
      cpqQuote.NF_Quoted_Jobsites__r == undefined
        ? []
        : SFDC_QuotedJobSitesMapper.getMyUSSQuotedJobSitesFromSFDCQuotedJobSites(cpqQuote.NF_Quoted_Jobsites__r);

    const mappedDocuments: QuoteDocument[] = cpqQuote?.SBQQ__R00N70000001lX7YEAU__r?.['records']?.map(
      (quoteDocument: SBQQ__QuoteDocument__c) => {
        return SFDC__QuoteDocumentMapper.getMyUSSQuoteDocumentFromSFDCQuoteDocument(quoteDocument);
        // convert date string to date object
      },
    );

    quote.quoteDocuments = mappedDocuments;
    quote.creditCardPaymentStatus = cpqQuote.Credit_Card_Payment_Status__c;
   // quote.billingSystem = cpqQuote.Billing_System__c;
    quote.cPQTemplate = cpqQuote.CPQ_Template__c;
    quote.enableServerSidePricingCalculation = cpqQuote.Enable_Server_Side_Pricing_Calculation__c;
    quote.taxEntityUseCode = cpqQuote.AVA_SFCPQ__Entity_Use_Code__r?.Name;
    quote.avaTaxCompanyCode = cpqQuote.AvaTax_Company_Code__c;
    quote.aVASFCPQIsSellerImporterOfRecord = cpqQuote.AVA_SFCPQ__Is_Seller_Importer_Of_Record__c;
    quote.avaSalesTaxAmount = cpqQuote.AVA_SFCPQ__SalesTaxAmount__c;
    quote.avaSalesTaxMessage = cpqQuote.AVA_SFCPQ__AvaTaxMessage__c;
    quote.duration = cpqQuote.Duration__c;
    //quote.createdBy= cpqQuote.
    //quote.createdById= cpqQuote.
    //quote.createdDate= cpqQuote.
    quote.quoteReferenceNumber = cpqQuote.Reference_Number__c;
    quote.quoteDate = cpqQuote.Quote_Date__c;
    quote.expirationDate = cpqQuote.SBQQ_ExpirationDateFormatted__c;
    quote.quoteExpiryDate = cpqQuote.SBQQ__ExpirationDate__c;
    quote.ussContact = !cpqQuote.SBQQ__Account__r?new MyUssUser():SFDC_QuoteMapper.getUssContactFromSDFCSalesRepAndAccountOwner(
      cpqQuote.SBQQ__SalesRep__r,
      cpqQuote.SBQQ__Account__r.Owner,
    );

    quote.oneTimeSubtotal = GeneralUtils.roundToTwoDecimals(cpqQuote.One_Time_Subtotal__c || 0);
    quote.oneTimeTax = GeneralUtils.roundToTwoDecimals(cpqQuote.One_Time_Tax__c || 0);

    quote.oneTimeTotal = GeneralUtils.roundToTwoDecimals(cpqQuote.One_Time_Total__c || 0);

    quote.recurringSubtotal = GeneralUtils.roundToTwoDecimals(cpqQuote.Recurring_Subtotal__c || 0);
    quote.recurringTax = GeneralUtils.roundToTwoDecimals(cpqQuote.Recurring_Tax__c || 0);
    quote.recurringTotal = GeneralUtils.roundToTwoDecimals(cpqQuote.Recurring_Total__c || 0);
    const sbqqQuoteLines: SBQQ__QuoteLine__c[] = cpqQuote.SBQQ__LineItems__r;
    quote.quoteLines =
      sbqqQuoteLines != null ? SFDC_QuoteLineMapper.getMyUSSQuoteLineModeFromCPQ(sbqqQuoteLines['records']) : [];
    quote.sourceSystem = 'SalesForce';
    quote.projectDetails = cpqQuote.SBQQ__Opportunity2__r.USF_Project__r ? SFDC_ProjectMapper.getMyUSSProjectFromSFDCProject(cpqQuote.SBQQ__Opportunity2__r.USF_Project__r,[],cpqQuote.SBQQ__Account__c) : null
    quote.estimatedEndDate = cpqQuote.Estimated_End_Date__c;
    quote.createdDate = cpqQuote.CreatedDate;
    return quote;
  }

  private static getUssContactFromSDFCSalesRepAndAccountOwner(
    sfdcSalesRep: Contact,
    sfdcAccountOwner: User,
  ): MyUssUser {
    const ussContact = new MyUssUser();
    //create customer care UserDetails object
    let customerCare = new UserDetails();
    customerCare.firstName = 'Customer Care';
    customerCare.lastName = '';
    customerCare.title = '';
    customerCare.phone = USS_CUSTOMERCARE_PHONE;
    customerCare.email = USS_CUSTOMERCARE_EMAIL;

    if (sfdcSalesRep == null) {
      return customerCare;
    }
    let saleRepName = sfdcSalesRep.FirstName + ' ' + sfdcSalesRep.LastName;
    let accountOwnerName = sfdcAccountOwner.FirstName + ' ' + sfdcAccountOwner.LastName;

    //check sfdcSalesRep first name and last name is MyUSS System Admin then check for account owner
    if (saleRepName.trim().toLowerCase() === MYUSS_SYSTEM_USERNAME.toLowerCase()) {
      if (accountOwnerName.trim().toLowerCase() === MYUSS_SYSTEM_USERNAME.toLowerCase()) {
        return customerCare;
      } else {
        ussContact.id = sfdcAccountOwner.Id;
        ussContact.firstName = sfdcAccountOwner.FirstName;
        ussContact.lastName = sfdcAccountOwner.LastName;
        ussContact.title = sfdcAccountOwner.Title;
        ussContact.phone = sfdcAccountOwner.Phone;
        ussContact.email = sfdcAccountOwner.Email;
        return ussContact;
      }
    } else {
      ussContact.id = sfdcSalesRep.Id;
      ussContact.firstName = sfdcSalesRep.FirstName;
      ussContact.lastName = sfdcSalesRep.LastName;
      ussContact.title = sfdcSalesRep.Title;
      ussContact.phone = sfdcSalesRep.Phone;
      ussContact.email = sfdcSalesRep.Email;
      return ussContact;
    }
  }
}

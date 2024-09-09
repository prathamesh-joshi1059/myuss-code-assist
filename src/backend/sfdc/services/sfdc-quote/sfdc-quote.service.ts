import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../../../core/logger/logger.service';
import { SfdcBaseService } from '../sfdc-base/sfdc-base.service';
import { SfdcDocumentService } from '../sfdc-document/sfdc-document.service';
import { SBQQ__Quote__c } from '../../model/SBQQ__Quote__c';
import { DraftModelResponse } from '../../../../myuss/models/user.model';
import { Quote, SfdcRespModel, SubSite } from '../../../../myuss/models/quote.model';
import { SBQQ__QuoteLine__c } from '../../model/SBQQ__QuoteLine__c';
import { Account } from '../../model/Account';
import { USF_Address__c } from '../../model/USF_Address__c';
import { SBQQ__Product__c } from '../../model/SBQQ__Product__c';
import { SiteDetailsReqDTO } from '../../../../myuss/controllers/quote/dto/save-site-details-req-dto';
import { ConfirmQuoteReqDTO } from '../../../../myuss/controllers/quote/dto/confirm-quote-req-dto';
import { BillingDetailsReqDTO } from '../../../../myuss/controllers/quote/dto/save-billing-details-req-dto';
import { UpdateQuoteStatusReqDTO } from '../../../../myuss/controllers/quote/dto/update-quote-status-req-dto';
import { AddProductAndCalculateReqDTO } from '../../../../myuss/controllers/quote/dto/add-product-calculate-req.dto';
import { ContactDto } from '../../../../myuss/controllers/user/dto/contact/contact.dto';
import { CPQ_QuoteModel } from '../../model/cpq/QuoteModel';
import { NF_Quoted_Jobsite__c } from '../../model/NF_Quoted_Jobsite__c';
import { SfdcAccountService } from '../sfdc-account/sfdc-account.service';
import { Opportunity } from '../../model/Opportunity';
import { Address } from '../../../../myuss/models/address.model';
import { SFDC_QuotedJobSitesMapper } from '../../../../myuss/mappers/salesforce/job-site.mapper';
import { SFDC_AddressMapper } from '../../../../myuss/mappers/salesforce/address.mapper';
import { SFDC_Response } from '../../model/SFDC_Response';
import { USF_WON_REASON } from '../../../../core/utils/constants';
import { CreateInitialQuoteReqDTO } from 'src/myuss/v2/controllers/quote/dto/create-initial-quote-req.dto';
@Injectable()
export class SfdcQuoteService {
  constructor(
    private sfdcBaseService: SfdcBaseService,
    private sfdcDocumentService: SfdcDocumentService,
    private sfdcAccountService: SfdcAccountService,
    private logger: LoggerService
  ) {}

  async getQuoteByOrderNo(orderNo: string) {
    const quotes = await this.sfdcBaseService.conn
      .sobject('SBQQ__Quote__c')
      .select(`Id, Payment_Method_Id__c, SBQQ__Status__c`)
      .where({
        Reference_Number__c: orderNo,
      })
      .execute();
    if (quotes?.length === 0) {
      return null;
    }
    const quote = new SBQQ__Quote__c();
    quote.Id = quotes[0].Id;
    quote.Payment_Method_Id__c = quotes[0].Payment_Method_Id__c;
    quote.SBQQ__Status__c = quotes[0].SBQQ__Status__c;
    return quote;
  }

  async getTemplateIdForQuoteById(quoteId: string): Promise<string> {
    const quotes = await this.sfdcBaseService.conn
      .sobject('SBQQ__Quote__c')
      .select(`Id, CPQ_Template__c`)
      .where({ Id: quoteId })
      .limit(1)
      .execute();
    if (quotes?.length === 0) {
      return null;
    }
    return quotes[0].CPQ_Template__c;
  }

  async getAddressDetailsById(addressId: string): Promise<Address> {
    const address = await this.sfdcBaseService.conn
      .sobject('USF_Address__c')
      .select(
        `Id, USF_Ship_To_Address__c, USF_Street__c, Site_Name__c,NF_Is_Parent__c, USF_Account__c, USF_City__c, USF_Country__c,USF_State__c,USF_Zip_Code__c,Name,Address_Latitude_Longitude__Latitude__s,Address_Latitude_Longitude__Longitude__s`,
      )
      .where({ Id: addressId })
      .limit(1)
      .execute();
    if (address?.length === 0) {
      return null;
    }

    const addressModel = new Address();
    addressModel.id = address[0].id;
    addressModel.isShippingAddress = address[0].USF_Ship_To_Address__c;
    addressModel.street = address[0].USF_Street__c;
    addressModel.siteName = address[0].Site_Name__c;
    addressModel.isParent = address[0].NF_Is_Parent__c;
    addressModel.accountId = address[0].USF_Account__c;
    addressModel.city = address[0].USF_City__c;
    addressModel.country = address[0].USF_Country__c;
    addressModel.state = address[0].USF_State__c;
    addressModel.zipcode = address[0].USF_Zip_Code__c;
    addressModel.latitude = address[0].Address_Latitude_Longitude__Latitude__s;
    addressModel.longitude = address[0].Address_Latitude_Longitude__Latitude__s;

    return addressModel;
  }

  async getQuoteByAccountAndOrderNo(accountNo: string, orderNo: string) {
    /*
    SELECT Id, SBQQ__Account__r.USF_Account_Number__c, SBQQ__Account__r.Name, 
    Shipping_Address__r.USF_Street__c, Fuel_Surcharge_Percent__c, 
      (SELECT Id, USS_Net__c, AVA_SFCPQ__TaxAmount__c, Fuel_Surcharge_Percent__c, 
        SBQQ__ChargeType__c, SBQQ__Product__r.Name FROM SBQQ__LineItems__r) 
    FROM SBQQ__Quote__c 
    WHERE SBQQ__Account__r.USF_Account_Number__c = 'ACT-01640651' AND Reference_Number__c = '512895'
    */
    const conn = this.sfdcBaseService.conn;
    const quotes = await conn
      .sobject('SBQQ__Quote__c')
      .select(
        `Id, SBQQ__Status__c, SBQQ__StartDate__c, 
              Credit_Card_Payment_Status__c, Site_Complete__c, Billing_Complete__c,
              SBQQ__Account__r.USF_Account_Number__c, SBQQ__Account__r.Name, 
               SBQQ__Account__r.PP_Email__c, Shipping_Address__r.USF_Street__c`,
      )
      .include('SBQQ__LineItems__r')
      .select(
        `Id, USS_Net__c, Total_Sales_Tax_Amount__c, Fuel_Surcharge_Amount__c,
                  EEC_Charge__c, ESF_Charge__c, Houston_Franchise_Fees__c,
                  SBQQ__ChargeType__c, SBQQ__Product__r.Name`,
      )
      .end()
      .where({
        'SBQQ__Account__r.USF_Account_Number__c': accountNo,
        Reference_Number__c: orderNo,
      })
      .execute();
    if (quotes?.length === 0) {
      return null;
    }
    const quote = new SBQQ__Quote__c();
    const quoteData = quotes[0];
    quote.Id = quoteData.Id;
    //quote.Billing_System__c = quoteData.Billing_System__c;
    quote.SBQQ__Status__c = quoteData.SBQQ__Status__c;
    quote.SBQQ__StartDate__c = quoteData.SBQQ__StartDate__c;
    quote.Site_Complete__c = quoteData.Site_Complete__c;
    quote.Billing_Complete__c = quoteData.Billing_Complete__c;
    quote.Credit_Card_Payment_Status__c = quoteData.Credit_Card_Payment_Status__c;
    quote.SBQQ__Account__r = new Account();
    quote.SBQQ__Account__r.Name = quoteData.SBQQ__Account__r.Name;
    quote.SBQQ__Account__r.USF_Account_Number__c = quoteData.SBQQ__Account__r.USF_Account_Number__c;
    quote.SBQQ__Account__r.PP_Email__c = quoteData.SBQQ__Account__r.PP_Email__c;
    quote.Shipping_Address__r = new USF_Address__c();
    quote.Shipping_Address__r.USF_Street__c = quoteData.Shipping_Address__r.USF_Street__c;
    quote.Fuel_Surcharge_Percent__c = quoteData.Fuel_Surcharge_Percent__c;
    quote.SBQQ__LineItems__r = [];
    quoteData.SBQQ__LineItems__r.records.forEach((lineItemData) => {
      const lineItem = new SBQQ__QuoteLine__c();
      lineItem.Id = lineItemData.Id;
      lineItem.USS_Net__c = lineItemData.USS_Net__c;
      lineItem.Total_Sales_Tax_Amount__c = lineItemData.Total_Sales_Tax_Amount__c;
      lineItem.EEC_Charge__c = lineItemData.EEC_Charge__c;
      lineItem.ESF_Charge__c = lineItemData.ESF_Charge__c;
      lineItem.Houston_Franchise_Fees__c = lineItemData.Houston_Franchise_Fees__c;
      lineItem.Fuel_Surcharge_Amount__c = lineItemData.Fuel_Surcharge_Amount__c;
      lineItem.SBQQ__ChargeType__c = lineItemData.SBQQ__ChargeType__c;
      lineItem.SBQQ__Product__r = new SBQQ__Product__c();
      lineItem.SBQQ__Product__r.Name = lineItemData.SBQQ__Product__r.Name;
      quote.SBQQ__LineItems__r.push(lineItem);
    });
    return quote;
  }

  getQuoteDocument(id: string, documentId: string): any {
    // TODO: make this realistic
    return this.sfdcDocumentService.getDocument(documentId);
  }

  async getServicableRefId(zipcode: string): Promise<object> {
    const soql = `select Id, Name, Zip_Code__c, Location_Code__c, Branch_Name__c, State__c, City__c, Is_Pilot__c, Out_of_Footprint__c
    FROM Serviceable_Zip_Code__c
    WHERE Zip_Code__c = '${zipcode}'`;
    const resp = await this.sfdcBaseService.getQuery(soql);
    this.logger.info('getServicableRefId');
    this.logger.info(JSON.stringify(resp));
    return resp;
  }

  public async enableServerSidePricingCalculation(Id: string): Promise<any> {
    const quote = new SBQQ__Quote__c();
    quote.Id = Id;
    quote.Enable_Server_Side_Pricing_Calculation__c = true;
    this.logger.info(`Enabling server-side pricing calculation for quote ${Id}`);
    return await this.sfdcBaseService.updateSObject('SBQQ__Quote__c', quote);
  }

  async getDocumentId(id: string): Promise<any> {
    const soql = `SELECT Id, Name, Reference_Number__c, (SELECT Id, Name, SBQQ__DocumentId__c, SBQQ__Version__c FROM SBQQ__R00N70000001lX7YEAU__r)
    FROM SBQQ__Quote__c WHERE Id = '${id}'`;
    const resp = await this.sfdcBaseService.getQuery(soql);
    this.logger.info('getDocumentId');
    this.logger.info(resp);

    return resp;
  }

  async getQuoteDetails(id: string): Promise<SBQQ__Quote__c> {
    const soql =
      `SELECT Id, Name, Quote_Name__c,SBQQ__Opportunity2__r.USF_Project__c,
      SBQQ__Opportunity2__r.USF_Project__r.Id,
      SBQQ__Opportunity2__r.USF_Project__r.Name,
      SBQQ__Opportunity2__r.USF_Project__r.USF_Project_Description__c,
      SBQQ__Opportunity2__r.USF_Project__r.USF_Project_Type__c,
      SBQQ__Opportunity2__r.USF_Project__r.USF_External_Project_Type__c,
      SBQQ__Opportunity2__r.USF_Project__r.USF_USS_Project_Status__c, CreatedBy.Name,Site_Complete__c, Reference_Number__c, BillCycleDay__c, Billing_Approval_Status__c, 
    Billing_Complete__c, isCheckPaymentMethod__c,Billing_Period__c, Charge_Type__c,  Bill_Timing__c, EEC_Percent__c, 
    ESF_Percent__c, Fuel_Surcharge_Percent__c, InvoiceDeliveryMethod__c, LastBillingDate__c, 
    Location_Code__c, Bill_To_Contact_Email__c,  SBQQ__Status__c, Order_Type__c, Facility_Name__c,
    Subdivision_Name__c, AutoPay__c, Payment_Method_Id__c, Payment_Mode__c,SBQQ__StartDate__c, SBQQ__EndDate__c, Estimated_End_Date__c, Duration__c,SBQQ__ExpirationDate__c,SBQQ__LineItemCount__c,
    SBQQ__Account__c, CreatedDate, LastModifiedDate,` +
      // Purchase Order
      `Purchase_Order__r.Id, Purchase_Order__r.Name, Purchase_Order__r.Amount__c, Purchase_Order__r.Expiration_Date__c,` +
      // Bundles and Cart-level items
      `(SELECT Id, Product_Type__c, SBQQ__Product__r.Id, SBQQ__Product__r.ProductCode, SBQQ__Product__r.Name, 
      SBQQ__Product__r.Description, SBQQ__Quantity__c, Tax__c, Taxable_Line__c, AVA_SFCPQ__TaxAmount__c,` +
      // Bundle Items
      `(SELECT Id, Product_Type__c, SBQQ__ProductOption__r.Id, SBQQ__Product__r.Id, SBQQ__Product__r.ProductCode, SBQQ__Product__r.Name, 
      SBQQ__Product__r.Description, SBQQ__Quantity__c, Tax__c, Taxable_Line__c, AVA_SFCPQ__TaxAmount__c FROM 
      SBQQ__Quote_Lines__r) FROM SBQQ__LineItems__r WHERE SBQQ__RequiredBy__c = NULL), ` +
      //Site Contact
      `PrimarySiteContact__r.Id, PrimarySiteContact__r.Phone, PrimarySiteContact__r.Email, PrimarySiteContact__r.FirstName,
     PrimarySiteContact__r.LastName,` +
      // Ship to Contact
      `Ship_To_Contact__r.Id, Ship_To_Contact__r.Phone, Ship_To_Contact__r.Email, Ship_To_Contact__r.FirstName, 
    Ship_To_Contact__r.LastName, Ship_To_Contact__r.MailingStreet, Ship_To_Contact__r.MailingCity, 
    Ship_To_Contact__r.MailingState, Ship_To_Contact__r.MailingStateCode, Ship_To_Contact__r.MailingPostalCode, ` +
      // Primary Contact
      `SBQQ__PrimaryContact__r.Id, SBQQ__PrimaryContact__r.Phone, SBQQ__PrimaryContact__r.Email, 
    SBQQ__PrimaryContact__r.FirstName, SBQQ__PrimaryContact__r.LastName, SBQQ__PrimaryContact__r.MailingStreet, 
    SBQQ__PrimaryContact__r.MailingCity, SBQQ__PrimaryContact__r.MailingState, SBQQ__PrimaryContact__r.MailingStateCode, 
    SBQQ__PrimaryContact__r.MailingPostalCode, ` +
      // billing address
      `Bill_To_Address__r.Id,
    Bill_To_Address__r.Name, 
    Bill_To_Address__r.USF_State__c,
    Bill_To_Address__r.USF_City__c, 
    Bill_To_Address__r.USF_Zip_Code__c,` +
      // Shipping Address
      `Shipping_Address__r.Id, 
    Shipping_Address__r.USF_Account__c, 
    Shipping_Address__r.Name,
    Shipping_Address__r.NF_Parent_USF_Address__c,
    Shipping_Address__r.USF_Street__c,
    Shipping_Address__r.USF_City__c,
    Shipping_Address__r.USF_State__c,
    Shipping_Address__r.USF_Zip_Code__c,
    Shipping_Address__r.USF_Country__c,
    Shipping_Address__r.Address_Latitude_Longitude__Latitude__s,
    Shipping_Address__r.Address_Latitude_Longitude__Longitude__s,
    Shipping_Address__r.Is_Primary__c,
    Shipping_Address__r.USF_Ship_To_Address__c,
    Shipping_Address__r.USF_Bill_To_Address__c,
    Shipping_Address__r.NF_Is_Parent__c,
    Shipping_Address__r.Address_Validated__c,
    Shipping_Address__r.GeoCode_Accuracy__c,
    Shipping_Address__r.Site_Name__c,
    Shipping_Address__r.NF_Site_Hours_Start_Time__c,
    Shipping_Address__r.NF_Site_Hours_End_Time__c,
    Shipping_Address__r.NF_Arrival_Start_Time__c,
    Shipping_Address__r.NF_Arrival_End_Time__c,
    Shipping_Address__r.NF_Gate_Code__c,
    Shipping_Address__r.NF_Access_instructions__c,
    Shipping_Address__r.NF_Key_Instructions__c,
    Shipping_Address__r.NF_Other_Instructions__c,
    Shipping_Address__r.NF_Placement__c,
    Shipping_Address__r.NF_Background_Check__c,
    Shipping_Address__r.NF_Clearance_Required__c,
    Shipping_Address__r.Additional_Information__c, ` +
      // JobSites
      `(SELECT Id, Name, NF_Quote__c, NF_End_Date__c, NF_Start_Date__c, NF_Quote_Line__c, NF_USF_Address__r.Id,
    NF_USF_Address__r.USF_Account__c,
    NF_USF_Address__r.Name,
    NF_USF_Address__r.NF_Parent_USF_Address__c,
    NF_USF_Address__r.USF_Street__c,
    NF_USF_Address__r.USF_City__c,
    NF_USF_Address__r.USF_State__c,
    NF_USF_Address__r.USF_Zip_Code__c,
    NF_USF_Address__r.USF_Country__c,
    NF_USF_Address__r.Address_Latitude_Longitude__Latitude__s,
    NF_USF_Address__r.Address_Latitude_Longitude__Longitude__s,
    NF_USF_Address__r.Is_Primary__c,
    NF_USF_Address__r.USF_Ship_To_Address__c,
    NF_USF_Address__r.USF_Bill_To_Address__c,
    NF_USF_Address__r.NF_Is_Parent__c,
    NF_USF_Address__r.Address_Validated__c,
    NF_USF_Address__r.GeoCode_Accuracy__c,
    NF_USF_Address__r.Site_Name__c,
    NF_USF_Address__r.NF_Site_Hours_Start_Time__c,
    NF_USF_Address__r.NF_Site_Hours_End_Time__c,
    NF_USF_Address__r.NF_Arrival_Start_Time__c,
    NF_USF_Address__r.NF_Arrival_End_Time__c,
    NF_USF_Address__r.NF_Gate_Code__c,
    NF_USF_Address__r.NF_Access_instructions__c,
    NF_USF_Address__r.NF_Key_Instructions__c,
    NF_USF_Address__r.NF_Other_Instructions__c,
    NF_USF_Address__r.NF_Background_Check__c,
    NF_USF_Address__r.NF_Clearance_Required__c,
    NF_USF_Address__r.Additional_Information__c,
    NF_USF_Address__r.NF_Placement__c FROM NF_Quoted_Jobsites__r),` +
      // Quote Documents
      `(SELECT Id, Name, SBQQ__DocumentId__c, SBQQ__Version__c FROM SBQQ__R00N70000001lX7YEAU__r)
FROM SBQQ__Quote__c WHERE Id = '${id}'`;
    const resp = await this.sfdcBaseService.getQuery(soql);
    let quote = new SBQQ__Quote__c();
    // TODO: Add error handling
    Object.assign(quote, resp['records'][0]);
    return quote;
  }

  async fetchDrafts(accountIds: string[],projectId:string,status:string): Promise<Partial<SBQQ__Quote__c>[]> {
    let soql = `Id, 
      LastModifiedDate, 
      Name, 
      SBQQ__Status__c,
      Shipping_Address__r.Address_Latitude_Longitude__Latitude__s,
      Shipping_Address__r.Address_Latitude_Longitude__Longitude__s,
      Shipping_Address__r.Name,Serviceable_Zip_Code__r.Zip_Code__c,
      Site_Complete__c,
      Billing_Complete__c,
      Payment_Method_Id__c,
      isCheckPaymentMethod__c,
      SBQQ__Ordered__c, 
      CreatedBy.Name,
      Bill_To_Address__r.Address_Latitude_Longitude__Latitude__s,
      Bill_To_Address__r.Address_Latitude_Longitude__Longitude__s,
      Payment_Mode__c,
      SBQQ__Opportunity2__c, 
      SBQQ__Opportunity2__r.USF_Project__r.Name, 
      SBQQ__Opportunity2__r.USF_Project__r.Id,
      SBQQ__Opportunity2__r.USF_Project__r.USF_Project_Description__c,
      SBQQ__Opportunity2__r.USF_Project__r.USF_Project_Type__c,
      SBQQ__Opportunity2__r.USF_Project__r.USF_External_Project_Type__c,
      SBQQ__Opportunity2__r.USF_Project__r.USF_USS_Project_Status__c,
      Quote_Name__c,
      CreatedDate,
      SBQQ__StartDate__c,
      SBQQ__EndDate__c,
      SBQQ__ExpirationDate__c,
      SBQQ__LineItemCount__c`

      let whereCondition ={};
    if(!projectId){
      if(status === 'Archived'){
        whereCondition = {
          SBQQ__Status__c: 'Archived',
          SBQQ__Account__c: { $in: accountIds },
        }
      }
      else{
        whereCondition = {
          SBQQ__Status__c: { $nin: ['Archived' , 'Ordered', 'Rejected'] },
          SBQQ__Account__c: { $in: accountIds },
        }
      }
      const draftsResp = await this.sfdcBaseService.conn.sobject('SBQQ__Quote__c')
      .select(soql)
      .where(whereCondition)
      .orderby('LastModifiedDate', 'DESC')
      return draftsResp;
    }else{
      if(status === 'Archived'){
        // whereCondition = 'SBQQ__Account__c = \''+accountIds+'\' AND SBQQ__Status__c = \''+status+'\' AND SBQQ__Opportunity2__r.USF_Project__r.Id = \''+projectId+'\''
        whereCondition = {
          SBQQ__Account__c:{$in:accountIds},
          SBQQ__Status__c: 'Archived',
          'SBQQ__Opportunity2__r.USF_Project__r.Id': projectId
        }
      }else{
        // whereCondition = 'SBQQ__Account__c = \''+accountIds+'\' AND SBQQ__Status__c != \'Archived\' AND SBQQ__Opportunity2__r.USF_Project__r.Id = \''+projectId+'\''
        whereCondition = {
          SBQQ__Status__c: { $ne: 'Archived' },
          SBQQ__Account__c: { $in: accountIds },
          'SBQQ__Opportunity2__r.USF_Project__r.Id': projectId
        }
      }
      const draftsResp = await this.sfdcBaseService.conn.sobject('SBQQ__Quote__c')
      .select(soql)
      .orderby('LastModifiedDate', 'DESC')
      .where(whereCondition)
      .orderby('LastModifiedDate', 'DESC')
      return draftsResp;
    }
  }
  async fetchOrderedQuote(accountIds: any): Promise<object> {
    const query = `SELECT Id, LastModifiedDate, Name, SBQQ__Status__c,Shipping_Address__r.Name,Serviceable_Zip_Code__r.Zip_Code__c,
    Site_Complete__c,Billing_Complete__c,Payment_Method_Id__c,isCheckPaymentMethod__c,SBQQ__Ordered__c,
    Bill_To_Address__r.Address_Latitude_Longitude__Latitude__s,Bill_To_Address__r.Address_Latitude_Longitude__Longitude__s
    FROM SBQQ__Quote__c WHERE SBQQ__Status__c = 'Ordered' AND SBQQ__Account__c IN ('${accountIds.join("','")}')`;
    let orderArr = [];
    const activeOrderedResp = await this.sfdcBaseService.getQuery(query);
    for (const iterator of activeOrderedResp.records) {
      let order: DraftModelResponse = {
        id: iterator.Id,
        lastModifiedDate: iterator.LastModifiedDate,
        name: iterator.Name,
        shippingAddress: iterator.Shipping_Address__r.Name,
        zipcode: iterator.Serviceable_Zip_Code__r ? iterator.Serviceable_Zip_Code__r.Zip_Code__c : '',
        billAddress: {
          lat: iterator.Bill_To_Address__r ? iterator.Bill_To_Address__r.Address_Latitude_Longitude__Latitude__s : 0,
          lng: iterator.Bill_To_Address__r ? iterator.Bill_To_Address__r.Address_Latitude_Longitude__Longitude__s : 0,
        },
        currentStatus: 0,
        status: iterator.SBQQ__Status__c,
      };
      orderArr.push(order);
    }
    this.logger.info('orderArr: ' + orderArr);
    return { data: orderArr };
  }

  //fetch archived drafts - all/by projectId
  async fetchArchivedDrafts(accountIds: string[],projectId:string): Promise<object[]> {
    let archivedDrafts = [];
    let soql = `Id, LastModifiedDate, Name, SBQQ__Status__c,Shipping_Address__r.Name,Serviceable_Zip_Code__r.Zip_Code__c,
      Site_Complete__c,Billing_Complete__c,Payment_Method_Id__c,isCheckPaymentMethod__c,SBQQ__Ordered__c,
      Bill_To_Address__r.Address_Latitude_Longitude__Latitude__s,Bill_To_Address__r.Address_Latitude_Longitude__Longitude__s,
      SBQQ__Opportunity2__c, SBQQ__Opportunity2__r.USF_Project__r.Name , SBQQ__Opportunity2__r.USF_Project__r.Id,
      SBQQ__Opportunity2__r.USF_Project__r.USF_Project_Description__c,SBQQ__Opportunity2__r.USF_Project__r.USF_Project_Type__c,
      SBQQ__Opportunity2__r.USF_Project__r.USF_External_Project_Type__c,SBQQ__Opportunity2__r.USF_Project__r.USF_USS_Project_Status__c`
    if(!projectId){
      archivedDrafts = this.sfdcBaseService.conn
      .sobject('SBQQ__Quote__c')
      .select(soql)
      .where({
        SBQQ__Status__c: 'Archived',
        SBQQ__Account__c: { $in: accountIds }
      })
      .execute();
      return archivedDrafts;
    }else{
      archivedDrafts = this.sfdcBaseService.conn
      .sobject('SBQQ__Quote__c')
      .select(soql)
      .where({
        SBQQ__Status__c: 'Archived',
        SBQQ__Account__c: { $in: accountIds },
        'SBQQ__Opportunity2__r.USF_Project__r.Id': projectId
      })
      .execute();
      return archivedDrafts;

    }

  }
  async fetchSuspendedDrafts(accountIds: string[]): Promise<object> {
    const soql = `SELECT Id,Reference_Number__c, Ship_To__c,Ship_To_Zip_Code__c,LastModifiedDate ,Bill_To_Address__r.Name,Bill_To_Address__r.Address_Latitude_Longitude__Latitude__s,
    Bill_To_Address__r.Address_Latitude_Longitude__Longitude__s FROM Contract WHERE Status = 'Suspended' AND AccountId IN ('${accountIds.join(
      "','",
    )}')`;
    const draftsResp = await this.sfdcBaseService.getQuery(soql);
    return draftsResp;
  }

  async updateBillingAddress(billingDetailsReq: BillingDetailsReqDTO): Promise<boolean> {
    try {
      let poId = '';
      // get the bill to email address from the Account
      const primaryPayerEmail = await this.sfdcAccountService.getPrimaryPayerEmail(billingDetailsReq.accountId);

      if (billingDetailsReq.poNumber.length > 0) {
        this.logger.info('in po');
        poId = await this.getPoReferenceNumber(billingDetailsReq);
      }
      let updateSecondaryContact = null;
      if (billingDetailsReq.secondaryContactData.firstName) {
        updateSecondaryContact = await this.updateSecondaryContact(billingDetailsReq);
      }
      if (billingDetailsReq.addressExist) {
        // if the address exists but is a new billing address for the Account, set its properties
        if (billingDetailsReq.newBillingAddressForAccount && billingDetailsReq.addressRefId) {
          await this.sfdcBaseService.updateSObject('USF_Address__c', {
            Id: billingDetailsReq.addressRefId,
            USF_Bill_To_Address__c: true,
            Is_Primary__c: true,
          });
        }
        this.logger.info(
          `Updating bill address to ${billingDetailsReq.addressRefId} for ${
            billingDetailsReq.quoteId
          } at ${new Date()}`,
        );
        const updateBillingResp = await this.sfdcBaseService.updateSObject('SBQQ__Quote__c', {
          Id: billingDetailsReq.quoteId,
          Bill_To_Address__c: billingDetailsReq.addressRefId,
          BillToContact__c: billingDetailsReq.contactRefId,
          //SBQQ__PrimaryContact__c: billingDetailsReq.contactRefId,
          SecondaryBillToContact__c: updateSecondaryContact ? updateSecondaryContact.id : null,
          Billing_Complete__c: true,
          Purchase_Order__c: poId,
          Bill_To_Contact_Email__c: primaryPayerEmail,
          Billing_Approval_Status__c: 'Approved',
        });
        this.logger.info('updateBillingResp123: ' + JSON.stringify(updateBillingResp));
        const updateBillingAddressRespModel = new SfdcRespModel();
        Object.assign(updateBillingAddressRespModel, updateBillingResp);
        if (updateBillingAddressRespModel.success) {
          return true;
        } else {
          return false;
        }
      } else {
        try {
          const createAddressResp = await this.sfdcBaseService.createSObject('USF_Address__c', {
            USF_Account__c: billingDetailsReq.accountId,
            USF_Street__c: billingDetailsReq.address.street,
            USF_City__c: billingDetailsReq.address.city,
            USF_State__c: billingDetailsReq.address.state,
            USF_Country__c: billingDetailsReq.address.country,
            USF_Zip_Code__c: billingDetailsReq.address.zipcode,
            USF_Bill_To_Address__c: true,
            Address_Validated__c: true,
            GeoCode_Accuracy__c: 'Street',
            Name: billingDetailsReq.address.street,
            Site_Name__c: billingDetailsReq.address.street,
            Is_Primary__c: true,
          });
          const createAddressDetailsRespModel = new SfdcRespModel();
          Object.assign(createAddressDetailsRespModel, createAddressResp);

          let updateBillingResp = await this.sfdcBaseService.updateSObject('SBQQ__Quote__c', {
            Id: billingDetailsReq.quoteId,
            Bill_To_Address__c: createAddressDetailsRespModel.id,
            BillToContact__c: billingDetailsReq.contactRefId,
            //SBQQ__PrimaryContact__c: billingDetailsReq.contactRefId,
            SecondaryBillToContact__c: updateSecondaryContact ? updateSecondaryContact.id : null,
            Billing_Complete__c: true,
            Purchase_Order__c: poId,
            Bill_To_Contact_Email__c: primaryPayerEmail,
            Billing_Approval_Status__c: 'Approved',
          });
          const updateBillingAddressRespModel = new SfdcRespModel();
          Object.assign(updateBillingAddressRespModel, updateBillingResp);
          if (updateBillingAddressRespModel.success) {
            return true;
          } else {
            return false;
          }
        } catch (err) {
          this.logger.error('err: ' + err);
          return false;
        }
      }
    } catch (err) {
      this.logger.error('err: ' + err);
      return false;
    }
  }
  async updateSecondaryContact(BillingDetailsReq: BillingDetailsReqDTO, ): Promise<SfdcRespModel> {
    if (BillingDetailsReq.secondaryContactExist) {
      const createContactRespModel = new SfdcRespModel();
      createContactRespModel.id = BillingDetailsReq.secondaryContactId;
      createContactRespModel.success = true;
      createContactRespModel.errors = [];
      return createContactRespModel;
    } else {
      let contactObj = new ContactDto();
      (contactObj.AccountId = BillingDetailsReq.secondaryContactData.accountId),
        (contactObj.LastName = BillingDetailsReq.secondaryContactData.lastName),
        (contactObj.FirstName = BillingDetailsReq.secondaryContactData.firstName),
        (contactObj.Phone = BillingDetailsReq.secondaryContactData.phone),
        (contactObj.Email = BillingDetailsReq.secondaryContactData.email);
      const createContactResult = await this.sfdcBaseService.createSObject('Contact', contactObj);
      this.logger.info('createContactResult');
      this.logger.info(createContactResult);
      const createContactRespModel = new SfdcRespModel();
      Object.assign(createContactRespModel, createContactResult);
      return createContactRespModel;
    }
  }
  async updateSiteAddress(siteDetailsReq: SiteDetailsReqDTO): Promise<SfdcRespModel> {
    try {
      // TODO: This is a hack... make it better on the front end and implement DTOs
      const startTime =
        siteDetailsReq.addressData.startTime.length < 12 ? null : siteDetailsReq.addressData.startTime;
      const endTime =
        siteDetailsReq.addressData.endTime.length < 12 ? null : siteDetailsReq.addressData.endTime;
      this.logger.info('startTime: ' + startTime);
      this.logger.info('endTime: ' + endTime);
      
      await this.sfdcBaseService.updateSObject('USF_Address__c', {
        Id: siteDetailsReq.addressId,
        NF_Gate_Code__c: siteDetailsReq.addressData.gateCode,
        Additional_Information__c: siteDetailsReq.addressData.information,
        NF_Site_Hours_End_Time__c: endTime,
        NF_Site_Hours_Start_Time__c: startTime,
        NF_Ship_To_Contact__c: siteDetailsReq.addressData.shipToContactRefId,
        NF_Site_Contact__c: siteDetailsReq.addressData.siteContactRefId,
        NF_Clearance_Required__c: siteDetailsReq.addressData.clearanceRequired,
        NF_Background_Check__c: siteDetailsReq.addressData.idRequired,
        Address_Validated__c: true,
      });
      this.logger.info(`Updating existing site address to ${siteDetailsReq.addressId} and 
      contact to ${ siteDetailsReq.contactId} for ${siteDetailsReq.quoteId} at ${new Date()}`);
      let createContactResult = await this.sfdcBaseService.updateSObject('SBQQ__Quote__c', {
        Id: siteDetailsReq.quoteId,
        Shipping_Address__c: siteDetailsReq.addressId,
        //PrimarySiteContact__c: siteDetailsReq.contactId,
        SBQQ__PrimaryContact__c: siteDetailsReq.contactId,
        Site_Complete__c: true,
      });

      const updateSiteAddressRespModel = new SfdcRespModel();
      Object.assign(updateSiteAddressRespModel, createContactResult);
      return updateSiteAddressRespModel;
    } catch (err) {
      const updateSiteAddressRespModel = new SfdcRespModel();
      updateSiteAddressRespModel.success = false;
      updateSiteAddressRespModel.message = err.message;
      return updateSiteAddressRespModel;
    }
  }
  async deleteQuotedJobsiteByAddress(addressId: string): Promise<SfdcRespModel[]>{
    return this.sfdcBaseService.conn.sobject('NF_Quoted_Jobsite__c')
      .find({ NF_USF_Address__c: addressId })
      .destroy(function (err, rets) {
        if (err) { return console.error(err); }
        console.log(rets);
      });
  }
  deleteQuotedJobsiteByQuoteId(quoteId: string): Promise<SfdcRespModel[]> {
    return this.sfdcBaseService.conn.sobject('NF_Quoted_Jobsite__c')
      .find({ NF_Quote__c: quoteId })
      .destroy(function (err, rets) {
        if (err) { return console.error(err); }
        console.log(rets);
      });
  }
  async updateSiteContactV2(siteDetailsReq: CreateInitialQuoteReqDTO): Promise<SfdcRespModel> {

    if (siteDetailsReq.contactExist) {
      const createContactRespModel = new SfdcRespModel();
      createContactRespModel.id = siteDetailsReq.contact.contactId;
      createContactRespModel.success = true;
      createContactRespModel.errors = [];
      return createContactRespModel;
    } else {
      let contactObj = new ContactDto();
      (contactObj.AccountId = siteDetailsReq.accountId),
        (contactObj.LastName = siteDetailsReq.contact.lastName),
        (contactObj.FirstName = siteDetailsReq.contact.firstName),
        (contactObj.Phone = siteDetailsReq.contact.phone),
        (contactObj.Email = siteDetailsReq.contact.email);
      const createContactResult = await this.sfdcBaseService.createSObject('Contact', contactObj);
      this.logger.info('createContactResult');
      this.logger.info(createContactResult);
      const createContactRespModel = new SfdcRespModel();
      Object.assign(createContactRespModel, createContactResult);
      return createContactRespModel;
    }
  }


  async updateSiteContact(siteDetailsReq: SiteDetailsReqDTO, Id: string): Promise<SfdcRespModel> {
    this.logger.info('Id');
    this.logger.info(Id);
    if (siteDetailsReq.contactExist) {
      const createContactRespModel = new SfdcRespModel();
      createContactRespModel.id = siteDetailsReq.contactData.contactId;
      createContactRespModel.success = true;
      createContactRespModel.errors = [];
      return createContactRespModel;
    } else {
      let contactObj = new ContactDto();
      (contactObj.AccountId = siteDetailsReq.contactData.accountId),
        (contactObj.LastName = siteDetailsReq.contactData.lastName),
        (contactObj.FirstName = siteDetailsReq.contactData.firstName),
        (contactObj.Phone = siteDetailsReq.contactData.phone),
        (contactObj.Email = siteDetailsReq.contactData.email);
      const createContactResult = await this.sfdcBaseService.createSObject('Contact', contactObj);
      this.logger.info('createContactResult');
      this.logger.info(createContactResult);
      const createContactRespModel = new SfdcRespModel();
      Object.assign(createContactRespModel, createContactResult);
      return createContactRespModel;
    }
  }
  private timeout(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  async getPoReferenceNumber(obj: any): Promise<string> {
    let poId;
    const poNumber = this.sfdcBaseService.escapeSOQLString(obj.poNumber);
    const soql = `select Id from Purchase_Order__c where Name = '${poNumber}' and Account__c = '${obj.accountId}'`;
    const resp = await this.sfdcBaseService.getQuery(soql);
    this.logger.info('getPOReferenceNumber', JSON.stringify(resp));
    if (resp.records.length > 0) {
      poId = resp.records[0].Id;
    } else {
      let purchaseOrder = {
        Name: obj.poNumber, // UI
        Account__c: obj.accountId,
        Amount__c: 1000,
        Expiration_Date__c: '2049-12-31',
      };
      // create Purchase_Order
      const po = await this.sfdcBaseService.conn.create('Purchase_Order__c', purchaseOrder, function (err, ret) {
        if (err || !ret.success) {
          return this.logger.error(err, ret);
        }
        poId = ret.id;
        //this.logger.info(`poId: ${poId}`);
      });
    }
    this.logger.info(poId);
    return poId;
  }

  async fetchSiteDetails(id: string): Promise<any> {
    const query = `SELECT Shipping_Address__r.NF_Clearance_Required__c, Shipping_Address__r.NF_Background_Check__c ,Shipping_Address__r.Id, Shipping_Address__r.USF_State__c, Shipping_Address__r.Name, Shipping_Address__r.USF_Country__c, Shipping_Address__r.USF_City__c, Shipping_Address__r.USF_Zip_Code__c ,
    Shipping_Address__r.NF_Site_Hours_Start_Time__c, Shipping_Address__r.NF_Site_Hours_End_Time__c, Shipping_Address__r.NF_Gate_Code__c, Shipping_Address__r.NF_Placement__c, Shipping_Address__r.Address_Latitude_Longitude__Latitude__s, 
    Shipping_Address__r.Address_Latitude_Longitude__Longitude__s,PrimarySiteContact__r.Id , PrimarySiteContact__r.FirstName, PrimarySiteContact__r.LastName, PrimarySiteContact__r.Phone, PrimarySiteContact__r.Email,
    Shipping_Address__r.Additional_Information__c FROM SBQQ__Quote__c where Id='${id}'`;

    const resp = await this.sfdcBaseService.getQuery(query);
    this.logger.info('fetchSiteDetails', JSON.stringify(resp));

    let addressObj = resp.records[0].Shipping_Address__r
      ? {
          addressId: resp.records[0].Shipping_Address__r.Id,
          name: resp.records[0].Shipping_Address__r.Name,
          country: resp.records[0].Shipping_Address__r.USF_Country__c,
          city: resp.records[0].Shipping_Address__r.USF_City__c,
          zipcode: resp.records[0].Shipping_Address__r.USF_Zip_Code__c,
          state: resp.records[0].Shipping_Address__r.USF_State__c,
          siteStartTime: resp.records[0].Shipping_Address__r.NF_Site_Hours_Start_Time__c,
          siteEndTime: resp.records[0].Shipping_Address__r.NF_Site_Hours_End_Time__c,
          gateCode: resp.records[0].Shipping_Address__r.NF_Gate_Code__c,
          instructions: resp.records[0].Shipping_Address__r.NF_Placement__c,
          information: resp.records[0].Shipping_Address__r.Additional_Information__c,
          latitude: resp.records[0].Shipping_Address__r.Address_Latitude_Longitude__Latitude__s,
          longitude: resp.records[0].Shipping_Address__r.Address_Latitude_Longitude__Longitude__s,
          clearanceRequired: resp.records[0].Shipping_Address__r.NF_Clearance_Required__c,
          idRequired: resp.records[0].Shipping_Address__r.NF_Background_Check__c,
        }
      : {};
    let contactObj = resp.records[0].PrimarySiteContact__r
      ? {
          contactId: resp.records[0].PrimarySiteContact__r.Id,
          firstName: resp.records[0].PrimarySiteContact__r.FirstName,
          lastName: resp.records[0].PrimarySiteContact__r.LastName,
          phone: resp.records[0].PrimarySiteContact__r.Phone,
          email: resp.records[0].PrimarySiteContact__r.Email,
        }
      : {};
    const respObj = {
      status: 200,
      message: 'Success',
      data: { address: addressObj, contact: contactObj },
    };
    return respObj;
  }

  async fetchBillingDetails(id: string): Promise<any> {
    const query = `SELECT Bill_To_Address__r.Id, Bill_To_Address__r.Name, Bill_To_Address__r.USF_City__c, Bill_To_Address__r.USF_State__c ,Bill_To_Address__r.USF_Zip_Code__c ,Bill_To_Address__r.Site_Name__c,Purchase_Order__r.Name  FROM SBQQ__Quote__c
    where Id='${id}'`;

    const resp = await this.sfdcBaseService.getQuery(query);
    this.logger.debug(JSON.stringify(resp));
    let addressObj = resp.records[0].Bill_To_Address__r
      ? {
          addressId: resp.records[0].Bill_To_Address__r.Id,
          name: resp.records[0].Bill_To_Address__r.Name,
          country: resp.records[0].Bill_To_Address__r.USF_Country__c,
          city: resp.records[0].Bill_To_Address__r.USF_City__c,
          zipcode: resp.records[0].Bill_To_Address__r.USF_Zip_Code__c,
          state: resp.records[0].Bill_To_Address__r.USF_State__c,
          poNumber: resp.records[0].Purchase_Order__r ? resp.records[0].Purchase_Order__r.Name : null,
        }
      : {};

    const respObj = {
      status: 200,
      message: 'Success',
      data: { ...addressObj },
    };
    return respObj;
  }

  async approveQuote(id: string): Promise<boolean> {
    try {
      this.logger.info(`Approving quote ${id} at ${new Date()}`);
      await this.sfdcBaseService.updateSObject('SBQQ__Quote__c', {
        Id: id,
        SBQQ__Status__c: 'Approved',
      });
      return true;
    } catch (err) {
      this.logger.info('error in SfdcQuoteService.approveQuote: ' + err);
      return false;
    }
  }

  async confirmQuote(confirmQuoteReq: ConfirmQuoteReqDTO): Promise<string | boolean> {
    try {
      let quoteToUpdate = new SBQQ__Quote__c();
      quoteToUpdate.Id = confirmQuoteReq.quoteId;
      if (confirmQuoteReq.isAutoPay) {
        quoteToUpdate.AutoPay__c = true;
        quoteToUpdate.Payment_Method_Id__c = confirmQuoteReq.paymentMethodId;
        quoteToUpdate.PreOrder_Flow_Complete__c = true;
        quoteToUpdate.Credit_Card_Payment_Status__c = 'Payment Method Received';
      } else {
        quoteToUpdate.AutoPay__c = false;
        quoteToUpdate.isCheckPaymentMethod__c = true;
        quoteToUpdate.Payment_Mode__c = 'Check';
        quoteToUpdate.Payment_Method_Id__c = confirmQuoteReq.paymentMethodId;
        quoteToUpdate.PreOrder_Flow_Complete__c = true;
        quoteToUpdate.SBQQ__Ordered__c = true;
      }
      // update quote obj
      await this.sfdcBaseService.updateSObject('SBQQ__Quote__c', quoteToUpdate);

      // get the fsl Order Id
      let fslOrderId = null;
      let count = 0;
      while (!fslOrderId && count < 30) {
        count++;
        const fslOrders = await this.sfdcBaseService.conn.query(
          `SELECT Id FROM Order WHERE SBQQ__Quote__c = '${quoteToUpdate.Id}'`,
        );
        if (fslOrders && fslOrders.records.length > 0) {
          const fslOrder = fslOrders.records[0];
          fslOrderId = fslOrder.Id;
        } else {
          await this.timeout(2000);
        }
      }

      // if manual payment then set status of FSL Order to Activated then Quote to Ordered
      if (!confirmQuoteReq.isAutoPay) {
        await this.sfdcBaseService.updateSObject('Order', {
          Id: fslOrderId,
          Status: 'Activated',
        });
        await this.sfdcBaseService.updateSObject('SBQQ__Quote__c', {
          Id: quoteToUpdate.Id,
          SBQQ__Status__c: 'Ordered',
        });
      }
      return fslOrderId;
    } catch (err) {
      this.logger.error('err: ' + err);
      return err.message;
    }
  }

  async postPaymentMethodToQuote(quote: Quote) {
    const quoteToUpdate = new SBQQ__Quote__c();
    quoteToUpdate.Id = quote.id;
    quoteToUpdate.Payment_Method_Id__c = quote.paymentMethodId;
    quoteToUpdate.Credit_Card_Payment_Status__c = 'Payment Method Received';
    quoteToUpdate.PreOrder_Flow_Complete__c = true;
    return await this.sfdcBaseService.updateSObject('SBQQ__Quote__c', quoteToUpdate);
  }

  async updatePaymentMethod(quoteId: string, paymentMethodId: string) {
    const quote = {
      Id: quoteId,
      Payment_Method_Id__c: paymentMethodId,
      Credit_Card_Payment_Status__c: 'Payment Method Received',
      PreOrder_Flow_Complete__c: true,
    };
    return this.sfdcBaseService.updateSObject('SBQQ__Quote__c', quote).then((resp) => {
      return resp;
    });
  }

  async fetchQuoteStatus(id: string): Promise<SBQQ__Quote__c> {
    const quoteStatus = await this.sfdcBaseService.conn
      .sobject('SBQQ__Quote__c')
      .select(
        `Id, SBQQ__Status__c,Site_Complete__c,Billing_Complete__c, Payment_Method_Id__c, isCheckPaymentMethod__c, SBQQ__Ordered__c`,
      )
      .where({ Id: id })
      .limit(1)
      .execute();
    if (quoteStatus?.length === 0) {
      return null;
    }

    let quote = new SBQQ__Quote__c();

    Object.assign(quote, quoteStatus[0]);
    return quote;
  }
  //fetch quoteIds

  async fetchQuoteIds(accountIds: string[]): Promise<string[]> {
    const soql = `SELECT Id, SBQQ__Account__c FROM SBQQ__Quote__c WHERE SBQQ__Account__c IN ('${accountIds.join(
      "','",
    )}')`;
    const quoteIdsResp = (await this.sfdcBaseService.getQuery(soql)).records.map((quote) => quote.Id);

    return quoteIdsResp;
  }

  async getQuoteDetailsForTaxCalc(quoteId: string): Promise<SBQQ__Quote__c> {
    const quotes = await this.sfdcBaseService.conn
      .sobject('SBQQ__Quote__c')
      .select(
        `Name, 
            Legal_entity_code__c,
            AVA_SFCPQ__Is_Seller_Importer_Of_Record__c,
            Ship_From_Street__c,
            Ship_From_City__c,
            Ship_From_State__c,
            Ship_From_Zipcode__c,
            SBQQ__Account__r.USF_Account_Number__c,
            SBQQ__Account__r.AVA_MAPPER__Business_Identification_Number__c,
            SBQQ__Account__r.AVA_MAPPER__Exemption_Number__c,
            AVA_SFCPQ__Entity_Use_Code__r.Name`,
      )
      .include('SBQQ__LineItems__r')
      .select(
        `Id, SBQQ__Quantity__c, SBQQ__ProductCode__c, AVA_SFCPQ__Location_Code__c,
                USS_Net__c, SBQQ__TaxCode__c,
                Ship_From_Street__c, Ship_From_City__c, Ship_From_State__c, Ship_From_Zipcode__c,
                USF_Address__r.USF_Street__c, USF_Address__r.USF_City__c,
                USF_Address__r.USF_State__c, USF_Address__r.USF_Zip_Code__c,
                USF_Address__r.USF_Country__c`,
      )
      .end()
      .where({ Id: quoteId })
      .limit(1)
      .execute();
    if (quotes?.length === 0) {
      return null;
    }
    const quote = new SBQQ__Quote__c();
    const quoteData = quotes[0];
    quote.Id = quoteId;
    quote.Name = quoteData.Name;
    quote.Legal_entity_code__c = quoteData.Legal_entity_code__c;
    quote.AVA_SFCPQ__Is_Seller_Importer_Of_Record__c = quoteData.AVA_SFCPQ__Is_Seller_Importer_Of_Record__c;
    quote.AVA_SFCPQ__Entity_Use_Code__r = {
      Name: quoteData.AVA_SFCPQ__Entity_Use_Code__r?.Name,
    };
    quote.Ship_From_Street__c = quoteData.Ship_From_Street__c;
    quote.Ship_From_City__c = quoteData.Ship_From_City__c;
    quote.Ship_From_State__c = quoteData.Ship_From_State__c;
    quote.Ship_From_Zipcode__c = quoteData.Ship_From_Zipcode__c;
    quote.SBQQ__Account__r = new Account();
    quote.SBQQ__Account__r.USF_Account_Number__c = quoteData.SBQQ__Account__r.USF_Account_Number__c;
    quote.SBQQ__Account__r.AVA_MAPPER__Business_Identification_Number__c =
      quoteData.SBQQ__Account__r.AVA_MAPPER__Business_Identification_Number__c;
    quote.SBQQ__Account__r.AVA_MAPPER__Exemption_Number__c = quoteData.SBQQ__Account__r.AVA_MAPPER__Exemption_Number__c;
    quote.SBQQ__LineItems__r = [];
    quoteData.SBQQ__LineItems__r?.records.forEach((lineItemData) => {
      const lineItem = new SBQQ__QuoteLine__c();
      lineItem.Id = lineItemData.Id;
      lineItem.SBQQ__Quantity__c = lineItemData.SBQQ__Quantity__c;
      lineItem.SBQQ__ProductCode__c = lineItemData.SBQQ__ProductCode__c;
      lineItem.AVA_SFCPQ__Location_Code__c = lineItemData.AVA_SFCPQ__Location_Code__c;
      lineItem.USS_Net__c = lineItemData.USS_Net__c;
      lineItem.SBQQ__TaxCode__c = lineItemData.SBQQ__TaxCode__c;
      lineItem.Ship_From_Street__c = lineItemData.Ship_From_Street__c;
      lineItem.Ship_From_City__c = lineItemData.Ship_From_City__c;
      lineItem.Ship_From_State__c = lineItemData.Ship_From_State__c;
      lineItem.Ship_From_Zipcode__c = lineItemData.Ship_From_Zipcode__c;
      lineItem.USF_Address__r = new USF_Address__c();
      lineItem.USF_Address__r.USF_Street__c = lineItemData.USF_Address__r.USF_Street__c;
      lineItem.USF_Address__r.USF_City__c = lineItemData.USF_Address__r.USF_City__c;
      lineItem.USF_Address__r.USF_State__c = lineItemData.USF_Address__r.USF_State__c;
      lineItem.USF_Address__r.USF_Zip_Code__c = lineItemData.USF_Address__r.USF_Zip_Code__c;
      lineItem.USF_Address__r.USF_Country__c = lineItemData.USF_Address__r.USF_Country__c;
      quote.SBQQ__LineItems__r.push(lineItem);
    });
    return quote;
  }

  async getQuoteDetailsById(quoteId: string): Promise<SBQQ__Quote__c> {
    const quotes = await this.sfdcBaseService.conn
      .sobject('SBQQ__Quote__c')
      .select(
        `Id,
        Name,
        Quote_Name__c,
        SBQQ__StartDate__c,
        Site_Complete__c,
        Billing_Complete__c,
        isCheckPaymentMethod__c,
        SBQQ__EndDate__c,
        SBQQ__PriceBook__c,
        BillToContact__c,
        PrimarySiteContact__c,
        SBQQ__PrimaryContact__c,
        SecondaryBillToContact__c,
        Ship_To_Contact__c,
        AutoPay__c,
        Payment_Method_Id__c,
        Payment_Mode__c,
        SBQQ__Status__c,
        SBQQ__Ordered__c,
        BillCycleDay__c,
        Charge_Type__c,
        EEC_Percent__c,
        ESF_Percent__c,
        Fuel_Surcharge_Percent__c,
        LastBillingDate__c,
        Enable_Server_Side_Pricing_Calculation__c,
        AVA_SFCPQ__Entity_Use_Code__c,
        AvaTax_Company_Code__c,
        AVA_SFCPQ__Is_Seller_Importer_Of_Record__c,
        AVA_SFCPQ__SalesTaxAmount__c,
        AVA_SFCPQ__AvaTaxMessage__c,
        Duration__c,
        Recalculate__c,
        SBQQ_ExpirationDateFormatted__c,
        Quote_Date__c,
        
        Recurring_Subtotal__c ,
        Recurring_Tax__c,
        Recurring_Total__c,
        One_Time_Subtotal__c,
        One_Time_Tax__c,
        One_Time_Total__c,
        FirstInvoice_GrossAmount_Disp__c,
            
        Current_Date_Formatted__c,
        Reference_Number__c,
        SBQQ__Account__r.Id,
        SBQQ__Account__r.USF_Account_Number__c,
        SBQQ__Account__r.Parent_Account_Number__c,
        SBQQ__Account__r.Name,
        SBQQ__Account__r.Owner.Id,
        SBQQ__Account__r.Owner.FirstName,
        SBQQ__Account__r.Owner.LastName,
        SBQQ__Account__r.Owner.Title,
        SBQQ__Account__r.Owner.Email,
        SBQQ__Account__r.Owner.Phone,
        SBQQ__Account__r.Owner.UserName,
      
        SBQQ__PrimaryContact__r.Id, 
        SBQQ__PrimaryContact__r.Phone, 
        SBQQ__PrimaryContact__r.Email, 
        SBQQ__PrimaryContact__r.FirstName, 
        SBQQ__PrimaryContact__r.LastName,

        PrimarySiteContact__r.Id,
        PrimarySiteContact__r.Phone,
        PrimarySiteContact__r.Email,
        PrimarySiteContact__r.FirstName,
        PrimarySiteContact__r.LastName,

        SecondaryBillToContact__r.Id,
        SecondaryBillToContact__r.Phone,
        SecondaryBillToContact__r.Email,
        SecondaryBillToContact__r.FirstName,
        SecondaryBillToContact__r.LastName,
        
        SBQQ__SalesRep__r.Id,
        SBQQ__SalesRep__r.FirstName,
        SBQQ__SalesRep__r.LastName,
        SBQQ__SalesRep__r.Email,
        SBQQ__SalesRep__r.Title,
        Legal_Entity__c,
        Shipping_Address__r.Id, 
        Shipping_Address__r.USF_Account__c, 
        Shipping_Address__r.Name,
        Shipping_Address__r.NF_Parent_USF_Address__c,
        Shipping_Address__r.USF_Street__c,
        Shipping_Address__r.USF_City__c,
        Shipping_Address__r.USF_State__c,
        Shipping_Address__r.USF_Zip_Code__c,
        Shipping_Address__r.USF_Country__c,
        Shipping_Address__r.Address_Latitude_Longitude__Latitude__s,
        Shipping_Address__r.Address_Latitude_Longitude__Longitude__s,
        Shipping_Address__r.Is_Primary__c,
        Shipping_Address__r.USF_Ship_To_Address__c,
        Shipping_Address__r.USF_Bill_To_Address__c,
        Shipping_Address__r.NF_Is_Parent__c,
        Shipping_Address__r.Address_Validated__c,
        Shipping_Address__r.GeoCode_Accuracy__c,
        Shipping_Address__r.Site_Name__c,
        Shipping_Address__r.NF_Site_Hours_Start_Time__c,
        Shipping_Address__r.NF_Site_Hours_End_Time__c,
        Shipping_Address__r.NF_Arrival_Start_Time__c,
        Shipping_Address__r.NF_Arrival_End_Time__c,
        Shipping_Address__r.NF_Gate_Code__c,
        Shipping_Address__r.NF_Access_instructions__c,
        Shipping_Address__r.NF_Key_Instructions__c,
        Shipping_Address__r.NF_Other_Instructions__c,
        Shipping_Address__r.NF_Placement__c,
        Shipping_Address__r.NF_Background_Check__c,
        Shipping_Address__r.NF_Clearance_Required__c,
        Shipping_Address__r.Additional_Information__c,
        Shipping_Address__r.NF_Site_Contact__c,
        Shipping_Address__r.NF_Secondary_Site_Contact__c,
        Shipping_Address__r.NF_Ship_To_Contact__c,

        Bill_To_Address__r.Id, 
        Bill_To_Address__r.USF_Account__c, 
        Bill_To_Address__r.Name,
        Bill_To_Address__r.NF_Parent_USF_Address__c,
        Bill_To_Address__r.USF_Street__c,
        Bill_To_Address__r.USF_City__c,
        Bill_To_Address__r.USF_State__c,
        Bill_To_Address__r.USF_Zip_Code__c,
        Bill_To_Address__r.USF_Country__c,
        Bill_To_Address__r.Address_Latitude_Longitude__Latitude__s,
        Bill_To_Address__r.Address_Latitude_Longitude__Longitude__s,
        Bill_To_Address__r.Is_Primary__c,
        Bill_To_Address__r.USF_Ship_To_Address__c,
        Bill_To_Address__r.USF_Bill_To_Address__c,
        Bill_To_Address__r.NF_Is_Parent__c,
        Bill_To_Address__r.Address_Validated__c,
        Bill_To_Address__r.GeoCode_Accuracy__c,
        Bill_To_Address__r.Site_Name__c,
        Bill_To_Address__r.NF_Site_Hours_Start_Time__c,
        Bill_To_Address__r.NF_Site_Hours_End_Time__c,
        Bill_To_Address__r.NF_Arrival_Start_Time__c,
        Bill_To_Address__r.NF_Arrival_End_Time__c,
        Bill_To_Address__r.NF_Gate_Code__c,
        Bill_To_Address__r.NF_Access_instructions__c,
        Bill_To_Address__r.NF_Key_Instructions__c,
        Bill_To_Address__r.NF_Other_Instructions__c,
        Bill_To_Address__r.NF_Placement__c,
        Bill_To_Address__r.NF_Background_Check__c,
        Bill_To_Address__r.NF_Clearance_Required__c,
        Bill_To_Address__r.Additional_Information__c,

        SBQQ__Opportunity2__r.USF_Project__c,
        SBQQ__Opportunity2__r.USF_Project__r.Id,
        SBQQ__Opportunity2__r.USF_Project__r.Name,
        SBQQ__Opportunity2__r.USF_Project__r.USF_Project_Description__c,
        SBQQ__Opportunity2__r.USF_Project__r.USF_Project_Type__c,
        SBQQ__Opportunity2__r.USF_Project__r.USF_External_Project_Type__c,
        SBQQ__Opportunity2__r.USF_Project__r.USF_USS_Project_Status__c,
        CreatedDate,
        SBQQ__ExpirationDate__c,
        Estimated_End_Date__c,
        Purchase_Order__r.Id, Purchase_Order__r.Name, Purchase_Order__r.Amount__c, Purchase_Order__r.Expiration_Date__c
        `,
      )
      .include('SBQQ__LineItems__r')
      .select(
        `Id,
        SBQQ__Quote__c,
        SBQQ__Number__c,
        Name,
        Product_Name__c,
        Sort_Order__c,
        QuantityUnitOfMeasure__c,
        SBQQ__Taxable__c,
        SBQQ__Quantity__c,
        IS2PContractedPrice__c,
        SBQQ__SpecialPriceType__c,
        SBQQ__ListPrice__c,
        Floor_Price__c,
        SBQQ__UnitCost__c,
        SBQQ__NetPrice__c,
        SBQQ__CustomerPrice__c,
        Price_Override__c,
        SBQQ__EffectiveStartDate__c,
        
        Total_Sales_Tax_Amount__c,
        Apply_Houston_Franchise_Fee__c,
        Houston_Franchise_Fees_Percent__c,
        Houston_Franchise_Fee_Per_Unit__c,
        Houston_Franchise_Fees__c,
        Apply_Fuel_Surcharge__c,
        Fuel_Surcharge_Percent__c,
        Fuel_Surcharge_Amount__c,
        Fuel_Surcharge_Per_Unit__c,
        Product_Type__c,
        SBQQ__RequiredBy__c,
        USS_Net__c,
        SBQQ__ChargeType__c,
        EEC_Charge__c,
        ESF_Charge__c,
        SBQQ__StartDate__c,
        SBQQ__EndDate__c,
        SBQQ__PricebookEntryId__c,
        SBQQ__SubscriptionTerm__c,
        SBQQ__ProductSubscriptionType__c,
        SBQQ__ProrateMultiplier__c,
        SBQQ__SubscriptionPricing__c,
        SBQQ__SubscriptionType__c,
        SBQQ__DefaultSubscriptionTerm__c,
        SBQQ__ProductCode__c,
        AVA_SFCPQ__Location_Code__c,
        USF_Address__C,
        SBQQ__TaxCode__c,
        Ship_From_Street__c,
        Ship_From_City__c,
        Ship_From_State__c,
        Ship_From_Zipcode__c,
        AVA_SFCPQ__TaxAmount__c,
        ESF_Percent__c,
        EEC_Percent__c,
                
        SBQQ__Product__c,
        SBQQ__Product__r.id,
        SBQQ__Product__r.Name,
        SBQQ__Product__r.ProductCode,
        SBQQ__Product__r.Description,
        SBQQ__Product__r.Asset_Summary__c, 
        SBQQ__Product__r.Apply_Fuel_Surcharge__c, 
        SBQQ__Product__r.ApplyEnhancedSafetyFee__c, 
        SBQQ__Product__r.Apply_EEC__c,
        SBQQ__ProductOption__r.id,
        SBQQ__ProductOption__r.SBQQ__Number__c
        `,
      )
      .end()
      .include('NF_Quoted_Jobsites__r')
      .select(
        `Id, Name, 
        NF_Quote__c, 
        NF_End_Date__c, 
        NF_Start_Date__c, 
        NF_Quote_Line__c,
        NF_Quote_Line__r.SBQQ__Product__r.id,
        NF_Quote_Line__r.SBQQ__Product__r.Name,
        NF_Quote_Line__r.SBQQ__Product__r.ProductCode,
        NF_Quote_Line__r.SBQQ__Product__r.Description,
        NF_Quote_Line__r.SBQQ__Product__r.Asset_Summary__c, 
        NF_Aggregated_Product_Name__c,
        NF_Quantity_Quoted__c, NF_USF_Address__r.Id,
        NF_USF_Address__r.USF_Account__c,
        NF_USF_Address__r.Name,
        NF_USF_Address__r.NF_Parent_USF_Address__c,
        NF_USF_Address__r.USF_Street__c,
        NF_USF_Address__r.USF_City__c,
        NF_USF_Address__r.USF_State__c,
        NF_USF_Address__r.USF_Zip_Code__c,
        NF_USF_Address__r.USF_Country__c,
        NF_USF_Address__r.Address_Latitude_Longitude__Latitude__s,
        NF_USF_Address__r.Address_Latitude_Longitude__Longitude__s,
        NF_USF_Address__r.Is_Primary__c,
        NF_USF_Address__r.USF_Ship_To_Address__c,
        NF_USF_Address__r.USF_Bill_To_Address__c,
        NF_USF_Address__r.NF_Is_Parent__c,
        NF_USF_Address__r.Address_Validated__c,
        NF_USF_Address__r.GeoCode_Accuracy__c,
        NF_USF_Address__r.Site_Name__c,
        NF_USF_Address__r.NF_Site_Hours_Start_Time__c,
        NF_USF_Address__r.NF_Site_Hours_End_Time__c,
        NF_USF_Address__r.NF_Arrival_Start_Time__c,
        NF_USF_Address__r.NF_Arrival_End_Time__c,
        NF_USF_Address__r.NF_Gate_Code__c,
        NF_USF_Address__r.NF_Access_instructions__c,
        NF_USF_Address__r.NF_Key_Instructions__c,
        NF_USF_Address__r.NF_Other_Instructions__c,
        NF_USF_Address__r.NF_Background_Check__c,
        NF_USF_Address__r.NF_Clearance_Required__c,
        NF_USF_Address__r.Additional_Information__c,
        NF_USF_Address__r.NF_Ship_To_Contact__r.Id,
			  NF_USF_Address__r.NF_Ship_To_Contact__r.FirstName, 
        NF_USF_Address__r.NF_Ship_To_Contact__r.LastName,
        NF_USF_Address__r.NF_Ship_To_Contact__r.Phone, 
        NF_USF_Address__r.NF_Ship_To_Contact__r.Email,
        NF_USF_Address__r.NF_Placement__c
        `,
      )
      .end()
      .include('SBQQ__R00N70000001lX7YEAU__r')
      .select(`Id,Name,SBQQ__DocumentId__c, SBQQ__Version__c`)
      .orderby('SBQQ__Version__c', 'DESC')
      .end()
      .where({ Id: quoteId })
      .limit(1)
      .execute();
    if (quotes?.length === 0) {
      return null;
    }

    return quotes[0];
  }

  async updateTaxesOnQuote(quote: SBQQ__Quote__c): Promise<object> {
    const quoteLines = quote.SBQQ__LineItems__r;
    const quoteWithoutLines = quote;
    delete quoteWithoutLines.SBQQ__LineItems__r;
    const quoteUpdate = await this.sfdcBaseService.updateSObject('SBQQ__Quote__c', quoteWithoutLines);
    const quoteLinesUpdate = await this.sfdcBaseService.updateSObject('SBQQ__QuoteLine__c', quoteLines);
    return { quote: quoteUpdate, quoteLines: quoteLinesUpdate };
  }

  async createOpportunity(opportunity: Opportunity): Promise<SfdcRespModel> {
    const opporunity = await this.sfdcBaseService.conn.create('Opportunity', opportunity, function (err, ret) {
      if (err || !ret.success) {
        return err;
      }
      return ret.id;
    });
    this.logger.info('opporunityId');
    this.logger.info(opporunity);
    const opportunityRespModel = new SfdcRespModel();
    Object.assign(opportunityRespModel, opporunity);

    return opportunityRespModel;
  }

  async updateAddressDetails(addressId: string, street: string): Promise<SfdcRespModel> {
    const addAddressDetailsResult =  await this.sfdcBaseService.updateSObject('USF_Address__c', {
      Id: addressId,
      USF_Ship_To_Address__c: true,
      Site_Name__c: street,
    });
    const addAddressDetailsRespModel = new SFDC_Response();
      Object.assign(addAddressDetailsRespModel, addAddressDetailsResult);
      return addAddressDetailsRespModel;
  }

  async createQuote(quoteReqModel: SBQQ__Quote__c): Promise<SBQQ__Quote__c> {
    try {
      const quoteId = (await this.createInitialQuote(quoteReqModel)) + '';
      const fetchQuote = await this.getQuoteDetails(quoteId);

      return fetchQuote;
    } catch (error) {
      this.logger.error('error in createQuote: ' + error);
      return error;
    }
  }

  // QuoteId
  async createInitialQuote(quoteReqModel: SBQQ__Quote__c): Promise<SfdcRespModel> {
    if(quoteReqModel.Id == undefined || quoteReqModel.Id == ""){
      const createQuoteResult = await this.sfdcBaseService.conn.create('SBQQ__Quote__c', quoteReqModel);
      return createQuoteResult.id;
    }else{
      
      const createQuoteResult = await this.sfdcBaseService.conn.update('SBQQ__Quote__c', quoteReqModel);
      return createQuoteResult.id;
    }
  }

  async updateQuoteStatus(quoteStatusReq: UpdateQuoteStatusReqDTO): Promise<SfdcRespModel> {
    const updateQuoteStatusResult = await this.sfdcBaseService.updateSObject('SBQQ__Quote__c', {
      Id: quoteStatusReq.quoteId,
      SBQQ__Status__c: quoteStatusReq.status,
      Billing_Complete__c: false,
      MyUSS_Reject_Reason__c: quoteStatusReq.rejectReason ?? "",
      MyUSS_Reject_Reason_Feedback__c: quoteStatusReq.rejectReasonFeedback ?? "",

    });
    this.logger.info('updateQuoteStatus');
    this.logger.info(updateQuoteStatusResult);
    const updateQuoteStatusRespModel = new SfdcRespModel();
    Object.assign(updateQuoteStatusRespModel, updateQuoteStatusResult);
    return updateQuoteStatusRespModel;
  }

  async addProductInQuote(addProductsRequest: AddProductAndCalculateReqDTO): Promise<SfdcRespModel> {
    const addProductInQuoteResult = await this.sfdcBaseService.updateSObject('SBQQ__Quote__c', {
      Id: addProductsRequest.quoteId,
      SBQQ__StartDate__c: addProductsRequest.startDate,
      SBQQ__EndDate__c: addProductsRequest.endDate,
      Duration__c: addProductsRequest.duration,
      Order_Type__c: addProductsRequest.orderType,
    });
    this.logger.info('addProductInQuote');
    this.logger.info(addProductInQuoteResult);
    const addProductInQuoteRespModel = new SfdcRespModel();
    Object.assign(addProductInQuoteRespModel, addProductInQuoteResult);
    return addProductInQuoteRespModel;
  }

  async getQuoteFromCPQ(quoteId: string): Promise<CPQ_QuoteModel> {
    const resp = await this.sfdcBaseService.conn.apex.get(
      '/SBQQ/ServiceRouter?reader=SBQQ.QuoteAPI.QuoteReader&uid=' + quoteId,
    );
    const calculatedQuote = Object.create(CPQ_QuoteModel.prototype);
    const myObjectWithDelegate = Object.assign(calculatedQuote, JSON.parse(resp));
    return calculatedQuote;
  }

  public async calculateQuote(quoteModel: CPQ_QuoteModel): Promise<CPQ_QuoteModel> {
    const resp = await this.sfdcBaseService.conn.apex.patch(
      '/SBQQ/ServiceRouter?loader=SBQQ.QuoteAPI.QuoteCalculator',
      {
        context: JSON.stringify({
          quote: quoteModel,
        }),
      },
    );
    const calculatedQuote = new CPQ_QuoteModel();
    Object.assign(calculatedQuote, JSON.parse(resp));
    return calculatedQuote;
  }

  public async requestPostQuoteLine(compositeQuoteLineEndpoint, compositeQuoteLineRequest) {
    await this.sfdcBaseService.conn.requestPost(compositeQuoteLineEndpoint, compositeQuoteLineRequest);
  }

  async getAccountName(quoteId: string): Promise<string> {
    const quote = await this.sfdcBaseService.conn.query(
      `SELECT Account_Name__c FROM SBQQ__Quote__c WHERE Id = '${quoteId}'`,
    );
    const accountName = quote.records[0].Account_Name__c;
    return accountName;
  }

  async createQuoteDocumentJob(accountName: string, quoteId: string): Promise<string> {
    const today = new Date();
    const day = today.getDate().toString().padStart(2, '0');
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const year = today.getFullYear().toString();
    const formattedDate = `${month}.${day}.${year}`;
    // TODO: make this more efficient, this seems like a waste of an API call
    const templateId = await this.getTemplateIdForQuoteById(quoteId);
    const quoteProposal = {
      name: `${accountName} Quote ${formattedDate}`,
      quoteId: quoteId,
      templateId: templateId,
      outputFormat: 'PDF',
      language: 'en_US',
      paperSize: 'Default',
    };
    const proposalObj = {
      saver: 'SBQQ.QuoteDocumentAPI.Save',
      model: JSON.stringify(quoteProposal),
    };
    const proposalString = JSON.stringify(proposalObj);
    this.logger.info(`proposalString: ${proposalString}`);
    const proposal = await this.sfdcBaseService.conn.apex.post<string>(
      '/SBQQ/ServiceRouter?saver=QuoteDocumentAPI.SaveProposal',
      proposalObj,
    );
    const proposalJobId = proposal.replace(/"/g, '');
    return proposalJobId;
  }

  async getProposalStatus(proposal: string): Promise<string> {
    let proposalStatusResults = await this.sfdcBaseService.conn.query(
      `SELECT Status FROM AsyncApexJob WHERE Id = '${proposal}'`,
    );
    const proposalStatus = proposalStatusResults.records[0].Status;
    return proposalStatus;
  }

  async updateStatus(quoteId: string): Promise<SfdcRespModel> {
    const updateStatusResult = await this.sfdcBaseService.updateSObject('SBQQ__Quote__c', {
      Id: quoteId,
      SBQQ__Status__c: 'Presented',
    });

    const updateStatusResultModel = new SfdcRespModel();
    Object.assign(updateStatusResultModel, updateStatusResult);
    return updateStatusResultModel;
  }

  async deleteQuoteLines(quoteId: string): Promise<object> {
    const deleteQuoteLinesResult = await this.sfdcBaseService.deleteQuoteLines('SBQQ__QuoteLine__c', quoteId);
    return deleteQuoteLinesResult;
  }

  async getQuoteLineIds(quoteId: string): Promise<string[]> {
    const quoteLineIds = await this.sfdcBaseService.conn
      .sobject('SBQQ__QuoteLine__c')
      .select(`Id`)
      .where({
        SBQQ__Quote__c: quoteId,
      })
      .execute();
    const quoteLineIdsArray = quoteLineIds.map((quoteLineId) => quoteLineId.Id);
    return quoteLineIdsArray;
  }

  async deleteQuoteLinesByIds(quoteLineIds: string[]): Promise<object> {
    const deleteQuoteLinesResult = await this.sfdcBaseService.conn.sobject('SBQQ__QuoteLine__c').delete(quoteLineIds);
    return deleteQuoteLinesResult;
  }

  async saveQuotedJobsites(body: { quoteId: string; quotedJobsites: NF_Quoted_Jobsite__c[] }) {
    const endpoint = 'my-uss-save-quoted-jobsites';
    return await this.sfdcBaseService.postApex(endpoint, body);
  }
  async createQuotedJobsiteList(siteDetailsReq: SiteDetailsReqDTO): Promise<NF_Quoted_Jobsite__c[]> {
    let quotedJobsiteList: NF_Quoted_Jobsite__c[] = [];
    let myUSSSites = [];
    for (const subSite of siteDetailsReq.subSites) {
      subSite.bundles.forEach((bundle) => {
        let myUSSSite: SubSite = {
          name: subSite.siteName,
          quoteId: siteDetailsReq.quoteId,
          endDate: siteDetailsReq.endDate,
          startDate: siteDetailsReq.startDate,
          quoteLineId: bundle.quoteLineId,
          addressId: subSite.addressId,
          productName: bundle.bundleName,
          assetId: bundle.assetId,
          serviceId: bundle.serviceId,
          preOrderFlowComplete: false,
          quantity: bundle.quantity,
          siteName: subSite.siteName,
        };
        this.logger.info('myUSSSite: ', JSON.stringify(myUSSSite));
        myUSSSites.push(myUSSSite);
      });
    }

    quotedJobsiteList = SFDC_QuotedJobSitesMapper.getSFDCQuotedJobSitesFromMyUSSQuotedJobSites(myUSSSites);
    return quotedJobsiteList;
  }
  async updateQuoteStatusSiteComplete(siteDetailsReq: SiteDetailsReqDTO): Promise<SfdcRespModel> {
    try {
      const quoteDetails = await this.sfdcBaseService.conn
        .sobject('SBQQ__Quote__c')
        .select('SBQQ__Opportunity2__c')
        .where({
          Id: siteDetailsReq.quoteId,
        });

      let opportunityUpdateResult = {};
      if (quoteDetails[0]) {
        opportunityUpdateResult = await this.sfdcBaseService.updateSObject('opportunity', {
          Id: quoteDetails[0].SBQQ__Opportunity2__c,
          USF_Won_Reason__c: USF_WON_REASON,
        });
      }
      let createContactResult = await this.sfdcBaseService.updateSObject('SBQQ__Quote__c', {
        Id: siteDetailsReq.quoteId,
        Site_Complete__c: true,
      });
      Promise.all([opportunityUpdateResult, createContactResult]);

      const quoteStatusUpdateResp = new SfdcRespModel();
      quoteStatusUpdateResp.success = true;
      quoteStatusUpdateResp.message = 'success';

      return quoteStatusUpdateResp;
    } catch (err) {
      const updateSiteAddressRespModel = new SfdcRespModel();
      updateSiteAddressRespModel.success = false;
      updateSiteAddressRespModel.message = err.message;
      return updateSiteAddressRespModel;
    }
  }
  addSubSiteAddressDetails(addressDetailsModel: Address,siteDetailsReq:SiteDetailsReqDTO) : USF_Address__c {
    const startTime = addressDetailsModel.startTime?.length < 12  ? 
           null : addressDetailsModel.startTime;
    const endTime =addressDetailsModel.endTime?.length < 12 ?
          null : addressDetailsModel.endTime;
    const addressModel = new Address();
    addressModel.accountId = addressDetailsModel.accountId;
    addressModel.name = addressDetailsModel.siteName;
    addressModel.siteName = addressDetailsModel.siteName;
    addressModel.street = addressDetailsModel.street;
    addressModel.city = addressDetailsModel.city;
    addressModel.state = addressDetailsModel.state;
    addressModel.zipcode = addressDetailsModel.zipcode;
    addressModel.country = addressDetailsModel.country;
    addressModel.addressValidated = true;
    addressModel.instructions = addressDetailsModel.instructions;
    addressModel.isShippingAddress = true;
    addressModel.isParentAddress = false;
    addressModel.parentRefId = siteDetailsReq.addressId;
    addressModel.shipToContactRefId = addressDetailsModel.shipToContactRefId;
    addressModel.siteContactRefId = addressDetailsModel.siteContactRefId;
    addressModel.startTime = startTime;
    addressModel.endTime = endTime;

    return SFDC_AddressMapper.getSFDCAddressFromMyUSSAddress(addressModel);
  }
  //check quoteId is present in account or not
  async checkQuoteIdInAccount(accountId: string, quoteId: string): Promise<boolean> {
    const quote = await this.sfdcBaseService.conn
      .sobject('SBQQ__Quote__c')
      .select('Id')
      .where({ Id: quoteId, SBQQ__Account__c: accountId })
      .limit(1)
      .execute();
      if (quote?.length === 0) {
        return false;
      }
      return true;
  }

  async fetchProjectQuotes(accountId:string,projectId:string,status:string): Promise<SBQQ__Quote__c>{
    
    let whereCondition ="";
    if(status === 'Archived'){
      whereCondition = 'SBQQ__Account__c = \''+accountId+'\' AND SBQQ__Status__c = \''+status+'\' AND SBQQ__Opportunity2__r.USF_Project__r.Id = \''+projectId+'\''
    }else{
      whereCondition = 'SBQQ__Account__c = \''+accountId+'\' AND SBQQ__Status__c != \'Archived\' AND SBQQ__Opportunity2__r.USF_Project__r.Id = \''+projectId+'\''
    }
    const projectQuotes = await this.sfdcBaseService.conn
    .sobject('SBQQ__Quote__c')
    .select(`Id, LastModifiedDate,SBQQ__StartDate__c,SBQQ__EndDate__c, Name,SBQQ__Status__c,Shipping_Address__r.Address_Latitude_Longitude__Latitude__s,Shipping_Address__r.Name,Serviceable_Zip_Code__r.Zip_Code__c,Site_Complete__c,Billing_Complete__c,Payment_Method_Id__c,isCheckPaymentMethod__c,SBQQ__Ordered__c, CreatedBy.Name,Bill_To_Address__r.Address_Latitude_Longitude__Latitude__s,Bill_To_Address__r.Address_Latitude_Longitude__Longitude__s,Payment_Mode__c,SBQQ__Opportunity2__c`)
    .where(whereCondition)
    .execute({ autoFetch: true, maxFetch: 100000 });

    return projectQuotes;
  }

}

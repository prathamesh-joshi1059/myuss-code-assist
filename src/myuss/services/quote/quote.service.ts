import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SfdcQuoteService } from '../../../backend/sfdc/services/sfdc-quote/sfdc-quote.service';
import { SfdcDocumentService } from '../../../backend/sfdc/services/sfdc-document/sfdc-document.service';
import { Bundle, BundleDetails, BundleProduct, ProductDetails, UserDetails } from '../../models';
import { QuoteLinesModel, QuoteModel, SfdcRespModel } from '../../models/quote.model';
import { UserService } from '../user/user.service';
import {
  FUEL_SURCHARGE_PERCENT__C,
  QUOTELINESERVICE_QUANTITYUNITOFMEASURE__C,
  SBQQ__SUBSCRIPTIONPRICING__C,
  TIMEMS_CACHE_REQUEST_FOR_QUOTE,
  DEFAULT_END_DATE,
  OPPORTUNITY_AMOUNT,
  OPPORTUNITY_LEAD_SOURCE,
  OPPORTUNITY_STAGE,
  QUOTE_BILLING_APPROVAL_STATUS,
  QUOTE_BILLING_SYSTEM,
  QUOTE_INVOICE_DELIVERY_METHOD,
  QUOTE_PAYMENT_MODE,
  USS_Product_Categories,
} from '../../../core/utils/constants';
import { Product2 } from '../../../backend/sfdc/model/Product2';
import { LoggerService } from '../../../core/logger/logger.service';
import { ProductsService } from '../products/products.service';
import { SBQQ__Quote__c } from '../../../backend/sfdc/model/SBQQ__Quote__c';
import { SBQQ__QuoteLine__c } from '../../../backend/sfdc/model/SBQQ__QuoteLine__c';
import { DateUtils } from '../../../core/utils/date-utils';
import { AvalaraSalesforceMapper } from '../../mappers/avalara/quote-to-tax-document.mapper';
import { AvalaraCalculateTaxService } from '../../../backend/avalara/services/calculate-tax/calculate-tax.service';
import { CreateInitialQuoteReqDTO } from '../../controllers/quote/dto/create-initial-quote-req.dto';
import { AddProductAndCalculateReqDTO } from '../../controllers/quote/dto/add-product-calculate-req.dto';
import { GetQuoteDetailsRespDTO } from '../../controllers/quote/dto/get-quote-details-resp.dto';
import { UpdateQuoteStatusReqDTO } from '../../controllers/quote/dto/update-quote-status-req-dto';
import { SiteDetailsReqDTO } from '../../controllers/quote/dto/save-site-details-req-dto';
import { ApiRespDTO } from '../../../common/dto/api-resp.dto';
import { ConfirmQuoteReqDTO } from '../../controllers/quote/dto/confirm-quote-req-dto';
import { BillingDetailsReqDTO } from '../../controllers/quote/dto/save-billing-details-req-dto';
import { Address, BillingAddress, SiteDetails } from '../../models/address.model';
import { SfdcServiceableZipCodeService } from '../../../backend/sfdc/services/sfdc-serviceable-zip-code/sfdc-serviceable-zip-code.service';
import { CPQ_QuoteLineModel, CPQ_QuoteModel } from '../../../backend/sfdc/model/cpq/QuoteModel';
import { SfdcCpqService } from '../../../backend/sfdc/services/cpq/sfdc-cpq.service';
import { NF_Quoted_Jobsite__c } from '../../../backend/sfdc/model/NF_Quoted_Jobsite__c';
import { FirestoreService } from '../../../backend/google/firestore/firestore.service';
import { CacheService } from '../../../core/cache/cache.service';

import { Opportunity } from '../../../backend/sfdc/model/Opportunity';
import { USF_Address__c } from '../../../backend/sfdc/model/USF_Address__c';
import {
  ACCEPTED_QUOTE,
  APPROVED_QUOTE,
  COMPLETED_BILLING_DETAILS,
  CONFIRMED_ORDER,
  CREATED_AND_SAVE_DOCUMENT,
  CREATE_QUOTE,
  DOWNLOADED_QUOTE_DOCUMENT,
  ENTERED_SITE_DETAILS,
  REJECTED_QUOTE,
  REQUESTED_QUOTE_PRICING,
  STEP0_SCREEN,
  STEP1_SCREEN,
  STEP2_SCREEN,
  STEP3_SCREEN,
  STEP4_SCREEN,
  STEP5_SCREEN,
  UPDATED_CART,
} from '../../../core/utils/user-event-messages';
import { TrackUserActionService } from '../../../core/track-user-action/track-user-action-service';
import { SfdcAddressService } from '../../../backend/sfdc/services/sfdc-address/sfdc-address.service';
import { SFDC_QuoteMapper } from '../../../myuss/mappers/salesforce/quote.mapper';
import { Contact } from '../../models/contact.model';
import { SFDC_AddressMapper } from '../../../myuss/mappers/salesforce/address.mapper';
import { SfdcProjectService } from '../../../backend/sfdc/services/sfdc-project/sfdc-project.service';
import { AccountsService } from '../accounts/accounts.service';
import { AccountsServiceV2 } from '../../../myuss/v2/services/accounts/accounts.service';
@Injectable()
export class QuoteService {
  private useStandalonePricing: boolean = false;
  private quoteHtml: boolean = false;

  constructor(
    private salesforceDocumentService: SfdcDocumentService,
    private productsService: ProductsService,
    private sfdcQuoteService: SfdcQuoteService,
    private sfdcAddressService: SfdcAddressService,
    private logger: LoggerService,
    private userService: UserService,
    private avalaraService: AvalaraCalculateTaxService,
    private sfdcServiceableZipCodeService: SfdcServiceableZipCodeService,
    private sfdcCPQService: SfdcCpqService,
    private configService: ConfigService,
    private firestoreService: FirestoreService,
    private cacheService: CacheService,
    private trackUserActionService: TrackUserActionService,
    private sfdcProjectService: SfdcProjectService,
    private accountsService: AccountsService,
    private accountsServiceV2:AccountsServiceV2
  ) {
    this.useStandalonePricing = this.configService.get('USE_STANDALONE_PRICING_ENGINE') === 'true';
  }

  public async createInitialQuote(
    createQuoteRequest: CreateInitialQuoteReqDTO,
    accountId: string,
    auth0Id: string,
  ): Promise<ApiRespDTO<object>> {
    let quoteResult = new ApiRespDTO<object>();
    let cacheDataJSON = {
      ...createQuoteRequest,
      response: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    try {
      this.trackUserActionService.setPortalActions(
        accountId,
        auth0Id,
        STEP0_SCREEN,
        CREATE_QUOTE,
        '',
        '',
      );
      let cacheData = await this.cacheService.get<string>(createQuoteRequest.requestId);
      if (cacheData) {
        //existing request
        let requestData = JSON.parse(JSON.stringify(cacheData));
        let checkResponse = requestData.response;
        if (checkResponse) {
          //response completed
          return checkResponse;
        } else {
          //response in progress
          quoteResult = {
            success: false,
            status: 1018,
            message: 'Please wait, saving your site address.',
            data: {},
          };
          return quoteResult;
        }
      } else {
        //new request
        await this.cacheService.set(createQuoteRequest.requestId, cacheDataJSON, TIMEMS_CACHE_REQUEST_FOR_QUOTE);
      }
      //this.logger.info(`starting at: ${new Date()}`);
      let poId = '';
      let addressId: string;

      

      this.logger.info(`starting at: ${new Date()}`);
     //     // Concurrently fetch standard pricebook and check serviceable zipcode
      const [standardPricebook, serviceableZipResult] = await Promise.all([
        this.productsService.getStandardPricebook(),
        this.sfdcServiceableZipCodeService.checkServiceableZipcode(createQuoteRequest.zipcode),
      ]);
  
      if (!serviceableZipResult) {
        quoteResult = {
          success: false,
          status: 1007,
          message:
            'This ZIP code is not currently eligible for web orders. Please call 1-800-TOILETS to speak with a representative.',
          data: {},
        };
        cacheDataJSON.response = quoteResult;
        cacheDataJSON.updatedAt = new Date().toISOString();
        await this.cacheService.set(createQuoteRequest.requestId, cacheDataJSON, TIMEMS_CACHE_REQUEST_FOR_QUOTE);
        return quoteResult;
      }
  
      let pricebookId = standardPricebook.Id;
      let serviceableZipCode = serviceableZipResult.Id;
      let quoteName = `MyUSS Quote ${new Date().toISOString()}`;

      let opportunity = this.createOpportunityData(createQuoteRequest);
      //create Opportunity
      const opportunityPromise =  this.sfdcQuoteService.createOpportunity(opportunity);
      let addAddressPromise;
      if (createQuoteRequest.addressExist) {
        addressId = createQuoteRequest.addressId;
        const addressDetails: Address = await this.sfdcQuoteService.getAddressDetailsById(createQuoteRequest.addressId);
        let updateFlag = false;
        if (!addressDetails.isShippingAddress) {
          updateFlag = true;
        }
        if (!addressDetails.siteName) {
          updateFlag = true;
        }
        if (updateFlag) {
           addAddressPromise = this.sfdcQuoteService.updateAddressDetails(
            createQuoteRequest.addressId,
            addressDetails.street,
          );
        }
      } else {
        //create address
        const addAddressDetailsModel = this.addressDetailsData(createQuoteRequest);
        addAddressPromise  =  this.sfdcAddressService.createAddress(addAddressDetailsModel);
      }

      const [opportunityResult, addressResult] = await Promise.all([
            opportunityPromise,
            addAddressPromise  
             ]);


      // set quote fields
      const quoteRequestModel = this.quoteRequestData(
        opportunityResult,
        poId,
        addressResult? addressResult.id : addressId,
        createQuoteRequest,
        pricebookId,
        serviceableZipCode,
        quoteName,
      );

      // create quote
      const createQuoteRespPromise =  this.sfdcQuoteService.createQuote(quoteRequestModel);
      const [createQuoteResp] = await Promise.all([createQuoteRespPromise]);

      const resp = {
        quoteId: createQuoteResp.Id,
        quoteName: createQuoteResp.Name,
        addressId:  addressResult? addressResult.id : addressId,
      };
      this.logger.info(`ending at: ${new Date()}`);
      let quoteArray = [];
      quoteArray.push(createQuoteResp.Id);
      if (resp.quoteId) {
        this.logger.info(`quote created at ${new Date()}: ${resp}`);
        quoteResult = { success: true, status: 1000, data: resp };
        //update to firestore
        this.saveAccoutwiseIdsToFirestore({
          accountId: createQuoteRequest.accountId,
          quotes: quoteArray,
          auth0Id: auth0Id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } else {
        quoteResult = {
          success: false,
          status: 1019,
          message: 'Error in initial quote creation ',
          data: {},
        };
      }
      cacheDataJSON.response = quoteResult;
      cacheDataJSON.updatedAt = new Date().toISOString();
      await this.cacheService.set(createQuoteRequest.requestId, cacheDataJSON, TIMEMS_CACHE_REQUEST_FOR_QUOTE);
      return quoteResult;
    } catch (error) {
      this.logger.error(error);
      quoteResult = {
        success: false,
        status: 1006,
        message: error.message,
        data: {},
      };
      cacheDataJSON.response = quoteResult;
      cacheDataJSON.updatedAt = new Date().toISOString();
      await this.cacheService.set(createQuoteRequest.requestId, cacheDataJSON);
      return quoteResult;
    }
  }
  private quoteRequestData(
    opportunityResult: SfdcRespModel,
    poId: string,
    addressId: string,
    createQuoteRequest: CreateInitialQuoteReqDTO,
    pricebookId: string,
    serviceableZipCode: string,
    quoteName: string,
  ): SBQQ__Quote__c {
    const quoteRequestModel = new SBQQ__Quote__c();
    // Name: quoteName,
    quoteRequestModel.SBQQ__Opportunity2__c = opportunityResult.id;
    quoteRequestModel.Purchase_Order__c = poId;
    quoteRequestModel.Shipping_Address__c = addressId; //* */
    quoteRequestModel.SBQQ__Account__c = createQuoteRequest.accountId;
    quoteRequestModel.SBQQ__StartDate__c = DateUtils.getDateStringForDaysFromToday(2);
    quoteRequestModel.SBQQ__EndDate__c = DEFAULT_END_DATE;
    quoteRequestModel.SBQQ__PriceBook__c = pricebookId;
    quoteRequestModel.SBQQ__PricebookId__c = pricebookId;
    quoteRequestModel.SBQQ__Primary__c = true;
    quoteRequestModel.SBQQ__PrimaryContact__c = createQuoteRequest.contactId;
    quoteRequestModel.Bill_Timing__c = createQuoteRequest.billTiming;
    quoteRequestModel.Billing_Period__c = createQuoteRequest.billingPeriod;
    quoteRequestModel.Customer_Type__c = createQuoteRequest.customerType;
    quoteRequestModel.Business_Type__c = createQuoteRequest.businessType;
    quoteRequestModel.Decline_Damage_Waiver__c = true;
    quoteRequestModel.Serviceable_Zip_Code__c = serviceableZipCode;
    quoteRequestModel.Order_Type__c = createQuoteRequest.orderType;
    quoteRequestModel.Quote_Name__c = quoteName;
    quoteRequestModel.AutoPay__c = true;
    quoteRequestModel.Can_be_Ordered_in_Salesforce__c = true;
    quoteRequestModel.Billing_Complete__c = false;
    quoteRequestModel.InvoiceDeliveryMethod__c = QUOTE_INVOICE_DELIVERY_METHOD;
    quoteRequestModel.Payment_Method_Id__c = null;
    quoteRequestModel.Payment_Mode__c = QUOTE_PAYMENT_MODE;
    quoteRequestModel.PreOrder_Flow_Complete__c = false;
    quoteRequestModel.Site_Complete__c = false;
    quoteRequestModel.Billing_Approval_Status__c = QUOTE_BILLING_APPROVAL_STATUS;
    quoteRequestModel.isCheckPaymentMethod__c = false;
    quoteRequestModel.Facility_Name__c = null;
    quoteRequestModel.Subdivision_Name__c = null;
    quoteRequestModel.Fuel_Surcharge_Percent__c = FUEL_SURCHARGE_PERCENT__C;
    quoteRequestModel.Quoted_Jobsites__c = false;
   // quoteRequestModel.Billing_System__c = QUOTE_BILLING_SYSTEM;
    return quoteRequestModel;
  }
  private addressDetailsData(createQuoteRequest: CreateInitialQuoteReqDTO) {
    const addAddressDetailsModel = new USF_Address__c();
    addAddressDetailsModel.USF_Account__c = createQuoteRequest.address.accountId;
    addAddressDetailsModel.USF_City__c = createQuoteRequest.address.city;
    addAddressDetailsModel.USF_Country__c = createQuoteRequest.address.country;
    addAddressDetailsModel.USF_Ship_To_Address__c = true;
    addAddressDetailsModel.USF_State__c = createQuoteRequest.address.state;
    addAddressDetailsModel.USF_Street__c = createQuoteRequest.address.street;
    addAddressDetailsModel.USF_Zip_Code__c = createQuoteRequest.address.zipcode;
    addAddressDetailsModel.Site_Name__c = createQuoteRequest.address.street;
    addAddressDetailsModel.Address_Latitude_Longitude__Latitude__s = createQuoteRequest.address.latitude;
    addAddressDetailsModel.Address_Latitude_Longitude__Longitude__s = createQuoteRequest.address.longitude;
    return addAddressDetailsModel;
  }

  private createOpportunityData(createQuoteRequest: CreateInitialQuoteReqDTO) {
    let opportunity = new Opportunity();
    opportunity.AccountId = createQuoteRequest.accountId;
    opportunity.Name = `Opportunity_${new Date().toISOString()}`;
    opportunity.Opportunity_Name_Extension__c = '';
    opportunity.StageName = OPPORTUNITY_STAGE;
    opportunity.Amount = OPPORTUNITY_AMOUNT;
    opportunity.CloseDate = new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    opportunity.LeadSource = OPPORTUNITY_LEAD_SOURCE;
    opportunity.USF_Bill_To_Account__c = createQuoteRequest.accountId;
    opportunity.USF_Start_Date__c = new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    opportunity.USF_End_Date__c = DEFAULT_END_DATE;
    opportunity.USF_Order_Type__c = createQuoteRequest.orderType;
    opportunity.USF_Primary_Contact__c = createQuoteRequest.contactId;
    opportunity.USF_Won_Reason__c = null;
    opportunity.USS_Product_Categories__c = USS_Product_Categories;
    opportunity.USF_Project__c = createQuoteRequest.projectId;
    return opportunity;
  }

  public async addProductAndSave(
    addProductRequest: AddProductAndCalculateReqDTO,
    auth0Id,
    accountId
  ): Promise<ApiRespDTO<any>> {
    let addProductAndSaveResp = new ApiRespDTO<any>();
    try {
      this.logger.info(`starting addProductAndSave at: ${new Date()}`);

      this.trackUserActionService.setPortalActions(
        addProductRequest.accountId,
        auth0Id,
        STEP1_SCREEN,
        UPDATED_CART,
        addProductRequest.quoteId,
        '',
      );

      // added all products in main obj
      addProductRequest.productDetails.map((product) => {
        if (product.additionalProduct && product.additionalProduct.length > 0) {
          let count = 1;
          product.additionalProduct.map((additionalProduct) => {
            product[`productIdAS_${count}`] = additionalProduct.productIdAS;
            product[`productOptionSkuAS_${count}`] = additionalProduct.productOptionSkuAS;
            product[`aSSummery_${count}`] = additionalProduct.aSSummery;
            count++;
          });
        }
      });
      // get the product list with options and PBEs
      const productList = await this.productsService.getProducts();
      const bundles: Bundle[] = addProductRequest.productDetails.map((productDetail) => {
        return this.getBundleFromProductDetails(productDetail, productList);
      });

      const q = new SBQQ__Quote__c();
      q.Id = addProductRequest.quoteId;
      q.SBQQ__StartDate__c = addProductRequest.startDate;
      q.SBQQ__EndDate__c = addProductRequest.endDate;
      q.Duration__c = addProductRequest.duration;
      q.Order_Type__c = addProductRequest.orderType;
      q.Shipping_Address__c = addProductRequest.addressId;
      if(addProductRequest.orderType != "Recurring Service"){
        q.Estimated_End_Date__c = addProductRequest.estimatedEndDate;
      }

      // Adam - pulled this into a single update
      // const addProductInQuote = await this.sfdcQuoteService.addProductInQuote(addProductRequest);
      let cartLevelQuoteLines = this.createCartLevelQuoteLines(addProductRequest, productList);
      const shortTermQuoteLine = this.createShortTermQuoteLineIfNeeded(q, productList);
      if (shortTermQuoteLine) {
        cartLevelQuoteLines.push(shortTermQuoteLine);
      }
      // Using custom apex rest service to save without calculating
      const quoteModel = this.createQuoteModelFromBundles(addProductRequest, bundles, cartLevelQuoteLines);
      quoteModel.record.Id = addProductRequest.quoteId;
      quoteModel.record.SBQQ__StartDate__c = addProductRequest.startDate;
      quoteModel.record.SBQQ__EndDate__c = addProductRequest.endDate;
      quoteModel.record.Duration__c = addProductRequest.duration;
      quoteModel.record.Order_Type__c = addProductRequest.orderType;
      quoteModel.record.SBQQ__Status__c = 'Draft';
      if(addProductRequest.orderType != "Recurring Service"){
        quoteModel.record.Estimated_End_Date__c = addProductRequest.estimatedEndDate;
      }else{
        quoteModel.record.Estimated_End_Date__c = null;
      }

      let saveQuoteResult = new CPQ_QuoteModel();
      const saveQuotePromise = this.sfdcCPQService.saveQuoteAndDeleteExistingLines(quoteModel).then((result) => {
        saveQuoteResult = result;

      });
      this.logger.info(`starting saveQuote and delete at ${new Date()}: ${addProductRequest.quoteId}`);
      await Promise.all([saveQuotePromise]);
      this.logger.info(`finished saveQuote and delete at ${new Date()}: ${addProductRequest.quoteId}`);

      return {
        success: true,
        status: 1000,
        data: { quoteId: addProductRequest.quoteId },
      };
    } catch (error) {
      this.logger.error(error);
      addProductAndSaveResp = {
        success: false,
        status: 1009,
        message: error.message,
        data: {},
      };
      return addProductAndSaveResp;
    }
  }

  public async calculateAndSavePriceAndTax(
    quoteId: string,
    accountId: string,
    auth0Id : string,
    quoteHtml: string = 'false',
  ): Promise<ApiRespDTO<any>> {
    // configure for standalone pricing calculations otherwise use CPQ engine
    this.trackUserActionService.setPortalActions(
      accountId,
      auth0Id,
      STEP1_SCREEN,
      REQUESTED_QUOTE_PRICING,
      quoteId,
      '',
    );

    this.quoteHtml = quoteHtml === 'true' ? true : false;
    if (this.useStandalonePricing) {
      return this.calculateAndSavePriceAndTaxStandalone(quoteId);
    } else {
      return this.calculateAndSavePriceAndTaxCPQ(quoteId);
    }
  }

  public async calculateAndSavePriceAndTaxCPQ(quoteId: string): Promise<ApiRespDTO<any>> {
    let quoteModel: QuoteModel = new QuoteModel();
    try {
      // calculate quote
      this.logger.info(`starting getQuoteFromCPQ at ${new Date()}: ${quoteId}`);
      const quote = await this.sfdcQuoteService.getQuoteFromCPQ(quoteId);
      // set server side processing to true
      if (!quote.record.Enable_Server_Side_Pricing_Calculation__c) {
        quote.record.Enable_Server_Side_Pricing_Calculation__c = true;
        await this.sfdcQuoteService.enableServerSidePricingCalculation(quoteId);
      }
      this.logger.info(`finished getQuoteFromCPQ at ${new Date()}: ${quoteId}`);
      this.logger.info(`starting calculateQuote at ${new Date()}: ${quoteId}`);
      const calculatedQuote = await this.sfdcQuoteService.calculateQuote(quote);
      this.logger.info(`finished calculateQuote at ${new Date()}: ${quoteId}`);
      // calculate taxes from the quote model
      this.logger.info(`starting calculateTax at ${new Date()}: ${quoteId}`);
      const calculatedQuoteWithTax = await this.calculateTaxForQuoteModel(calculatedQuote);
      this.logger.info(`finished calculateTax at ${new Date()}: ${quoteId}`);

      //quote_html ==true then generate html model and update status to Presented
      if (this.quoteHtml == true) {
        // calculate formula fields and rollups - in that order
        calculatedQuoteWithTax.setFormulaFieldValues();

        calculatedQuoteWithTax.setQuoteRollupFields();

        //Get Quotemodel for HTML
        this.logger.info(`starting Quote HTML Model at ${new Date()}: ${quoteId}`);
        quoteModel = await this.getQuoteHtmlModel(quoteId, calculatedQuoteWithTax);
        this.logger.info(`finished Quote HTML Model at ${new Date()}: ${quoteId}`);

        this.logger.info(`Quote HTML Model :  ${JSON.stringify(quoteModel)}`);

        calculatedQuoteWithTax.record.SBQQ__Status__c = 'Presented';
        quoteModel.status = 'Presented';

        this.logger.info(`finished updating quote status to Presented  ${new Date()}: ${quoteId}`);
      } else {
        quoteModel.quoteId = calculatedQuoteWithTax.record.Id;
      }

      // save quote
      this.logger.info(`starting quote save at ${new Date()}: ${quoteId}`);
      const saveQuoteWithTax = await this.sfdcCPQService.saveQuoteCPQ(calculatedQuoteWithTax);
      this.logger.info(`finished quote save at ${new Date()}: ${quoteId}`);
      // response based on success or failure
      if (saveQuoteWithTax) {
        return { success: true, status: 1000, data: { quoteModel: quoteModel } };
      } else {
        return { success: false, status: 1025, message: 'Error in saving CPQ tax', data: {} };
      }
    } catch (error) {
      this.logger.error(error);
      return { success: false, status: 1025, message: error.message, data: {} };
    }
  }

  // calculate pricing without using the CPQ engine
  public async calculateAndSavePriceAndTaxStandalone(quoteId: string): Promise<ApiRespDTO<any>> {
    this.logger.info('calculateAndSavePriceAndTaxStandalone');
    let quoteModel: QuoteModel = new QuoteModel();
    try {
      // calculate quote
      this.logger.info(`starting getQuoteFromCPQ at ${new Date()}: ${quoteId}`);
      const uncalculatedQuote = await this.sfdcQuoteService.getQuoteFromCPQ(quoteId);
      this.logger.info(`finished getQuoteFromCPQ at ${new Date()}: ${quoteId}`);
      this.logger.info(`starting calculateQuote at ${new Date()}: ${quoteId}`);
      // ADAM - this is the new calculate service
      const calculatedQuote = await this.sfdcCPQService.calculateQuote(uncalculatedQuote);
      this.logger.info(`finished calculateQuote at ${new Date()}: ${quoteId}`);
      this.logger.info(`starting calculateTax at ${new Date()}: ${quoteId}`);
      const calculatedQuoteWithTax = await this.calculateTaxForQuoteModel(calculatedQuote);
      this.logger.info(`finished calculateTax at ${new Date()}: ${quoteId}`);

      //quote_html ==true then generate html model and update status to Presented
      if (this.quoteHtml == true) {
        // calculate formula fields and rollups - in that order
        calculatedQuoteWithTax.setFormulaFieldValues();

        calculatedQuoteWithTax.setQuoteRollupFields();

        //Get Quotemodel for HTML
        this.logger.info(`starting Quote HTML Model at ${new Date()}: ${quoteId}`);
        quoteModel = await this.getQuoteHtmlModel(quoteId, calculatedQuoteWithTax);
        this.logger.info(`finished Quote HTML Model at ${new Date()}: ${quoteId}`);

        this.logger.info(`Quote HTML Model :  ${JSON.stringify(quoteModel)}`);

        calculatedQuoteWithTax.record.SBQQ__Status__c = 'Presented';
        quoteModel.status = 'Presented';

        this.logger.info(`finished updating quote status to Presented  ${new Date()}: ${quoteId}`);
      } else {
        quoteModel.quoteId = calculatedQuoteWithTax.record.Id;
      }

      // save quote
      this.logger.info(`starting quote save at ${new Date()}: ${quoteId}`);
      const savecalculatedQuoteWithTax = await this.sfdcCPQService.saveQuote(calculatedQuoteWithTax);
      this.logger.info(`finished quote save at ${new Date()}: ${quoteId}`);

      // response based on success or failure
      if (savecalculatedQuoteWithTax) {
        return { success: true, status: 1000, data: { quoteModel: quoteModel } };
      } else {
        return { success: false, status: 1024, message: 'Error in saving standalone tax', data: {} };
      }
    } catch (error) {
      this.logger.error(error);
      return { success: false, status: 1024, message: error.message, data: {} };
    }
  }

  // Quote Html
  public async getQuoteHtmlModel(quoteId: string, cpqQuoteModel: CPQ_QuoteModel): Promise<QuoteModel> {
    let quoteModel: QuoteModel = new QuoteModel();
    try {
      let sfdcQuote: SBQQ__Quote__c = await this.sfdcQuoteService.getQuoteDetailsById(quoteId);
      let getPaymentMethodIdFromFirestore = await this.firestoreService.getDocument('quotes', quoteId);
    
      //  Map Tax CPQ model to QuoteModel
      if (cpqQuoteModel.hasOwnProperty('record')) {
        //update sfdcQuote data with cpqQuoteModel.record only for new values
        sfdcQuote.One_Time_Subtotal__c = cpqQuoteModel.record.One_Time_Subtotal__c;
        sfdcQuote.One_Time_Tax__c = cpqQuoteModel.record.One_Time_Tax__c;

        sfdcQuote.One_Time_Total__c = cpqQuoteModel.record.One_Time_Total__c;

        sfdcQuote.Recurring_Subtotal__c = cpqQuoteModel.record.Recurring_Subtotal__c;
        sfdcQuote.Recurring_Tax__c = cpqQuoteModel.record.Recurring_Tax__c;
        sfdcQuote.Recurring_Total__c = cpqQuoteModel.record.Recurring_Total__c;

        const updatedLineItems = sfdcQuote.SBQQ__LineItems__r['records'].map((oldItem) => {
          const newItem = cpqQuoteModel.lineItems.find((newItem) => newItem.record.Id === oldItem.Id).record;

          //if newItem.SBQQ__Product__r==null then get product from oldItem
          if (newItem.SBQQ__Product__r == null) {
            newItem.SBQQ__Product__r = oldItem.SBQQ__Product__r;
          }

          // If the item exists in the new array, update it, otherwise keep the existing item
          return newItem ? { ...oldItem.record, ...newItem } : oldItem;
        });
        sfdcQuote.SBQQ__LineItems__r['records'] = updatedLineItems;
      }

      quoteModel = SFDC_QuoteMapper.getMyUSSQuoteModeFromCPQ(sfdcQuote);
      quoteModel.isAutoPay = getPaymentMethodIdFromFirestore ? getPaymentMethodIdFromFirestore.isAutoPay : true;
      quoteModel.currentStatus = this.accountsServiceV2.getQuoteStatus(sfdcQuote,getPaymentMethodIdFromFirestore)

      // till here
    } catch (error) {
      this.logger.error(error);
    }

    return quoteModel;
  }

  private generateSortOrder(key: number, startDigit?: number): string {
    // 14 digits with padded 0s
    // Bundles, assets, and services are 100000 x key padded with 0s to 14 chars
    let sortOrderNumber = key * 100000;
    let sortOrder = sortOrderNumber.toString().padStart(14, '0');
    // if there is a start digit, replace the first digit with it
    if (startDigit) {
      sortOrder = startDigit + sortOrder.substring(startDigit.toString().length, sortOrder.length);
    }
    return sortOrder;
    // PnD
  }
  private createQuoteLinesModel(
    addProductRequest: AddProductAndCalculateReqDTO,
    bundle: Bundle,
    startingSortKey?: number,
  ): QuoteLinesModel {
    let currentSortKey = startingSortKey ? startingSortKey : 1;
    let quoteLinesModel = new QuoteLinesModel();
    let quoteLineBundleModel = new SBQQ__QuoteLine__c();
    // set the Asset Summary for the whole bundle
    const assetSummary = bundle.assetProduct.summary;
    quoteLineBundleModel.SBQQ__Quote__c = addProductRequest.quoteId;
    quoteLineBundleModel.SBQQ__Bundle__c = true;
    quoteLineBundleModel.SBQQ__StartDate__c = addProductRequest.startDate;
    quoteLineBundleModel.SBQQ__EndDate__c = addProductRequest.endDate;
    quoteLineBundleModel.SBQQ__PricebookEntryId__c = bundle.bundleProduct.priceBookEntryId;
    quoteLineBundleModel.SBQQ__ProductSubscriptionType__c =
      bundle.bundleProduct.chargeType === 'One-Time' ? 'One-time' : 'Renewable';
    quoteLineBundleModel.SBQQ__Product__c = bundle.bundleProduct.id;
    quoteLineBundleModel.SBQQ__Quantity__c = bundle.quantity;
    quoteLineBundleModel.SBQQ__TaxCode__c = bundle.bundleProduct.taxCode;
    quoteLineBundleModel.SBQQ__ChargeType__c = bundle.bundleProduct.chargeType;
    quoteLineBundleModel.SBQQ__SubscriptionPricing__c = SBQQ__SUBSCRIPTIONPRICING__C; //from product
    quoteLineBundleModel.SBQQ__SubscriptionType__c =
      bundle.bundleProduct.chargeType === 'One-Time' ? 'One-time' : 'Renewable';
    quoteLineBundleModel.Prod_Subscription_Type__c =
      bundle.bundleProduct.chargeType === 'One-Time' ? 'One-time' : 'Renewable';
    quoteLineBundleModel.QuantityUnitOfMeasure__c = null;
    quoteLineBundleModel.Requires_Parent_Asset__c = false;
    quoteLineBundleModel.SBQQ__Number__c = currentSortKey;
    quoteLineBundleModel.Sort_Order__c = this.generateSortOrder(currentSortKey);
    currentSortKey++;
    quoteLineBundleModel.USF_Address__c = addProductRequest.addressId;
    quoteLineBundleModel.CustomerOwned__c = false;
    quoteLineBundleModel.AdditionalOptions__c = null;
    quoteLineBundleModel.Asset_Summary__c = assetSummary;
    quoteLinesModel.quoteLineBundle = quoteLineBundleModel;

    let quoteLineAssetModel = new SBQQ__QuoteLine__c();
    quoteLineAssetModel.SBQQ__Quote__c = addProductRequest.quoteId;
    quoteLineAssetModel.SBQQ__Bundle__c = false;
    quoteLineAssetModel.SBQQ__RequiredBy__c = null;
    quoteLineAssetModel.SBQQ__StartDate__c = addProductRequest.startDate;
    quoteLineAssetModel.SBQQ__EndDate__c = addProductRequest.endDate;
    quoteLineAssetModel.SBQQ__Product__c = bundle.assetProduct.id;
    quoteLineAssetModel.SBQQ__ProductOption__c = bundle.assetProduct.productOptionId;
    quoteLineAssetModel.SBQQ__OptionType__c = bundle.assetProduct.productOptionType;
    quoteLineAssetModel.SBQQ__DynamicOptionId__c = bundle.assetProduct.featureId;
    quoteLineAssetModel.SBQQ__PricebookEntryId__c = bundle.assetProduct.priceBookEntryId;
    quoteLineAssetModel.SBQQ__ProductSubscriptionType__c =
      bundle.assetProduct.chargeType === 'One-Time' ? 'One-time' : 'Renewable';
    quoteLineAssetModel.SBQQ__Quantity__c = bundle.quantity;
    // always 1 per bundle qty
    quoteLineAssetModel.SBQQ__BundledQuantity__c = 1;
    quoteLineAssetModel.SBQQ__OptionLevel__c = 1;
    quoteLineAssetModel.SBQQ__TaxCode__c = bundle.assetProduct.taxCode;
    quoteLineAssetModel.SBQQ__ChargeType__c = bundle.assetProduct.chargeType;
    quoteLineAssetModel.SBQQ__SubscriptionPricing__c = SBQQ__SUBSCRIPTIONPRICING__C; // from Product
    quoteLineAssetModel.SBQQ__SubscriptionType__c =
      bundle.assetProduct.chargeType === 'One-Time' ? 'One-time' : 'Renewable';
    quoteLineAssetModel.Prod_Subscription_Type__c =
      bundle.assetProduct.chargeType === 'One-Time' ? 'One-time' : 'Renewable';
    quoteLineAssetModel.QuantityUnitOfMeasure__c = null;
    quoteLineAssetModel.Requires_Parent_Asset__c = false;
    quoteLineAssetModel.SBQQ__Number__c = currentSortKey;
    quoteLineAssetModel.Sort_Order__c = this.generateSortOrder(currentSortKey);
    currentSortKey++;
    quoteLineAssetModel.USF_Address__c = addProductRequest.addressId;
    quoteLineAssetModel.CustomerOwned__c = false;
    quoteLineAssetModel.AdditionalOptions__c = null;
    quoteLineAssetModel.Asset_Summary__c = assetSummary;
    quoteLinesModel.quoteLineAsset = quoteLineAssetModel;

    let quoteLineServiceModel = new SBQQ__QuoteLine__c();
    quoteLineServiceModel.SBQQ__Quote__c = addProductRequest.quoteId;
    quoteLineServiceModel.SBQQ__Bundle__c = false;
    quoteLineServiceModel.SBQQ__RequiredBy__c = null;
    quoteLineServiceModel.SBQQ__StartDate__c = addProductRequest.startDate;
    quoteLineServiceModel.SBQQ__EndDate__c = addProductRequest.endDate;
    quoteLineServiceModel.SBQQ__Product__c = bundle.serviceProduct.id;
    quoteLineServiceModel.SBQQ__ProductOption__c = bundle.serviceProduct.productOptionId;
    quoteLineServiceModel.SBQQ__OptionType__c = bundle.serviceProduct.productOptionType;
    quoteLineServiceModel.SBQQ__DynamicOptionId__c = bundle.serviceProduct.featureId;
    quoteLineServiceModel.SBQQ__PricebookEntryId__c = bundle.serviceProduct.priceBookEntryId;
    quoteLineServiceModel.SBQQ__ProductSubscriptionType__c =
      bundle.serviceProduct.chargeType === 'One-Time' ? 'One-time' : 'Renewable';
    quoteLineServiceModel.SBQQ__Quantity__c = bundle.quantity;
    // always 1 per bundle qty
    quoteLineServiceModel.SBQQ__BundledQuantity__c = 1;
    quoteLineServiceModel.SBQQ__OptionLevel__c = 1;
    quoteLineServiceModel.SBQQ__TaxCode__c = bundle.serviceProduct.taxCode;
    quoteLineServiceModel.SBQQ__ChargeType__c = bundle.serviceProduct.chargeType;
    quoteLineServiceModel.SBQQ__SubscriptionPricing__c = SBQQ__SUBSCRIPTIONPRICING__C; // from Product
    quoteLineServiceModel.SBQQ__SubscriptionType__c =
      bundle.serviceProduct.chargeType === 'One-Time' ? 'One-time' : 'Renewable';
    quoteLineServiceModel.Prod_Subscription_Type__c =
      bundle.serviceProduct.chargeType === 'One-Time' ? 'One-time' : 'Renewable';
    quoteLineServiceModel.QuantityUnitOfMeasure__c = QUOTELINESERVICE_QUANTITYUNITOFMEASURE__C;
    quoteLineServiceModel.Requires_Parent_Asset__c = true;
    quoteLineServiceModel.SBQQ__Number__c = currentSortKey;
    quoteLineServiceModel.Sort_Order__c = this.generateSortOrder(currentSortKey);
    currentSortKey++;
    quoteLineServiceModel.USF_Address__c = addProductRequest.addressId;
    quoteLineServiceModel.CustomerOwned__c = false;
    quoteLineServiceModel.AdditionalOptions__c = null;
    quoteLineServiceModel.Asset_Summary__c = assetSummary;
    quoteLinesModel.quoteLineService = quoteLineServiceModel;

    const quoteLineAdditionalServiceArr = new Array<SBQQ__QuoteLine__c>();
    if (bundle.additionalProducts && bundle.additionalProducts.length > 0) {
      let count = 1;
      bundle.additionalProducts.map((additionalProduct) => {
        let quoteLineAdditionalServiceModel = new SBQQ__QuoteLine__c();
        quoteLineAdditionalServiceModel.SBQQ__Quote__c = addProductRequest.quoteId;
        quoteLineAdditionalServiceModel.SBQQ__Bundle__c = false;
        quoteLineAdditionalServiceModel.SBQQ__RequiredBy__c = null;
        quoteLineAdditionalServiceModel.SBQQ__StartDate__c = addProductRequest.startDate;
        quoteLineAdditionalServiceModel.SBQQ__EndDate__c = addProductRequest.endDate;
        quoteLineAdditionalServiceModel.SBQQ__Product__c = additionalProduct.id;
        quoteLineAdditionalServiceModel.SBQQ__ProductOption__c = additionalProduct.productOptionId;
        quoteLineAdditionalServiceModel.SBQQ__OptionType__c = additionalProduct.productOptionType;
        quoteLineAdditionalServiceModel.SBQQ__DynamicOptionId__c = additionalProduct.featureId;
        quoteLineAdditionalServiceModel.SBQQ__PricebookEntryId__c = additionalProduct.priceBookEntryId;
        quoteLineAdditionalServiceModel.SBQQ__ProductSubscriptionType__c =
          additionalProduct.chargeType === 'One-Time' ? 'One-time' : 'Renewable';
        quoteLineAdditionalServiceModel.SBQQ__Quantity__c = bundle.quantity;
        // always 1 per bundle qty
        quoteLineAdditionalServiceModel.SBQQ__BundledQuantity__c = 1;
        quoteLineAdditionalServiceModel.SBQQ__OptionLevel__c = 1;
        quoteLineAdditionalServiceModel.SBQQ__TaxCode__c = additionalProduct.taxCode;
        quoteLineAdditionalServiceModel.SBQQ__ChargeType__c = additionalProduct.chargeType;
        quoteLineAdditionalServiceModel.SBQQ__SubscriptionPricing__c = SBQQ__SUBSCRIPTIONPRICING__C;
        quoteLineAdditionalServiceModel.SBQQ__SubscriptionType__c =
          additionalProduct.chargeType === 'One-Time' ? 'One-time' : 'Renewable';
        quoteLineAdditionalServiceModel.Prod_Subscription_Type__c =
          additionalProduct.chargeType === 'One-Time' ? 'One-time' : 'Renewable';
        quoteLineAdditionalServiceModel.QuantityUnitOfMeasure__c = QUOTELINESERVICE_QUANTITYUNITOFMEASURE__C;
        quoteLineAdditionalServiceModel.Requires_Parent_Asset__c = false;
        quoteLineAdditionalServiceModel.SBQQ__Number__c = currentSortKey;
        quoteLineAdditionalServiceModel.Sort_Order__c = this.generateSortOrder(currentSortKey);
        currentSortKey++;
        quoteLineAdditionalServiceModel.USF_Address__c = addProductRequest.addressId;
        quoteLineAdditionalServiceModel.CustomerOwned__c = false;
        quoteLineAdditionalServiceModel.AdditionalOptions__c = null;
        quoteLineAdditionalServiceModel.Asset_Summary__c = assetSummary;

        quoteLineAdditionalServiceArr.push(quoteLineAdditionalServiceModel);
        count++;
      });
    }
    quoteLinesModel.quoteLineAdditionalServiceArr = quoteLineAdditionalServiceArr;

    let quoteLineDeliveryModel = new SBQQ__QuoteLine__c();
    quoteLineDeliveryModel.SBQQ__Quote__c = addProductRequest.quoteId;
    quoteLineDeliveryModel.SBQQ__Bundle__c = false;
    quoteLineDeliveryModel.SBQQ__RequiredBy__c = null;
    quoteLineDeliveryModel.SBQQ__StartDate__c = addProductRequest.startDate;
    quoteLineDeliveryModel.SBQQ__EndDate__c = addProductRequest.endDate;
    quoteLineDeliveryModel.SBQQ__Product__c = bundle.deliveryProduct.id;
    quoteLineDeliveryModel.SBQQ__ProductOption__c = bundle.deliveryProduct.productOptionId;
    quoteLineDeliveryModel.SBQQ__OptionType__c = bundle.deliveryProduct.productOptionType;
    quoteLineDeliveryModel.SBQQ__DynamicOptionId__c = bundle.deliveryProduct.featureId;
    quoteLineDeliveryModel.SBQQ__PricebookEntryId__c = bundle.deliveryProduct.priceBookEntryId;
    quoteLineDeliveryModel.SBQQ__ProductSubscriptionType__c =
      bundle.deliveryProduct.chargeType === 'One-Time' ? 'One-time' : 'Renewable';
    quoteLineDeliveryModel.SBQQ__Quantity__c = bundle.quantity;
    // always 1 per bundle qty
    quoteLineDeliveryModel.SBQQ__BundledQuantity__c = 1;
    quoteLineDeliveryModel.SBQQ__OptionLevel__c = 1;
    quoteLineDeliveryModel.SBQQ__TaxCode__c = bundle.deliveryProduct.taxCode;
    quoteLineDeliveryModel.SBQQ__ChargeType__c = bundle.deliveryProduct.chargeType;
    quoteLineDeliveryModel.SBQQ__SubscriptionPricing__c = SBQQ__SUBSCRIPTIONPRICING__C;
    quoteLineDeliveryModel.SBQQ__SubscriptionType__c =
      bundle.deliveryProduct.chargeType === 'One-Time' ? 'One-time' : 'Renewable';
    quoteLineDeliveryModel.Prod_Subscription_Type__c =
      bundle.deliveryProduct.chargeType === 'One-Time' ? 'One-time' : 'Renewable';
    quoteLineDeliveryModel.QuantityUnitOfMeasure__c = QUOTELINESERVICE_QUANTITYUNITOFMEASURE__C;
    quoteLineDeliveryModel.Requires_Parent_Asset__c = true;
    quoteLineDeliveryModel.SBQQ__Number__c = currentSortKey;
    quoteLineDeliveryModel.Sort_Order__c = this.generateSortOrder(currentSortKey);
    currentSortKey++;
    quoteLineDeliveryModel.USF_Address__c = addProductRequest.addressId;
    quoteLineDeliveryModel.CustomerOwned__c = false;
    quoteLineDeliveryModel.AdditionalOptions__c = null;
    quoteLineDeliveryModel.Asset_Summary__c = assetSummary;
    quoteLinesModel.quoteLineDelivery = quoteLineDeliveryModel;

    let quoteLinePickupModel = new SBQQ__QuoteLine__c();
    quoteLinePickupModel.SBQQ__Quote__c = addProductRequest.quoteId;
    quoteLinePickupModel.SBQQ__Bundle__c = false;
    quoteLinePickupModel.SBQQ__RequiredBy__c = null;
    quoteLinePickupModel.SBQQ__StartDate__c = addProductRequest.startDate;
    quoteLinePickupModel.SBQQ__EndDate__c = addProductRequest.endDate;
    quoteLinePickupModel.SBQQ__Product__c = bundle.pickupProduct.id;
    quoteLinePickupModel.SBQQ__ProductOption__c = bundle.pickupProduct.productOptionId;
    quoteLinePickupModel.SBQQ__OptionType__c = bundle.pickupProduct.productOptionType;
    quoteLinePickupModel.SBQQ__DynamicOptionId__c = bundle.pickupProduct.featureId;
    quoteLinePickupModel.SBQQ__PricebookEntryId__c = bundle.pickupProduct.priceBookEntryId;
    quoteLinePickupModel.SBQQ__ProductSubscriptionType__c =
      bundle.pickupProduct.chargeType === 'One-Time' ? 'One-time' : 'Renewable';
    quoteLinePickupModel.SBQQ__Quantity__c = bundle.quantity;
    // always 1 per bundle qty
    quoteLinePickupModel.SBQQ__BundledQuantity__c = 1;
    quoteLinePickupModel.SBQQ__OptionLevel__c = 1;
    quoteLinePickupModel.SBQQ__TaxCode__c = bundle.pickupProduct.taxCode;
    quoteLinePickupModel.SBQQ__ChargeType__c = bundle.pickupProduct.chargeType;
    quoteLinePickupModel.SBQQ__SubscriptionPricing__c = SBQQ__SUBSCRIPTIONPRICING__C;
    quoteLinePickupModel.SBQQ__SubscriptionType__c =
      bundle.pickupProduct.chargeType === 'One-Time' ? 'One-time' : 'Renewable';
    quoteLinePickupModel.Prod_Subscription_Type__c =
      bundle.pickupProduct.chargeType === 'One-Time' ? 'One-time' : 'Renewable';
    quoteLinePickupModel.QuantityUnitOfMeasure__c = QUOTELINESERVICE_QUANTITYUNITOFMEASURE__C;
    quoteLinePickupModel.Requires_Parent_Asset__c = true;
    quoteLinePickupModel.SBQQ__Number__c = currentSortKey;
    quoteLinePickupModel.Sort_Order__c = this.generateSortOrder(currentSortKey);
    currentSortKey++;
    quoteLinePickupModel.USF_Address__c = addProductRequest.addressId;
    quoteLinePickupModel.CustomerOwned__c = false;
    quoteLinePickupModel.AdditionalOptions__c = null;
    quoteLinePickupModel.Asset_Summary__c = assetSummary;
    quoteLinesModel.quoteLinePickup = quoteLinePickupModel;

    let quotedJobsiteModel = new NF_Quoted_Jobsite__c();
    quotedJobsiteModel.NF_Quote__c = addProductRequest.quoteId;
    quotedJobsiteModel.NF_Quote_Line__c = null;
    quotedJobsiteModel.NF_Aggregated_Product_Name__c = `${bundle.assetProduct.name} ${bundle.serviceProduct.name}`;
    quotedJobsiteModel.NF_Asset_Product__c = bundle.assetProduct.id;
    quotedJobsiteModel.NF_Frequency_Product__c = bundle.serviceProduct.id;
    quotedJobsiteModel.NF_PreOrder_Flow_Complete__c = false;
    quotedJobsiteModel.NF_Quantity_Quoted__c = bundle.quantity; // MVP - all quantity is allocated to a single QJS
    quotedJobsiteModel.NF_SiteName__c = null;
    quotedJobsiteModel.NF_Start_Date__c = new Date(addProductRequest.startDate);
    quotedJobsiteModel.NF_End_Date__c = new Date(addProductRequest.endDate);
    quotedJobsiteModel.NF_USF_Address__c = addProductRequest.addressId;
    quoteLinesModel.quotedJobsite = quotedJobsiteModel;
    return quoteLinesModel;
  }
  createCartLevelQuoteLines(
    addProductRequest: AddProductAndCalculateReqDTO,
    productList: Product2[],
  ): SBQQ__QuoteLine__c[] {
    let cartLevelQuoteLines: SBQQ__QuoteLine__c[] = [];

    const cartLevelPickupProduct = productList.find((product) => {
      return (
        product.ProductType__c === 'P n D' &&
        product.Asset_Summary__c.startsWith('Cart-level') &&
        product.Name.startsWith('Pick')
      );
    });
    let quoteLinePickupCartModel = new SBQQ__QuoteLine__c();
    quoteLinePickupCartModel.SBQQ__Quote__c = addProductRequest.quoteId;
    quoteLinePickupCartModel.SBQQ__Bundle__c = false;
    quoteLinePickupCartModel.SBQQ__RequiredBy__c = null;
    quoteLinePickupCartModel.SBQQ__StartDate__c = addProductRequest.startDate;
    quoteLinePickupCartModel.SBQQ__EndDate__c = addProductRequest.endDate;
    quoteLinePickupCartModel.SBQQ__Product__c = cartLevelPickupProduct.Id;
    quoteLinePickupCartModel.SBQQ__ProductOption__c = null;
    quoteLinePickupCartModel.SBQQ__PricebookEntryId__c = cartLevelPickupProduct.PricebookEntries[0].Id;
    quoteLinePickupCartModel.SBQQ__ProductSubscriptionType__c = cartLevelPickupProduct.SBQQ__SubscriptionType__c;
    quoteLinePickupCartModel.SBQQ__Quantity__c = 1; // qty is 1 for cart-level fees
    quoteLinePickupCartModel.SBQQ__TaxCode__c = cartLevelPickupProduct.AVA_SFCPQ__TaxCode__c;
    quoteLinePickupCartModel.SBQQ__ChargeType__c = cartLevelPickupProduct.Line_Type__c;
    quoteLinePickupCartModel.SBQQ__SubscriptionPricing__c = SBQQ__SUBSCRIPTIONPRICING__C;
    quoteLinePickupCartModel.SBQQ__SubscriptionType__c = cartLevelPickupProduct.SBQQ__SubscriptionType__c;
    quoteLinePickupCartModel.Prod_Subscription_Type__c = cartLevelPickupProduct.SBQQ__SubscriptionType__c;
    quoteLinePickupCartModel.QuantityUnitOfMeasure__c = QUOTELINESERVICE_QUANTITYUNITOFMEASURE__C;
    quoteLinePickupCartModel.Requires_Parent_Asset__c = false;
    // Cart level PnD sort to 50000000000000
    quoteLinePickupCartModel.Sort_Order__c = this.generateSortOrder(2, 5);
    quoteLinePickupCartModel.USF_Address__c = addProductRequest.addressId;
    quoteLinePickupCartModel.CustomerOwned__c = false;
    quoteLinePickupCartModel.AdditionalOptions__c = null;
    quoteLinePickupCartModel.Asset_Summary__c = cartLevelPickupProduct.Asset_Summary__c;
    cartLevelQuoteLines.push(quoteLinePickupCartModel);

    // cart-level delivery
    const cartLevelDeliveryProduct = productList.find((product) => {
      return (
        product.ProductType__c === 'P n D' &&
        product.Asset_Summary__c.startsWith('Cart-level') &&
        product.Name.startsWith('Del')
      );
    });
    let quoteLineDeliveryCartModel = new SBQQ__QuoteLine__c();
    quoteLineDeliveryCartModel.SBQQ__Quote__c = addProductRequest.quoteId;
    quoteLineDeliveryCartModel.SBQQ__Bundle__c = false;
    quoteLineDeliveryCartModel.SBQQ__RequiredBy__c = null;
    quoteLineDeliveryCartModel.SBQQ__StartDate__c = addProductRequest.startDate;
    quoteLineDeliveryCartModel.SBQQ__EndDate__c = addProductRequest.endDate;
    quoteLineDeliveryCartModel.SBQQ__Product__c = cartLevelDeliveryProduct.Id;
    quoteLineDeliveryCartModel.SBQQ__ProductOption__c = null;
    quoteLineDeliveryCartModel.SBQQ__PricebookEntryId__c = cartLevelDeliveryProduct.PricebookEntries[0].Id;
    quoteLineDeliveryCartModel.SBQQ__ProductSubscriptionType__c = cartLevelDeliveryProduct.SBQQ__SubscriptionType__c;
    quoteLineDeliveryCartModel.SBQQ__Quantity__c = 1;
    quoteLineDeliveryCartModel.SBQQ__TaxCode__c = cartLevelDeliveryProduct.AVA_SFCPQ__TaxCode__c;
    quoteLineDeliveryCartModel.SBQQ__ChargeType__c = cartLevelDeliveryProduct.Line_Type__c;
    quoteLineDeliveryCartModel.SBQQ__SubscriptionPricing__c = SBQQ__SUBSCRIPTIONPRICING__C;
    quoteLineDeliveryCartModel.SBQQ__SubscriptionType__c = cartLevelDeliveryProduct.SBQQ__SubscriptionType__c;
    quoteLineDeliveryCartModel.Prod_Subscription_Type__c = cartLevelDeliveryProduct.SBQQ__SubscriptionType__c;
    quoteLineDeliveryCartModel.QuantityUnitOfMeasure__c = QUOTELINESERVICE_QUANTITYUNITOFMEASURE__C;
    quoteLineDeliveryCartModel.Requires_Parent_Asset__c = false;
    // delivery first
    quoteLineDeliveryCartModel.Sort_Order__c = this.generateSortOrder(1, 5);
    quoteLineDeliveryCartModel.USF_Address__c = addProductRequest.addressId;
    quoteLineDeliveryCartModel.CustomerOwned__c = false;
    quoteLineDeliveryCartModel.AdditionalOptions__c = null;
    quoteLineDeliveryCartModel.Asset_Summary__c = cartLevelDeliveryProduct.Asset_Summary__c;

    cartLevelQuoteLines.push(quoteLineDeliveryCartModel);
    return cartLevelQuoteLines;
  }
  private createShortTermQuoteLineIfNeeded(quote: SBQQ__Quote__c, productList: Product2[]): SBQQ__QuoteLine__c {
    // if the order type is not Recurring Service then we don't need to create a short term quote line
    if (quote.Order_Type__c !== 'Recurring Service') {
      return;
    }
    let daysBetween = 0;
    const startDate = new Date(quote.SBQQ__StartDate__c);
    const endDate = new Date(quote.SBQQ__EndDate__c);
    daysBetween = DateUtils.getDifferenceInDays(startDate, endDate);
    if (daysBetween > 30) {
      return;
    }
    // if it's less than or equal to 30 then add the short term line
    const shortTermProduct = productList.find((product) => product.ProductCode === 'ShortTerm');

    const shortTermQuoteLineModel = new SBQQ__QuoteLine__c();
    shortTermQuoteLineModel.SBQQ__Product__c = shortTermProduct.Id;
    shortTermQuoteLineModel.SBQQ__Quote__c = quote.Id;
    shortTermQuoteLineModel.SBQQ__ChargeType__c = 'One-Time';
    shortTermQuoteLineModel.SBQQ__Number__c = 200;
    shortTermQuoteLineModel.SBQQ__Quantity__c = 1;
    shortTermQuoteLineModel.SBQQ__StartDate__c = quote.SBQQ__StartDate__c;
    shortTermQuoteLineModel.SBQQ__EndDate__c = DateUtils.formatDateAsSalesforceString(
      DateUtils.addDays(new Date(quote.SBQQ__StartDate__c), 35),
    );
    shortTermQuoteLineModel.SBQQ__PricebookEntryId__c = shortTermProduct.PricebookEntries[0].Id;
    shortTermQuoteLineModel.SBQQ__ListPrice__c = 0;
    shortTermQuoteLineModel.SBQQ__UnitCost__c = 0;
    shortTermQuoteLineModel.SBQQ__CustomerPrice__c = 0;
    shortTermQuoteLineModel.SBQQ__NetPrice__c = 0;
    shortTermQuoteLineModel.Floor_Price__c = 0;
    shortTermQuoteLineModel.Price_Override__c = 0;
    shortTermQuoteLineModel.SBQQ__SubscriptionTerm__c = 1;
    shortTermQuoteLineModel.SBQQ__ProductSubscriptionType__c = 'One-time';
    shortTermQuoteLineModel.SBQQ__SubscriptionType__c = 'One-time';
    shortTermQuoteLineModel.SBQQ__DefaultSubscriptionTerm__c = 1;
    shortTermQuoteLineModel.SBQQ__SubscriptionPricing__c = 'Fixed Price';
    shortTermQuoteLineModel.SBQQ__ProrateMultiplier__c = 1;
    shortTermQuoteLineModel.Sort_Order__c = this.generateSortOrder(1, 9);
    shortTermQuoteLineModel.USF_Address__c = quote.Shipping_Address__c;
    return shortTermQuoteLineModel;
  }
  // https://developer.salesforce.com/docs/atlas.en-us.cpq_dev_api.meta/cpq_dev_api/cpq_quote_api_save_final.htm
  private createQuoteModelFromBundles(
    addProductRequest: AddProductAndCalculateReqDTO,
    bundles: Bundle[],
    cartLevelQuoteLines,
  ): CPQ_QuoteModel {
    const quoteModel = new CPQ_QuoteModel();
    // don't trigger calculations upon save
    quoteModel.calculationRequired = false;
    quoteModel.calculatePending = false;
    quoteModel.backgroundCalculatePending = false;
    // just the bare bones of the quote
    const quoteRecord = new SBQQ__Quote__c();
    quoteRecord.Id = addProductRequest.quoteId;
    quoteModel.record = quoteRecord;
    quoteModel.record.setTypeAttribute();

    const lineItems = new Array<CPQ_QuoteLineModel>();

    let currentKey = 0;
    bundles.forEach((bundle) => {
      // increment the current key and set bundle key to it
      currentKey++;
      bundle.key = currentKey;
      let quoteLines = this.createQuoteLinesModel(addProductRequest, bundle, currentKey);
      // create the bundle line
      lineItems.push(this.sfdcCPQService.createQuoteLineModel(quoteLines.quoteLineBundle, bundle.key));
      // create additional service lines
      quoteLines.quoteLineAdditionalServiceArr.map((quoteLineAdditionalService) => {
        currentKey++;
        lineItems.push(this.sfdcCPQService.createQuoteLineModel(quoteLineAdditionalService, currentKey, bundle.key));
      });
      // create the asset line
      currentKey++;
      lineItems.push(this.sfdcCPQService.createQuoteLineModel(quoteLines.quoteLineAsset, currentKey, bundle.key));
      // create the service line
      currentKey++;
      lineItems.push(this.sfdcCPQService.createQuoteLineModel(quoteLines.quoteLineService, currentKey, bundle.key));
      // create the delivery line
      currentKey++;
      lineItems.push(this.sfdcCPQService.createQuoteLineModel(quoteLines.quoteLineDelivery, currentKey, bundle.key));
      // create the pickup line
      currentKey++;
      lineItems.push(this.sfdcCPQService.createQuoteLineModel(quoteLines.quoteLinePickup, currentKey, bundle.key));
    });
    // create the cart level lines
    cartLevelQuoteLines.map((cartLevelQuoteLine) => {
      currentKey++;
      lineItems.push(this.sfdcCPQService.createQuoteLineModel(cartLevelQuoteLine, currentKey));
    });
    quoteModel.lineItems = lineItems;
    return quoteModel;
  }

  public async createAndSaveQuoteDocument(
    quoteId: string,
    requestId: string,
    accountId: string,
    auth0Id : string
  ): Promise<ApiRespDTO<any>> {
    let cacheDataJSON = {
      requestId,
      response: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.trackUserActionService.setPortalActions(
      accountId,
      auth0Id,
      STEP1_SCREEN,
      CREATED_AND_SAVE_DOCUMENT,
      quoteId,
      '',
    );

    let createAndSaveQuoteDocumentResp = new ApiRespDTO<any>();
    const accountName = await this.sfdcQuoteService.getAccountName(quoteId);
    let proposal = await this.sfdcQuoteService.createQuoteDocumentJob(accountName, quoteId);
    this.logger.info(`proposal at ${new Date()}: ${JSON.stringify(proposal)}`);
    let proposalStatusResults = await this.sfdcQuoteService.getProposalStatus(proposal);
    this.logger.info(`proposalStatusResults: ${JSON.stringify(proposalStatusResults)}`);
    let proposalStatus = proposalStatusResults;
    let count = 0;
    let requeueCount = 0;
    while (proposalStatus !== 'Completed' && count < 30 && requeueCount < 3) {
      count++;
      // wait for 2 seconds for the proposal to generate
      this.logger.info(`proposal not yet created (${proposalStatus}), trying again in 2 seconds - count: ${count}`);
      // if the job failed, queue it up again
      if (proposalStatus === 'Failed') {
        proposal = await this.sfdcQuoteService.createQuoteDocumentJob(accountName, quoteId);
        this.logger.info(`new proposal queued at ${new Date()}: ${JSON.stringify(proposal)}`);
        count = 0;
        requeueCount++;
      }
      await this.timeout(2000);
      proposalStatusResults = await this.sfdcQuoteService.getProposalStatus(proposal);
      proposalStatus = proposalStatusResults;
    }
    if (count > 29 || requeueCount > 2) {
      createAndSaveQuoteDocumentResp = {
        status: 1009,
        success: false,
        message: 'Fail',
        data: {},
      };
      return createAndSaveQuoteDocumentResp;
    }
    this.logger.info(`Quote proposal finished processing at ${new Date()}: ${JSON.stringify(proposal)}`);

    //if Quote is already Presented and Customer Approved, then don't update the status
    const quoteStatus: SBQQ__Quote__c = await this.sfdcQuoteService.fetchQuoteStatus(quoteId);
    let updateStatusResp: SfdcRespModel = new SfdcRespModel();
    if (quoteStatus.SBQQ__Status__c === 'Draft') {
      updateStatusResp = await this.sfdcQuoteService.updateStatus(quoteId);
    } else {
      updateStatusResp.success = true;
    }
    if (updateStatusResp.success) {
      let docData = await this.getDocumentId(quoteId);
      createAndSaveQuoteDocumentResp = {
        status: 1000,
        success: true,
        message: 'Success',
        data: docData,
      };
      cacheDataJSON.response = createAndSaveQuoteDocumentResp;
      await this.cacheService.set(requestId, cacheDataJSON, TIMEMS_CACHE_REQUEST_FOR_QUOTE);
      return createAndSaveQuoteDocumentResp;
    } else {
      createAndSaveQuoteDocumentResp = {
        status: 1009,
        success: false,
        message: 'Fail',
        data: {},
      };
      cacheDataJSON.response = createAndSaveQuoteDocumentResp;
      await this.cacheService.set(requestId, cacheDataJSON, TIMEMS_CACHE_REQUEST_FOR_QUOTE);
      return createAndSaveQuoteDocumentResp;
    }
  }
  async getDocumentId(id: string): Promise<object> {
    const resp = await this.sfdcQuoteService.getDocumentId(id);
    let byVersion = resp.records[0].SBQQ__R00N70000001lX7YEAU__r.records.slice(0);
    let name = resp.records[0].SBQQ__R00N70000001lX7YEAU__r.records[0].Name;
    byVersion.sort(function (a, b) {
      return a.SBQQ__Version__c - b.SBQQ__Version__c;
    });
    let docId = '';
    if (byVersion.length > 0) {
      docId = byVersion[byVersion.length - 1].SBQQ__DocumentId__c;
    }

    return { documentId: docId, documentName: name };
  }

  async updateSiteDetails(siteDetailsReq: SiteDetailsReqDTO, accountId:string,auth0Id:string): Promise<ApiRespDTO<any>> {
    let cacheDataJSON = {
      ...siteDetailsReq,
      response: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    let updateSiteDetailsResp = new ApiRespDTO<any>();
    const cacheResp = await this.handleCache(siteDetailsReq.requestId, siteDetailsReq, TIMEMS_CACHE_REQUEST_FOR_QUOTE);
    if (!cacheResp?.isEligibleForNewRequest) {
      return cacheResp.resp;
    }
    this.trackUserActionService.setPortalActions(
      accountId,
      auth0Id,
      STEP3_SCREEN,
      ENTERED_SITE_DETAILS,
      siteDetailsReq.quoteId,
      '',
    );
    //update site contact
    const updateSiteContactResp = await this.sfdcQuoteService.updateSiteContact(
      siteDetailsReq,
      siteDetailsReq.ussPortalUserId,
    );
    siteDetailsReq.contactId = updateSiteContactResp.id;
    siteDetailsReq.addressData.shipToContactRefId = updateSiteContactResp.id;
    siteDetailsReq.addressData.siteContactRefId = updateSiteContactResp.id;
    const updateSiteAddressResp = await this.sfdcQuoteService.updateSiteAddress(siteDetailsReq);
    //delete all existing quoted jobsites
    const deleteQuotedJobsiteResp = await this.sfdcQuoteService.deleteQuotedJobsiteByQuoteId(siteDetailsReq.quoteId);
    const quotedJobsiteList = await this.sfdcQuoteService.createQuotedJobsiteList(siteDetailsReq);
    const qjsPostBody = { quoteId: siteDetailsReq.quoteId, quotedJobsites: quotedJobsiteList };
    const saveResult = await this.sfdcQuoteService.saveQuotedJobsites(qjsPostBody);
    const quoteStatus = await this.sfdcQuoteService.updateQuoteStatusSiteComplete(siteDetailsReq);
    if (!saveResult.success) {
      this.logger.error('Failed to save Quoted Jobsites', saveResult);
      return {
        success: false,
        status: 1009,
        message: 'Failed to update site details',
        data: {},
      };
    }
    if (updateSiteContactResp.success && updateSiteAddressResp.success && saveResult.success && quoteStatus.success) {
      updateSiteDetailsResp = {
        success: true,
        status: 1000,
        message: 'Success',
        data: { ...siteDetailsReq, quoteId: siteDetailsReq.quoteId },
      };
      cacheDataJSON.response = updateSiteDetailsResp;
      await this.cacheService.set(siteDetailsReq.requestId, cacheDataJSON, TIMEMS_CACHE_REQUEST_FOR_QUOTE);
    } else {
      
      if (!updateSiteContactResp.success) {
        updateSiteDetailsResp = {
          success: false,
          status: 1009,
          message: 'Failed to update site details',
          data: {},
        };
      } else if (
        updateSiteAddressResp.message == 'Please make sure to enter both Site Hours Start/End time' ||
        updateSiteAddressResp.message ==
          'Please make sure Site Hours Start Time is earlier than the Site Hours End Time' ||
        updateSiteAddressResp.message == 'Please make sure Site Hours Start/End Time are at least 2 hours apart'
      ) {
        updateSiteDetailsResp = {
          success: false,
          status: 1010,
          message: updateSiteAddressResp.message,
          data: {},
        };
        await this.cacheService.set(siteDetailsReq.requestId, cacheDataJSON, TIMEMS_CACHE_REQUEST_FOR_QUOTE);
      }else if(!updateSiteAddressResp.success){
        updateSiteDetailsResp = {
          success: false,
          status: 1009,
          message: 'Failed to update site details',
          data: {error: updateSiteAddressResp.message},
        };
        cacheDataJSON.response = updateSiteDetailsResp;
        await this.cacheService.set(siteDetailsReq.requestId, cacheDataJSON, TIMEMS_CACHE_REQUEST_FOR_QUOTE);
      }

    }
    return updateSiteDetailsResp;
  }
  async deleteQuotedJobSite(addressId: string): Promise<ApiRespDTO<any>> {
    const deleteQuotedJobsiteResp = await this.sfdcQuoteService.deleteQuotedJobsiteByAddress(addressId);
    let deletedJobSiteArr = deleteQuotedJobsiteResp.filter((site) => site.success == false);
    if (deletedJobSiteArr.length == 0) {
      const response = {
        success: true,
        status: 1000,
        message: 'Success',
        data: {},
      };
      return response;
    } else {
      const response = {
        success: false,
        status: 1026,
        message: 'Failed to delete location. Please try again.',
        data: {},
      };
      return response;
    }
  }

  async updateQuoteStatus(
    quoteStatusReq: UpdateQuoteStatusReqDTO,
    accountId: string,
    auth0Id : string
  ): Promise<ApiRespDTO<any>> {
    let updateQuoteStatusResult = new ApiRespDTO<any>();
    this.logger.info(`Updating status to ${quoteStatusReq.status} for ${quoteStatusReq.quoteId} at ${new Date()}`);
    // check for missing quote ID
    if (!quoteStatusReq.quoteId) {
      updateQuoteStatusResult = {
        success: false,
        status: 1005,
        message: 'Missing Quote ID',
        data: { quoteId: quoteStatusReq.quoteId },
      };
      return updateQuoteStatusResult;
    }
    // Track user action for quote status if it is Accepted or Rejected
    if (quoteStatusReq.status && ['Approved', 'Rejected'].includes(quoteStatusReq.status)) {
      const statusCode = quoteStatusReq.status === 'Approved' ? ACCEPTED_QUOTE : REJECTED_QUOTE;
      this.trackUserActionService.setPortalActions(
        accountId,
        auth0Id,
        STEP2_SCREEN,
        statusCode,
        quoteStatusReq.quoteId,
        '',
      );
    } 
    const updateQuoteStatusResp = await this.sfdcQuoteService.updateQuoteStatus(quoteStatusReq);
    if (updateQuoteStatusResp.success == true) {
      updateQuoteStatusResult = {
        success: true,
        status: 1000,
        message: 'Success',
        data: { quoteId: quoteStatusReq.quoteId },
      };
    } else {
      updateQuoteStatusResult = {
        success: false,
        status: 1009,
        message: 'Fail',
        data: { quoteId: quoteStatusReq.quoteId },
      };
    }
    return updateQuoteStatusResult;
  }

  async updateBillingAddress(
    billingDetailsReq: BillingDetailsReqDTO,
    accountId: string,
    auth0Id: string
  ): Promise<ApiRespDTO<any>> {
    let cacheDataJSON = {
      ...billingDetailsReq,
      response: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const cacheResp = await this.handleCache(
      billingDetailsReq.requestId,
      billingDetailsReq,
      TIMEMS_CACHE_REQUEST_FOR_QUOTE,
    );
    if (!cacheResp?.isEligibleForNewRequest) {
      return cacheResp.resp;
    }

    this.trackUserActionService.setPortalActions(
      accountId,
      auth0Id,
      STEP4_SCREEN,
      COMPLETED_BILLING_DETAILS,
      billingDetailsReq.quoteId,
      '',
    );

    const updateBillingResp = await this.sfdcQuoteService.updateBillingAddress(billingDetailsReq);
    let updateBillingAddressResp = new ApiRespDTO<any>();
    if (updateBillingResp) {
      const savePaymentMethodidToFirestore = await this.savePaymentMethodIdToFirestore(
        billingDetailsReq.paymentMethodId,
        billingDetailsReq.isAutoPay,
        billingDetailsReq.quoteId,
        billingDetailsReq.accountId,
      );
      this.logger.info(`savePaymentMethodidToFirestore: ${JSON.stringify(savePaymentMethodidToFirestore)}`);
      updateBillingAddressResp = {
        success: true,
        status: 1000,
        message: 'Success',
        data: { ...billingDetailsReq, quoteId: billingDetailsReq.quoteId },
      };
      cacheDataJSON.response = updateBillingAddressResp;
      await this.cacheService.set(billingDetailsReq.requestId, cacheDataJSON, TIMEMS_CACHE_REQUEST_FOR_QUOTE);
    } else {
      updateBillingAddressResp = {
        success: false,
        status: 1005,
        message: 'Fail',
        data: {},
      };
      cacheDataJSON.response = updateBillingAddressResp;
      await this.cacheService.set(billingDetailsReq.requestId, cacheDataJSON, TIMEMS_CACHE_REQUEST_FOR_QUOTE);
    }
    return updateBillingAddressResp;
  }
  async savePaymentMethodIdToFirestore(
    paymentMethodId: string,
    isAutoPay: boolean,
    quoteId: string,
    accountId: string,
  ): Promise<object> {
    const quoteDoc = new BillingDetailsReqDTO();
    quoteDoc.paymentMethodId = paymentMethodId;
    quoteDoc.isAutoPay = isAutoPay;
    quoteDoc.quoteId = quoteId;
    quoteDoc.accountId = accountId;

    const storeQuotePaymentMethodId = await this.firestoreService.createDocument('quotes', quoteId, quoteDoc);
    return storeQuotePaymentMethodId;
  }
  //for add/update quote/contract Id
  async saveAccoutwiseIdsToFirestore(obj) {
    const doc = await this.firestoreService.getDocument('accounts', obj.accountId);
    if (doc != null) {
      if (obj.quotes) {
        let array = doc.quotes;
        if (array) {
          array.push(obj.quotes[0]);
          obj.quotes = array;
        }
      } else {
        let array = doc.contracts;
        if (array) {
          array.push(obj.contracts[0]);
          obj.contracts = array;
        }
      }
      await this.firestoreService.updateDocument('accounts', obj.accountId, {
        ...obj,
        updatedAt: DateUtils.getDateStringForToday(),
      });
    } else {
      await this.firestoreService.createDocument('accounts', obj.accountId, obj);
    }
  }

  //for guard update all the ids
  async updateAccoutwiseIdsToFirestore(obj) {
    const doc = await this.firestoreService.getDocument('accounts', obj.accountId);
    if (doc != null) {
      await this.firestoreService.updateDocument('accounts', obj.accountId, {
        ...obj,
        updatedAt: DateUtils.getDateStringForToday(),
      });
    } else {
      await this.firestoreService.createDocument('accounts', obj.accountId, {
        ...obj,
        createdAt: DateUtils.getDateStringForToday(),
        updateAt: DateUtils.getDateStringForToday(),
      });
    }
  }

  async confirmQuote(
    confirmQuoteReq: ConfirmQuoteReqDTO,
    auth0Id: string,
    accountId,
  ): Promise<ApiRespDTO<any>> {
    let cacheDataJSON = {
      ...confirmQuoteReq,
      response: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.trackUserActionService.setPortalActions(
      accountId,
      auth0Id,
      STEP5_SCREEN,
      CONFIRMED_ORDER,
      confirmQuoteReq.quoteId,
      '',
    );

    let confirmQuoteResp = new ApiRespDTO<any>();
    let contractId = await this.sfdcQuoteService.confirmQuote(confirmQuoteReq);
    await this.userService.updateCache('contract', auth0Id, { id: contractId }, accountId);
    if (contractId) {

      if(confirmQuoteReq.projectStatus == 'Inactive'){
        const projectId = confirmQuoteReq.projectId
        const projectStatus = confirmQuoteReq.projectStatus
        const updateStatusResponse = await this.sfdcProjectService.updateProjectStatus(projectId,projectStatus)
      }
     
      this.saveAccoutwiseIdsToFirestore({
        accountId: accountId,
        contracts: [contractId],
        auth0Id: auth0Id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      confirmQuoteResp = {
        success: true,
        status: 1000,
        message: 'Success',
        data: { ...confirmQuoteReq, quoteId: contractId },
      };
      cacheDataJSON.response = confirmQuoteResp;
      await this.cacheService.set(confirmQuoteReq.requestId, cacheDataJSON, TIMEMS_CACHE_REQUEST_FOR_QUOTE);
    } else {
      confirmQuoteResp = {
        success: false,
        status: 1005,
        message: 'Fail',
        data: {},
      };
      cacheDataJSON.response = confirmQuoteReq;
      await this.cacheService.set(confirmQuoteReq.requestId, cacheDataJSON, TIMEMS_CACHE_REQUEST_FOR_QUOTE);
    }
    return confirmQuoteResp;
  }
  getBundleFromProductDetails(productDetails: ProductDetails, productList: Product2[]): Bundle {
    const bundle = new Bundle();
    bundle.quantity = productDetails.bundleQty;
    // bundle product
    // TODO: change the front end to use product codes and change here
    const bundleSFDCProduct = productList.find((product) => product.Id === productDetails.productIdBundle);
    const bundleProductId = productDetails.productIdBundle;
    bundle.bundleProduct = this.mapProductIdToBundleProduct(bundleProductId, productList);
    // asset product
    const assetProductId = productDetails.productIdAsset;
    bundle.assetProduct = this.mapProductIdToBundleProduct(assetProductId, productList, bundleProductId);
    // service product
    const serviceProductId = productDetails.productIdService;
    bundle.serviceProduct = this.mapProductIdToBundleProduct(serviceProductId, productList, bundleProductId);
    // additional services/products
    bundle.additionalProducts = [];
    if (productDetails.additionalProduct) {
      productDetails.additionalProduct.map((additionalProduct) => {
        const additionalProductId = additionalProduct.productIdAS;
        const additionalProductObj = this.mapProductIdToBundleProduct(
          additionalProductId,
          productList,
          bundleProductId,
        );
        bundle.additionalProducts.push(additionalProductObj);
      });
    }
    // delivery product
    const deliverySFDCProductId = bundleSFDCProduct.SBQQ__Options__r.find((option) => {
      return (
        option.SBQQ__OptionalSKU__r.ProductType__c === 'P n D' && option.SBQQ__OptionalSKU__r.Name.startsWith('Del')
      );
    }).SBQQ__OptionalSKU__c;
    bundle.deliveryProduct = this.mapProductIdToBundleProduct(deliverySFDCProductId, productList, bundleProductId);
    // pickup product
    const pickupSFDCProductId = bundleSFDCProduct.SBQQ__Options__r.find((option) => {
      return (
        option.SBQQ__OptionalSKU__r.ProductType__c === 'P n D' && option.SBQQ__OptionalSKU__r.Name.startsWith('Pick')
      );
    }).SBQQ__OptionalSKU__c;
    bundle.pickupProduct = this.mapProductIdToBundleProduct(pickupSFDCProductId, productList, bundleProductId);
    return bundle;
  }
  mapProductIdToBundleProduct(
    productId: string,
    productList: Product2[],
    parentBundleProductId?: string,
  ): BundleProduct {
    const bundleProduct = new BundleProduct();
    const product = productList.find((product) => product.Id === productId);
    bundleProduct.id = product.Id;
    bundleProduct.name = product.Name;
    bundleProduct.summary = product.Asset_Summary__c;
    bundleProduct.productCode = product.ProductCode;
    bundleProduct.taxCode = product.AVA_SFCPQ__TaxCode__c;
    bundleProduct.chargeType = product.SBQQ__SubscriptionType__c === 'One-time' ? 'One-Time' : 'Recurring';
    bundleProduct.priceBookEntryId = product.PricebookEntries[0].Id;
    if (parentBundleProductId) {
      const bundleSFDCProduct = productList.find((product) => product.Id === parentBundleProductId);
      const opt = bundleSFDCProduct.SBQQ__Options__r.find((option) => option.SBQQ__OptionalSKU__r.Id === productId);
      bundleProduct.productOptionId = opt?.Id;
      bundleProduct.featureId = opt?.SBQQ__Feature__c;
      bundleProduct.productOptionType = opt?.SBQQ__Type__c;
    }
    return bundleProduct;
  }

  async getQuoteDocumentBody(quoteId: string, documentId: string, accountId: string,auth0Id:string): Promise<Blob> {
    this.trackUserActionService.setPortalActions(
      accountId,
      auth0Id,
      STEP1_SCREEN,
      DOWNLOADED_QUOTE_DOCUMENT,
      quoteId,
      '',
    );
    return await this.salesforceDocumentService.getDocumentBody(documentId);
  }

  private timeout(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async approveQuote(quoteId: string, auth0Id: string,accountId:string): Promise<ApiRespDTO<any>> {
    let approveQuoteResp = new ApiRespDTO<any>();
    this.trackUserActionService.setPortalActions(
      accountId,
      auth0Id,
      STEP5_SCREEN,
      APPROVED_QUOTE,
      quoteId,
      '',
    );
    const approveQuoteStatus = await this.sfdcQuoteService.approveQuote(quoteId);
    if (approveQuoteStatus) {
      approveQuoteResp = {
        success: true,
        status: 1000,
        message: 'Success',
        data: {},
      };
    } else {
      approveQuoteResp = {
        success: false,
        status: 1006,
        message: 'Fail',
        data: {},
      };
    }
    return approveQuoteResp;
  }

  async calculateTaxForQuoteModel(quoteModel: CPQ_QuoteModel): Promise<CPQ_QuoteModel> {
    const quote = await this.sfdcQuoteService.getQuoteDetailsForTaxCalc(quoteModel.record.Id);
    if (!quote) {
      throw new HttpException('Quote not found', 404);
    }
    const taxCalculationRequest = AvalaraSalesforceMapper.mapCPQQuoteModelToTaxCalculationRequest(quoteModel, quote);
    // calculate the tax
    const taxCalculationResponse = await this.avalaraService.calculateTax(taxCalculationRequest);
    // map the tax back to the quote and lines
    const quoteModelWithTax = AvalaraSalesforceMapper.mapAvalaraResponseToCPQQuoteModel(
      taxCalculationResponse,
      quoteModel,
    );
    return quoteModelWithTax;
  }

  async getQuoteDetailsById(quoteId: string): Promise<ApiRespDTO<GetQuoteDetailsRespDTO | object>> {
    try {
      const quoteDetails: SBQQ__Quote__c = await this.sfdcQuoteService.getQuoteDetails(quoteId);
      this.logger.info('quoteDetails: ' + JSON.stringify(quoteDetails));
      if (quoteDetails == null) {
        return {
          success: false,
          message: 'Quote not found',
          status: 1023,
          data: {},
        };
      }

      const getPaymentMethodIdFromFirestore = await this.firestoreService.getDocument('quotes', quoteId);
      let currentStatus = 0;
      // currentStatus =  this.getQuoteCurrentStatus(quoteDetails, currentStatus, getPaymentMethodIdFromFirestore);
      currentStatus = this.accountsServiceV2.getQuoteStatus(quoteDetails,getPaymentMethodIdFromFirestore)
      currentStatus = (currentStatus == 0 || currentStatus == 1) ? 1 : currentStatus
      this.logger.info('currentStatus: ' + currentStatus);
      let quoteResp = new GetQuoteDetailsRespDTO();

      quoteResp.paymentMethodId = getPaymentMethodIdFromFirestore
        ? getPaymentMethodIdFromFirestore.paymentMethodId
        : '';
      quoteResp.isAutoPay = getPaymentMethodIdFromFirestore ? getPaymentMethodIdFromFirestore.isAutoPay : true;
      quoteResp.quoteId = quoteDetails.Id;
      quoteResp.quoteName = quoteDetails.Name;
      quoteResp.currentStatus = currentStatus;
      quoteResp.startDate = quoteDetails.SBQQ__StartDate__c;
      quoteResp.endDate = quoteDetails.SBQQ__EndDate__c;
      quoteResp.createdDate = quoteDetails.CreatedDate;
      quoteResp.expiryDate = quoteDetails.SBQQ__ExpirationDate__c,
      quoteResp.duration = !quoteDetails.Duration__c ? '' : quoteDetails.Duration__c;
      let bundles: SBQQ__QuoteLine__c[] =
        quoteDetails.SBQQ__LineItems__r && quoteDetails.SBQQ__LineItems__r['records'].length > 0
          ? quoteDetails.SBQQ__LineItems__r['records'].filter(
              (lineItem: SBQQ__QuoteLine__c) => lineItem.Product_Type__c == 'Bundle',
            )
          : [];

      let lineItems: BundleDetails[] = [];
      this.getQuoteProductsDetails(bundles, lineItems);

      quoteResp.lineItems = lineItems;
      let docId = '';
      let docName = '';

      let byVersion = [];

      ({ byVersion, docId, docName } = this.getQuoteLatestDocumentVersion(quoteDetails, byVersion, docId));

      quoteResp.documentId = docId;
      quoteResp.documentName = docName;

      quoteResp.siteAddress = new SiteDetails();

      ////// data for step 3 ///////
      this.getQuoteSiteDetails(quoteDetails, quoteResp);
      let siteContactObj = new Contact();
      siteContactObj = this.getQuoteSiteContact(siteContactObj, quoteDetails);
      quoteResp.siteContact = siteContactObj;
      quoteResp.billingAddress = new BillingAddress();
      let billingAddressObj = this.getQuoteBillingAddress(quoteDetails);
      quoteResp.billingAddress = billingAddressObj;
      let billingContactObj = new Contact();
      billingContactObj = this.getQuoteBillingContact(billingContactObj, quoteDetails);
      quoteResp.billingContact = billingContactObj;
      quoteResp.poNumber = quoteDetails.Purchase_Order__r ? quoteDetails.Purchase_Order__r.Name : '';
      quoteResp.estimatedEndDate = quoteDetails.Estimated_End_Date__c;
      //for HTML quote data

      let quoteModel = await this.getQuoteHtmlModel(quoteId, new CPQ_QuoteModel());
      
      quoteModel.currentStatus = currentStatus;
      quoteResp.quoteModel = quoteModel;
      quoteModel.jobSites.filter((site) => {
        quoteModel.quoteLines.some((quoteLine) => {
          if (site.quoteLineId == quoteLine.quoteLineId) {
            let bundleId = quoteLine.product.id;
            let productArr = quoteModel.quoteLines.filter((line) => line.requiredBy == quoteLine.quoteLineId);
            let serviceDetails = productArr.filter((line) => line.productType == 'Service');
            let assetDetails = productArr.filter((line) => line.productType == 'Asset');
            let ancillaryServiceDetails = productArr.filter((line) => line.productType == 'Ancillary Services' ||line.productType == 'Ancillary Asset');

            site.productDetails = {
              bundleId: bundleId,
              assetId: assetDetails[0].product.id,
              serviceId: serviceDetails[0].product.id,
              bundleName: quoteLine.product.description,
              assetName: assetDetails[0].product.description,
              serviceName: serviceDetails[0].product.description,
              ancillaryServiceList: ancillaryServiceDetails.map((ancillaryService) => {
                return {
                  ancillaryServiceId: ancillaryService.product.id,
                  ancillaryServiceName: ancillaryService.product.description,
                };
              }),
              quantity: quoteLine.quantity,
            };
            site.contact = site.address.shipToContact;
          }
        });
      });
      return {
        success: true,
        message: 'Success',
        status: 1000,
        data: quoteResp,
      };
    } catch (err) {
      this.logger.error(err);
    }
  }

  private getQuoteBillingContact(billingContactObj: Contact, quoteDetails: SBQQ__Quote__c) {
    return quoteDetails.SBQQ__PrimaryContact__r
      ? {
          contactId: quoteDetails.SBQQ__PrimaryContact__r.Id,
          firstName: quoteDetails.SBQQ__PrimaryContact__r.FirstName,
          lastName: quoteDetails.SBQQ__PrimaryContact__r.LastName,
          phone: quoteDetails.SBQQ__PrimaryContact__r.Phone,
          email: quoteDetails.SBQQ__PrimaryContact__r.Email,
        }
      : new Contact();
    //return billingContactObj;
  }
  private getQuoteSecondaryContact(quoteDetails: SBQQ__Quote__c) {
    return quoteDetails.SecondaryBillToContact__r
      ? {
          contactId: quoteDetails.SecondaryBillToContact__r.Id,
          firstName: quoteDetails.SecondaryBillToContact__r.FirstName,
          lastName: quoteDetails.SecondaryBillToContact__r.LastName,
          phone: quoteDetails.SecondaryBillToContact__r.Phone,
          email: quoteDetails.SecondaryBillToContact__r.Email,
        }
      : new Contact();
    //return billingContactObj;
  }

  private getQuoteBillingAddress(quoteDetails: SBQQ__Quote__c) {
    return quoteDetails['Bill_To_Address__r']
      ? {
          addressId: quoteDetails['Bill_To_Address__r'].Id,
          address: quoteDetails['Bill_To_Address__r'].Name,
          city: quoteDetails['Bill_To_Address__r'].USF_City__c,
          state: quoteDetails['Bill_To_Address__r'].USF_State__c,
          zipcode: quoteDetails['Bill_To_Address__r'].USF_Zip_Code__c,
        }
      : new BillingAddress();
  }

  private getQuoteSiteContact(siteContactObj: Contact, quoteDetails: SBQQ__Quote__c) {
    return quoteDetails['SBQQ__PrimaryContact__r']
      ? {
          contactId: quoteDetails['SBQQ__PrimaryContact__r'].Id,
          firstName: quoteDetails['SBQQ__PrimaryContact__r'].FirstName,
          lastName: quoteDetails['SBQQ__PrimaryContact__r'].LastName,
          phone: quoteDetails['SBQQ__PrimaryContact__r'].Phone,
          email: quoteDetails['SBQQ__PrimaryContact__r'].Email,
        }
      : new Contact();
    //return siteContactObj;
  }

  private getQuoteSiteDetails(quoteDetails: SBQQ__Quote__c, quoteResp: GetQuoteDetailsRespDTO) {
    let siteDetails = SFDC_AddressMapper.getMyUSSAddressFromSFDCAddress(quoteDetails.Shipping_Address__r);
    siteDetails.addressId = quoteDetails.Shipping_Address__r.Id;
    quoteResp.siteAddress = siteDetails;
  }

  //any is used as version data type unkown
  private getQuoteLatestDocumentVersion(quoteDetails: SBQQ__Quote__c, byVersion: any[], docId: string) {

    let docName = '';
    if (quoteDetails['SBQQ__R00N70000001lX7YEAU__r']) {
      byVersion = quoteDetails['SBQQ__R00N70000001lX7YEAU__r']['records'].slice(0);
      docName = quoteDetails['SBQQ__R00N70000001lX7YEAU__r']['records'][0].Name;
      byVersion.sort(function (a, b) {
        return a.SBQQ__Version__c - b.SBQQ__Version__c;
      });
    }

    if (byVersion.length > 0) {
      docId = byVersion[byVersion.length - 1].SBQQ__DocumentId__c;
    }
    return { byVersion, docId, docName };
  }

  private getQuoteProductsDetails(bundles: SBQQ__QuoteLine__c[], lineItems: BundleDetails[]) {
    for (const bundle of bundles) {
      let bundleObj: BundleDetails = {
        bundleId: bundle.SBQQ__Product__r.Id,
        type: bundle.Product_Type__c,
        bundleName: bundle.SBQQ__Product__r.Name,
        bundleQty: bundle.SBQQ__Quantity__c,
        bundleProductCode: bundle.SBQQ__Product__r.ProductCode,
        serviceList: [],
        assetList: [],
        ancillaryServiceList: [],
        pAndDList: [],
      };
      if (bundle['SBQQ__Quote_Lines__r'] && bundle['SBQQ__Quote_Lines__r']['records'].length > 0) {
        // (bundle.SBQQ__LineItems__r.length > 0) {

        for (const product of bundle['SBQQ__Quote_Lines__r']['records']) {
          if (product.Product_Type__c == 'Asset') {
            bundleObj.assetList.push({
              id: product.SBQQ__Product__r.Id,
              assetName: product.SBQQ__Product__r.Description,
              assetProductCode: product.SBQQ__Product__r.ProductCode,
              assetOptionalId: product.SBQQ__ProductOption__r ? product.SBQQ__ProductOption__r['Id'] : null,
              //summary :"",// product.nam,
              quantity: product.SBQQ__Quantity__c,
            });
          } else if (product.Product_Type__c == 'Service') {
            bundleObj.serviceList.push({
              id: product.SBQQ__Product__r.Id,
              serviceName: product.SBQQ__Product__r.Description,
              serviceProductCode: product.SBQQ__Product__r.ProductCode,
              serviceOptionalId: product.SBQQ__ProductOption__r ? product.SBQQ__ProductOption__r['Id'] : null,
              quantity: product.SBQQ__Quantity__c,
            });
          } else if (product.Product_Type__c == 'Ancillary Services' || product.Product_Type__c == 'Ancillary Asset') {
            bundleObj.ancillaryServiceList.push({
              id: product.SBQQ__Product__r.Id,
              ancillaryServiceName: product.SBQQ__Product__r.Description,
              ancillaryServiceProductCode: product.SBQQ__Product__r.ProductCode,
              ancillaryServiceOptionalId: product.SBQQ__ProductOption__r ? product.SBQQ__ProductOption__r['Id'] : null,
              quantity: product.SBQQ__Quantity__c,
            });
          } else if (product.Product_Type__c == 'P n D') {
            bundleObj.pAndDList.push({
              id: product.SBQQ__Product__r.Id,
              pAndDServiceName: product.SBQQ__Product__r.Description,
              pAndDServiceNameProductCode: product.SBQQ__Product__r.ProductCode,
              quantity: product.SBQQ__Quantity__c,
            });
          }
        }
      }
      lineItems.push(bundleObj);
    }
  }

  private getQuoteCurrentStatus(
    quoteDetails: SBQQ__Quote__c,
    currentStatus: number,
    getPaymentDetailsFromFirestore: any,
  ) {
    if (quoteDetails.SBQQ__Status__c == 'Rejected') {
      currentStatus = 7; //Rejected
      return currentStatus;
    }

    if (quoteDetails.SBQQ__Status__c == 'Ordered') {
      currentStatus = 6;
      return currentStatus;
    }
    if (quoteDetails.SBQQ__Status__c == 'Archived') {
      currentStatus = 0;
    } else if (quoteDetails.SBQQ__Status__c == 'Draft') {
      currentStatus = 1;
    } else if (quoteDetails.SBQQ__Status__c == 'Presented') {
      currentStatus = 2;
    } else if (
      quoteDetails.SBQQ__Status__c == 'Approved' &&
      Boolean(quoteDetails.Site_Complete__c) == false &&
      Boolean(quoteDetails.Billing_Complete__c) == false
    ) {
      currentStatus = 3;
    } else if (
        quoteDetails.SBQQ__Status__c == 'Approved' &&
        ((quoteDetails.Payment_Method_Id__c != null && quoteDetails.AutoPay__c == false) ||
         (quoteDetails.Payment_Method_Id__c == null && quoteDetails.AutoPay__c == true)) &&
        Boolean(quoteDetails.Site_Complete__c) == true && getPaymentDetailsFromFirestore == null
      )
     {
      currentStatus = 4;
    } 
    else if(quoteDetails.SBQQ__Status__c == 'Approved' && quoteDetails.AutoPay__c == false &&
       quoteDetails.Payment_Method_Id__c == null && getPaymentDetailsFromFirestore == null && 
     Boolean(quoteDetails.Site_Complete__c) == true && Boolean(quoteDetails.Billing_Complete__c) == true ||
     (quoteDetails.AutoPay__c == true && quoteDetails.Payment_Method_Id__c != null && getPaymentDetailsFromFirestore == null)
   ){
     currentStatus = 4;
   }
    else if (
      quoteDetails.SBQQ__Status__c == 'Approved' &&
      ((getPaymentDetailsFromFirestore.paymentMethodId == null && quoteDetails.AutoPay__c == false) ||
      (getPaymentDetailsFromFirestore.paymentMethodId != null && quoteDetails.AutoPay__c == true)) &&
      Boolean(quoteDetails.Site_Complete__c) == true && Boolean(quoteDetails.Billing_Complete__c) == true
    ) {
      currentStatus = 5;
    }
   
    return currentStatus;
  }

  async handleCache<T>(
    requestId: string,
    reqBody: T,
    TIMEMS_CACHE_REQUEST_FOR_QUOTE: number,
  ): Promise<{ isEligibleForNewRequest: boolean; resp: ApiRespDTO<any> }> {
    const cacheDataJSON = {
      reqBody,
      response: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    let updatedResp = new ApiRespDTO<any>();

    let cacheData = await this.cacheService.get<string>(requestId);

    if (cacheData) {
      // Existing request
      let requestData = JSON.parse(JSON.stringify(cacheData));
      let cacheResponse = requestData.response;

      if (!cacheResponse) {
        // Response in progress
        updatedResp = {
          success: false,
          status: 1018,
          message: 'Please wait, your previous request is in process.',
          data: {},
        };
        return { resp: updatedResp, isEligibleForNewRequest: false };
      }

      return { resp: { ...cacheResponse, ...requestData.reqBody }, isEligibleForNewRequest: false };
    } else {
      // New request
      await this.cacheService.set(requestId, cacheDataJSON, TIMEMS_CACHE_REQUEST_FOR_QUOTE);
      // response for eligible for new request
      updatedResp = {
        success: true,
        status: 1000,
        message: 'eligible for new request',
        data: {},
      };
      return { resp: updatedResp, isEligibleForNewRequest: true };
    }
  }

}

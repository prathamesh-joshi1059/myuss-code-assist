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
    private accountsServiceV2: AccountsServiceV2
  ) {
    this.useStandalonePricing = this.configService.get('USE_STANDALONE_PRICING_ENGINE') === 'true';
  }

  public async createInitialQuote(
    createQuoteRequest: CreateInitialQuoteReqDTO,
    accountId: string,
    auth0Id: string,
  ): Promise<ApiRespDTO<object>> {
    let quoteResult: ApiRespDTO<object> = { success: false, status: 0, message: '', data: {} };
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
        let requestData = JSON.parse(JSON.stringify(cacheData));
        let checkResponse = requestData.response;

        if (checkResponse) {
          return checkResponse;
        } else {
          return {
            success: false,
            status: 1018,
            message: 'Please wait, saving your site address.',
            data: {},
          };
        }
      } else {
        await this.cacheService.set(createQuoteRequest.requestId, cacheDataJSON, TIMEMS_CACHE_REQUEST_FOR_QUOTE);
      }

      this.logger.info(`starting at: ${new Date()}`);
      let poId = '';
      let addressId: string;

      const [standardPricebook, serviceableZipResult] = await Promise.all([
        this.productsService.getStandardPricebook(),
        this.sfdcServiceableZipCodeService.checkServiceableZipcode(createQuoteRequest.zipcode),
      ]);

      if (!serviceableZipResult) {
        quoteResult = {
          success: false,
          status: 1007,
          message: 'This ZIP code is not currently eligible for web orders. Please call 1-800-TOILETS to speak with a representative.',
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
      const opportunityPromise = this.sfdcQuoteService.createOpportunity(opportunity);
      let addAddressPromise;

      if (createQuoteRequest.addressExist) {
        addressId = createQuoteRequest.addressId;
        const addressDetails: Address = await this.sfdcQuoteService.getAddressDetailsById(createQuoteRequest.addressId);
        let updateFlag = !addressDetails.isShippingAddress || !addressDetails.siteName;

        if (updateFlag) {
          addAddressPromise = this.sfdcQuoteService.updateAddressDetails(createQuoteRequest.addressId, addressDetails.street);
        }
      } else {
        const addAddressDetailsModel = this.addressDetailsData(createQuoteRequest);
        addAddressPromise = this.sfdcAddressService.createAddress(addAddressDetailsModel);
      }

      const [opportunityResult, addressResult] = await Promise.all([
        opportunityPromise,
        addAddressPromise  
      ]);

      const quoteRequestModel = this.quoteRequestData(
        opportunityResult,
        poId,
        addressResult ? addressResult.id : addressId,
        createQuoteRequest,
        pricebookId,
        serviceableZipCode,
        quoteName,
      );

      const createQuoteRespPromise = this.sfdcQuoteService.createQuote(quoteRequestModel);
      const [createQuoteResp] = await Promise.all([createQuoteRespPromise]);

      const resp = {
        quoteId: createQuoteResp.Id,
        quoteName: createQuoteResp.Name,
        addressId: addressResult ? addressResult.id : addressId,
      };
      this.logger.info(`ending at: ${new Date()}`);

      if (resp.quoteId) {
        this.logger.info(`quote created at ${new Date()}: ${resp}`);
        quoteResult = { success: true, status: 1000, data: resp };
        await this.saveAccoutwiseIdsToFirestore({
          accountId: createQuoteRequest.accountId,
          quotes: [createQuoteResp.Id],
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
    quoteRequestModel.SBQQ__Opportunity2__c = opportunityResult.id;
    quoteRequestModel.Purchase_Order__c = poId;
    quoteRequestModel.Shipping_Address__c = addressId; 
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
    quoteRequestModel.Payment_Mode__c = QUOTE_PAYMENT_MODE;
    quoteRequestModel.PreOrder_Flow_Complete__c = false;
    quoteRequestModel.Site_Complete__c = false;
    quoteRequestModel.Billing_Approval_Status__c = QUOTE_BILLING_APPROVAL_STATUS;
    quoteRequestModel.isCheckPaymentMethod__c = false;
    quoteRequestModel.Fuel_Surcharge_Percent__c = FUEL_SURCHARGE_PERCENT__C;
    quoteRequestModel.Quoted_Jobsites__c = false;
    return quoteRequestModel;
  }

  private addressDetailsData(createQuoteRequest: CreateInitialQuoteReqDTO): USF_Address__c {
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

  private createOpportunityData(createQuoteRequest: CreateInitialQuoteReqDTO): Opportunity {
    let opportunity = new Opportunity();
    opportunity.AccountId = createQuoteRequest.accountId;
    opportunity.Name = `Opportunity_${new Date().toISOString()}`;
    opportunity.StageName = OPPORTUNITY_STAGE;
    opportunity.Amount = OPPORTUNITY_AMOUNT;
    opportunity.CloseDate = new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    opportunity.LeadSource = OPPORTUNITY_LEAD_SOURCE;
    opportunity.USF_Bill_To_Account__c = createQuoteRequest.accountId;
    opportunity.USF_Start_Date__c = new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    opportunity.USF_End_Date__c = DEFAULT_END_DATE;
    opportunity.USF_Order_Type__c = createQuoteRequest.orderType;
    opportunity.USF_Primary_Contact__c = createQuoteRequest.contactId;
    opportunity.USS_Product_Categories__c = USS_Product_Categories;
    opportunity.USF_Project__c = createQuoteRequest.projectId;
    return opportunity;
  }

  public async addProductAndSave(
    addProductRequest: AddProductAndCalculateReqDTO,
    auth0Id: string,
    accountId: string
  ): Promise<ApiRespDTO<any>> {
    let addProductAndSaveResp: ApiRespDTO<any> = { success: false, status: 0, message: '', data: {} };
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

      addProductRequest.productDetails.forEach((product, index) => {
        if (product.additionalProduct && product.additionalProduct.length > 0) {
          product.additionalProduct.forEach((additionalProduct, count) => {
            product[`productIdAS_${count + 1}`] = additionalProduct.productIdAS;
            product[`productOptionSkuAS_${count + 1}`] = additionalProduct.productOptionSkuAS;
            product[`aSSummery_${count + 1}`] = additionalProduct.aSSummery;
          });
        }
      });

      const productList = await this.productsService.getProducts();
      const bundles: Bundle[] = addProductRequest.productDetails.map(productDetail => this.getBundleFromProductDetails(productDetail, productList));

      const quoteModel = this.createQuoteModelFromBundles(addProductRequest, bundles, this.createCartLevelQuoteLines(addProductRequest, productList));
      quoteModel.record.Id = addProductRequest.quoteId;
      quoteModel.record.SBQQ__StartDate__c = addProductRequest.startDate;
      quoteModel.record.SBQQ__EndDate__c = addProductRequest.endDate;
      quoteModel.record.Duration__c = addProductRequest.duration;
      quoteModel.record.Order_Type__c = addProductRequest.orderType;
      quoteModel.record.SBQQ__Status__c = 'Draft';
      if (addProductRequest.orderType !== "Recurring Service") {
        quoteModel.record.Estimated_End_Date__c = addProductRequest.estimatedEndDate;
      } else {
        quoteModel.record.Estimated_End_Date__c = null;
      }

      await this.sfdcCPQService.saveQuoteAndDeleteExistingLines(quoteModel);

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
    auth0Id: string,
    quoteHtml: string = 'false',
  ): Promise<ApiRespDTO<any>> {
    this.trackUserActionService.setPortalActions(
      accountId,
      auth0Id,
      STEP1_SCREEN,
      REQUESTED_QUOTE_PRICING,
      quoteId,
      '',
    );

    this.quoteHtml = quoteHtml === 'true';
    return this.useStandalonePricing
      ? this.calculateAndSavePriceAndTaxStandalone(quoteId)
      : this.calculateAndSavePriceAndTaxCPQ(quoteId);
  }

  public async calculateAndSavePriceAndTaxCPQ(quoteId: string): Promise<ApiRespDTO<any>> {
    let quoteModel: QuoteModel = new QuoteModel();
    try {
      this.logger.info(`starting getQuoteFromCPQ at ${new Date()}: ${quoteId}`);
      const quote = await this.sfdcQuoteService.getQuoteFromCPQ(quoteId);
      if (!quote.record.Enable_Server_Side_Pricing_Calculation__c) {
        quote.record.Enable_Server_Side_Pricing_Calculation__c = true;
        await this.sfdcQuoteService.enableServerSidePricingCalculation(quoteId);
      }
      this.logger.info(`finished getQuoteFromCPQ at ${new Date()}: ${quoteId}`);
      this.logger.info(`starting calculateQuote at ${new Date()}: ${quoteId}`);
      const calculatedQuote = await this.sfdcQuoteService.calculateQuote(quote);
      this.logger.info(`finished calculateQuote at ${new Date()}: ${quoteId}`);
      this.logger.info(`starting calculateTax at ${new Date()}: ${quoteId}`);
      const calculatedQuoteWithTax = await this.calculateTaxForQuoteModel(calculatedQuote);
      this.logger.info(`finished calculateTax at ${new Date()}: ${quoteId}`);
      
      if (this.quoteHtml) {
        calculatedQuoteWithTax.setFormulaFieldValues();
        calculatedQuoteWithTax.setQuoteRollupFields();

        this.logger.info(`starting Quote HTML Model at ${new Date()}: ${quoteId}`);
        quoteModel = await this.getQuoteHtmlModel(quoteId, calculatedQuoteWithTax);
        this.logger.info(`finished Quote HTML Model at ${new Date()}: ${quoteId}`);
        
        calculatedQuoteWithTax.record.SBQQ__Status__c = 'Presented';
        quoteModel.status = 'Presented';
      } else {
        quoteModel.quoteId = calculatedQuoteWithTax.record.Id;
      }

      this.logger.info(`starting quote save at ${new Date()}: ${quoteId}`);
      const saveQuoteWithTax = await this.sfdcCPQService.saveQuoteCPQ(calculatedQuoteWithTax);
      this.logger.info(`finished quote save at ${new Date()}: ${quoteId}`);
      return saveQuoteWithTax
        ? { success: true, status: 1000, data: { quoteModel: quoteModel } }
        : { success: false, status: 1025, message: 'Error in saving CPQ tax', data: {} };
    } catch (error) {
      this.logger.error(error);
      return { success: false, status: 1025, message: error.message, data: {} };
    }
  }

  public async calculateAndSavePriceAndTaxStandalone(quoteId: string): Promise<ApiRespDTO<any>> {
    let quoteModel: QuoteModel = new QuoteModel();
    try {
      this.logger.info(`starting getQuoteFromCPQ at ${new Date()}: ${quoteId}`);
      const uncalculatedQuote = await this.sfdcQuoteService.getQuoteFromCPQ(quoteId);
      this.logger.info(`finished getQuoteFromCPQ at ${new Date()}: ${quoteId}`);
      this.logger.info(`starting calculateQuote at ${new Date()}: ${quoteId}`);
      const calculatedQuote = await this.sfdcCPQService.calculateQuote(uncalculatedQuote);
      this.logger.info(`finished calculateQuote at ${new Date()}: ${quoteId}`);
      this.logger.info(`starting calculateTax at ${new Date()}: ${quoteId}`);
      const calculatedQuoteWithTax = await this.calculateTaxForQuoteModel(calculatedQuote);
      this.logger.info(`finished calculateTax at ${new Date()}: ${quoteId}`);

      if (this.quoteHtml) {
        calculatedQuoteWithTax.setFormulaFieldValues();
        calculatedQuoteWithTax.setQuoteRollupFields();
        
        this.logger.info(`starting Quote HTML Model at ${new Date()}: ${quoteId}`);
        quoteModel = await this.getQuoteHtmlModel(quoteId, calculatedQuoteWithTax);
        this.logger.info(`finished Quote HTML Model at ${new Date()}: ${quoteId}`);
        
        calculatedQuoteWithTax.record.SBQQ__Status__c = 'Presented';
        quoteModel.status = 'Presented';
      } else {
        quoteModel.quoteId = calculatedQuoteWithTax.record.Id;
      }

      this.logger.info(`starting quote save at ${new Date()}: ${quoteId}`);
      const savecalculatedQuoteWithTax = await this.sfdcCPQService.saveQuote(calculatedQuoteWithTax);
      this.logger.info(`finished quote save at ${new Date()}: ${quoteId}`);
      return savecalculatedQuoteWithTax
        ? { success: true, status: 1000, data: { quoteModel: quoteModel } }
        : { success: false, status: 1024, message: 'Error in saving standalone tax', data: {} };
    } catch (error) {
      this.logger.error(error);
      return { success: false, status: 1024, message: error.message, data: {} };
    }
  }

  public async getQuoteHtmlModel(quoteId: string, cpqQuoteModel: CPQ_QuoteModel): Promise<QuoteModel> {
    let quoteModel: QuoteModel = new QuoteModel();
    try {
      let sfdcQuote: SBQQ__Quote__c = await this.sfdcQuoteService.getQuoteDetailsById(quoteId);
      let getPaymentMethodIdFromFirestore = await this.firestoreService.getDocument('quotes', quoteId);

      if (cpqQuoteModel.hasOwnProperty('record')) {
        sfdcQuote.One_Time_Subtotal__c = cpqQuoteModel.record.One_Time_Subtotal__c;
        sfdcQuote.One_Time_Tax__c = cpqQuoteModel.record.One_Time_Tax__c;
        sfdcQuote.One_Time_Total__c = cpqQuoteModel.record.One_Time_Total__c;
        sfdcQuote.Recurring_Subtotal__c = cpqQuoteModel.record.Recurring_Subtotal__c;
        sfdcQuote.Recurring_Tax__c = cpqQuoteModel.record.Recurring_Tax__c;
        sfdcQuote.Recurring_Total__c = cpqQuoteModel.record.Recurring_Total__c;
        const updatedLineItems = sfdcQuote.SBQQ__LineItems__r['records'].map((oldItem) => {
          const newItem = cpqQuoteModel.lineItems.find((newItem) => newItem.record.Id === oldItem.Id).record;
          if (newItem.SBQQ__Product__r == null) {
            newItem.SBQQ__Product__r = oldItem.SBQQ__Product__r;
          }
          return newItem ? { ...oldItem.record, ...newItem } : oldItem;
        });
        sfdcQuote.SBQQ__LineItems__r['records'] = updatedLineItems;
      }

      quoteModel = SFDC_QuoteMapper.getMyUSSQuoteModeFromCPQ(sfdcQuote);
      quoteModel.isAutoPay = getPaymentMethodIdFromFirestore ? getPaymentMethodIdFromFirestore.isAutoPay : true;
      quoteModel.currentStatus = this.accountsServiceV2.getQuoteStatus(sfdcQuote,getPaymentMethodIdFromFirestore)

    } catch (error) {
      this.logger.error(error);
    }

    return quoteModel;
  }

  private createCartLevelQuoteLines(
    addProductRequest: AddProductAndCalculateReqDTO,
    productList: Product2[],
  ): SBQQ__QuoteLine__c[] {
    const cartLevelQuoteLines: SBQQ__QuoteLine__c[] = [];

    const cartLevelPickupProduct = productList.find(product =>
      product.ProductType__c === 'P n D' &&
      product.Asset_Summary__c.startsWith('Cart-level') &&
      product.Name.startsWith('Pick')
    );

    const quoteLinePickupCartModel = new SBQQ__QuoteLine__c();
    quoteLinePickupCartModel.SBQQ__Quote__c = addProductRequest.quoteId;
    quoteLinePickupCartModel.SBQQ__Bundle__c = false;
    quoteLinePickupCartModel.SBQQ__StartDate__c = addProductRequest.startDate;
    quoteLinePickupCartModel.SBQQ__EndDate__c = addProductRequest.endDate;
    quoteLinePickupCartModel.SBQQ__Product__c = cartLevelPickupProduct.Id;
    quoteLinePickupCartModel.SBQQ__PricebookEntryId__c = cartLevelPickupProduct.PricebookEntries[0].Id;
    quoteLinePickupCartModel.SBQQ__SubscriptionPricing__c = SBQQ__SUBSCRIPTIONPRICING__C;
    quoteLinePickupCartModel.SBQQ__Quantity__c = 1; 
    quoteLinePickupCartModel.Sort_Order__c = this.generateSortOrder(2, 5);
    quoteLinePickupCartModel.USF_Address__c = addProductRequest.addressId;

    cartLevelQuoteLines.push(quoteLinePickupCartModel);

    const cartLevelDeliveryProduct = productList.find(product =>
      product.ProductType__c === 'P n D' &&
      product.Asset_Summary__c.startsWith('Cart-level') &&
      product.Name.startsWith('Del')
    );

    const quoteLineDeliveryCartModel = new SBQQ__QuoteLine__c();
    quoteLineDeliveryCartModel.SBQQ__Quote__c = addProductRequest.quoteId;
    quoteLineDeliveryCartModel.SBQQ__Bundle__c = false;
    quoteLineDeliveryCartModel.SBQQ__StartDate__c = addProductRequest.startDate;
    quoteLineDeliveryCartModel.SBQQ__EndDate__c = addProductRequest.endDate;
    quoteLineDeliveryCartModel.SBQQ__Product__c = cartLevelDeliveryProduct.Id;
    quoteLineDeliveryCartModel.SBQQ__PricebookEntryId__c = cartLevelDeliveryProduct.PricebookEntries[0].Id;
    quoteLineDeliveryCartModel.SBQQ__SubscriptionPricing__c = SBQQ__SUBSCRIPTIONPRICING__C;
    quoteLineDeliveryCartModel.SBQQ__Quantity__c = 1; 
    quoteLineDeliveryCartModel.Sort_Order__c = this.generateSortOrder(1, 5);
    quoteLineDeliveryCartModel.USF_Address__c = addProductRequest.addressId;

    cartLevelQuoteLines.push(quoteLineDeliveryCartModel);
    return cartLevelQuoteLines;
  }

  private generateSortOrder(key: number, startDigit?: number): string {
    let sortOrderNumber = key * 100000;
    let sortOrder = sortOrderNumber.toString().padStart(14, '0');
    if (startDigit) {
      sortOrder = startDigit + sortOrder.substring(startDigit.toString().length, sortOrder.length);
    }
    return sortOrder;
  }

  private async handleCache<T>(
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

    let updatedResp: ApiRespDTO<any>;

    let cacheData = await this.cacheService.get<string>(requestId);

    if (cacheData) {
      let requestData = JSON.parse(JSON.stringify(cacheData));
      let cacheResponse = requestData.response;

      if (!cacheResponse) {
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
      await this.cacheService.set(requestId, cacheDataJSON, TIMEMS_CACHE_REQUEST_FOR_QUOTE);
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
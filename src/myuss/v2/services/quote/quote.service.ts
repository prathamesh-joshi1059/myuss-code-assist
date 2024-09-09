import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AvalaraCalculateTaxService } from "../../../../backend/avalara/services/calculate-tax/calculate-tax.service";
import { FirestoreService } from "../../../../backend/google/firestore/firestore.service";
import { CPQ_QuoteLineModel, CPQ_QuoteModel } from "../../../../backend/sfdc/model/cpq/QuoteModel";
import { NF_Quoted_Jobsite__c } from "../../../../backend/sfdc/model/NF_Quoted_Jobsite__c";
import { Opportunity } from "../../../../backend/sfdc/model/Opportunity";
import { Product2 } from "../../../../backend/sfdc/model/Product2";
import { SBQQ__QuoteLine__c } from "../../../../backend/sfdc/model/SBQQ__QuoteLine__c";
import { SBQQ__Quote__c } from "../../../../backend/sfdc/model/SBQQ__Quote__c";
import { USF_Address__c } from "../../../../backend/sfdc/model/USF_Address__c";
import { SfdcCpqService } from "../../../../backend/sfdc/services/cpq/sfdc-cpq.service";
import { SfdcAddressService } from "../../../../backend/sfdc/services/sfdc-address/sfdc-address.service";
import { SfdcDocumentService } from "../../../../backend/sfdc/services/sfdc-document/sfdc-document.service";
import { SfdcProjectService } from "../../../../backend/sfdc/services/sfdc-project/sfdc-project.service";
import { SfdcQuoteService } from "../../../../backend/sfdc/services/sfdc-quote/sfdc-quote.service";
import { SfdcServiceableZipCodeService } from "../../../../backend/sfdc/services/sfdc-serviceable-zip-code/sfdc-serviceable-zip-code.service";
import { ApiRespDTO } from "../../../../common/dto/api-resp.dto";
import { CacheService } from "../../../../core/cache/cache.service";
import { LoggerService } from "../../../../core/logger/logger.service";
import { TrackUserActionService } from "../../../../core/track-user-action/track-user-action-service";
import { DEFAULT_END_DATE, OPPORTUNITY_AMOUNT, OPPORTUNITY_LEAD_SOURCE, OPPORTUNITY_STAGE, USS_Product_Categories,TIMEMS_CACHE_REQUEST_FOR_QUOTE, QUOTE_INVOICE_DELIVERY_METHOD, QUOTE_PAYMENT_MODE, QUOTE_BILLING_APPROVAL_STATUS, FUEL_SURCHARGE_PERCENT__C, SBQQ__SUBSCRIPTIONPRICING__C, QUOTELINESERVICE_QUANTITYUNITOFMEASURE__C } from "../../../../core/utils/constants";
import { DateUtils } from "../../../../core/utils/date-utils";
import { CREATE_QUOTE, STEP0_SCREEN, STEP1_SCREEN, UPDATED_CART } from "../../../../core/utils/user-event-messages";
import { SFDC_QuoteMapper } from "../../../../myuss/mappers/salesforce/quote.mapper";
import { Bundle, BundleDetails, BundleProduct, QuoteLinesModel, SfdcRespModel } from "../../../../myuss/models";
import { Address, BillingAddress, SiteDetails } from "../../../../myuss/models/address.model";
import { ProductsService } from "../../../../myuss/services/products/products.service";
import { UserService } from "../../../../myuss/services/user/user.service";
import { AddProductAndCalculateReqDTO, ProductDetails } from "../../controllers/quote/dto/add-product-calculate-req.dto";
import { CreateInitialQuoteReqDTO } from "../../controllers/quote/dto/create-initial-quote-req.dto";
import { AccountsServiceV2 } from "../accounts/accounts.service";
import { GetQuoteDetailsRespDTO } from "../../../../myuss/controllers/quote/dto/get-quote-details-resp.dto";
import { QuoteService } from "../../../../myuss/services/quote/quote.service";
import { Contact } from "../../../models/contact.model";
// import {}

@Injectable()
export class QuoteServiceV2 {
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
    private accountsServiceV2: AccountsServiceV2,
    private quoteService: QuoteService
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
    
    
      let quoteRequestModel;
     if(createQuoteRequest.id == ""){
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
          quoteRequestModel = await this.quoteRequestData(
            opportunityResult,
            poId,
            addressResult? addressResult.id : addressId,
            createQuoteRequest,
            pricebookId,
            serviceableZipCode,
            quoteName,
          );
     }else{
       // set quote fields
        quoteRequestModel = await this.updateQuoteRequestData(
         createQuoteRequest,
      );
     }

      // create quote
      const createQuoteRespPromise =  this.sfdcQuoteService.createQuote(quoteRequestModel);
      const [createQuoteResp] = await Promise.all([createQuoteRespPromise]);
      this.logger.info("createQuoteResp");
      this.logger.info(createQuoteResp);
      const quoteModel = await SFDC_QuoteMapper.getMyUSSQuoteModeFromCPQ(createQuoteResp);

     
      this.logger.info(`ending at: ${new Date()}`);
      let quoteArray = [];
      quoteArray.push(createQuoteResp.Id);
      if (quoteModel.quoteId) {
        quoteResult = { success: true, status: 1000, data: quoteModel,message:"success"};
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

  private async quoteRequestData(
    opportunityResult: SfdcRespModel,
    poId: string,
    addressId: string,
    createQuoteRequest: CreateInitialQuoteReqDTO,
    pricebookId: string,
    serviceableZipCode: string,
    quoteName: string,
  ): Promise<SBQQ__Quote__c> {
    const quoteRequestModel = new SBQQ__Quote__c();
    // Name: quoteName,
    quoteRequestModel.Id = createQuoteRequest.id;
    quoteRequestModel.SBQQ__Opportunity2__c = opportunityResult.id;
    quoteRequestModel.Purchase_Order__c = poId;
    quoteRequestModel.Shipping_Address__c = addressId; //* */
    quoteRequestModel.SBQQ__Account__c = createQuoteRequest.accountId;
    quoteRequestModel.SBQQ__StartDate__c = DateUtils.getDateStringForDaysFromToday(2);
    quoteRequestModel.SBQQ__EndDate__c = DEFAULT_END_DATE;
    quoteRequestModel.SBQQ__PriceBook__c = pricebookId;
    quoteRequestModel.SBQQ__PricebookId__c = pricebookId;
    quoteRequestModel.SBQQ__Primary__c = true;
    quoteRequestModel.Bill_Timing__c = "Bill in Advance";
    quoteRequestModel.Billing_Period__c = "28 Day Bill Period";
    quoteRequestModel.Customer_Type__c = createQuoteRequest.customerType;
    quoteRequestModel.Business_Type__c = createQuoteRequest.businessType;
    quoteRequestModel.Decline_Damage_Waiver__c = true;
    quoteRequestModel.Serviceable_Zip_Code__c = serviceableZipCode;
    quoteRequestModel.Order_Type__c = createQuoteRequest.orderType;
    quoteRequestModel.Quote_Name__c = createQuoteRequest.quoteName;
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
   quoteRequestModel.SBQQ__StartDate__c = createQuoteRequest.startDate;
   quoteRequestModel.SBQQ__EndDate__c = createQuoteRequest.endDate;
   quoteRequestModel.Duration__c = createQuoteRequest.duration;
   quoteRequestModel.Order_Type__c = createQuoteRequest.orderType;
   quoteRequestModel.SBQQ__Status__c = 'Draft';
   if(createQuoteRequest.orderType != "Recurring Service"){
    quoteRequestModel.Estimated_End_Date__c = createQuoteRequest.estimatedEndDate;
   }else{
    quoteRequestModel.Estimated_End_Date__c = null;
   }

   const updateSiteContactResp = await this.sfdcQuoteService.updateSiteContactV2(
    createQuoteRequest,
  );
  quoteRequestModel.SBQQ__PrimaryContact__c = updateSiteContactResp.id;

  
    return quoteRequestModel;
  }


  private async updateQuoteRequestData(
    createQuoteRequest: CreateInitialQuoteReqDTO,
  ): Promise<SBQQ__Quote__c> {
    const quoteRequestModel = new SBQQ__Quote__c();
  quoteRequestModel.Id = createQuoteRequest.id;
  quoteRequestModel.SBQQ__Account__c = createQuoteRequest.accountId;
  quoteRequestModel.SBQQ__StartDate__c = DateUtils.getDateStringForDaysFromToday(2);
  quoteRequestModel.Order_Type__c = createQuoteRequest.orderType;
  quoteRequestModel.Quote_Name__c = createQuoteRequest.quoteName;
  quoteRequestModel.SBQQ__StartDate__c = createQuoteRequest.startDate;
  quoteRequestModel.SBQQ__EndDate__c = createQuoteRequest.endDate;
  quoteRequestModel.Duration__c = createQuoteRequest.duration;
  quoteRequestModel.SBQQ__Status__c = 'Draft';
   if(createQuoteRequest.orderType != "Recurring Service"){
    quoteRequestModel.Estimated_End_Date__c = createQuoteRequest.estimatedEndDate;
   }else{
    quoteRequestModel.Estimated_End_Date__c = null;
   }

   const updateSiteContactResp = await this.sfdcQuoteService.updateSiteContactV2(
    createQuoteRequest,
  );
  quoteRequestModel.SBQQ__PrimaryContact__c = updateSiteContactResp.id;

  
    return quoteRequestModel;
  }

  public async addProductAndSave(
    addProductRequest: AddProductAndCalculateReqDTO,
    auth0Id,
    accountId
  ): Promise<ApiRespDTO<Object>> {
    let addProductAndSaveResp = new ApiRespDTO<Object>();
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
      q.Shipping_Address__c = addProductRequest.addressId;
     

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
      quoteModel.record.SBQQ__Status__c = 'Draft';
     

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

  async getQuoteDetailsById(quoteId: string): Promise<ApiRespDTO<GetQuoteDetailsRespDTO | object>> {
    try {
      const quoteModel = await this.quoteService.getQuoteHtmlModel(quoteId, new CPQ_QuoteModel())
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
        data: {
          quoteModel
        }
      };
    } catch (err) {
      this.logger.error(err);
      return {
        success: false,
        message: 'fail',
        status: 1006,
        data: { }
      }
    }
  }
}
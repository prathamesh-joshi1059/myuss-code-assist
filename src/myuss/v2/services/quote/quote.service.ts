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
import { DEFAULT_END_DATE, OPPORTUNITY_AMOUNT, OPPORTUNITY_LEAD_SOURCE, OPPORTUNITY_STAGE, USS_Product_Categories, TIMEMS_CACHE_REQUEST_FOR_QUOTE, QUOTE_INVOICE_DELIVERY_METHOD, QUOTE_PAYMENT_MODE, QUOTE_BILLING_APPROVAL_STATUS, FUEL_SURCHARGE_PERCENT__C, SBQQ__SUBSCRIPTIONPRICING__C, QUOTELINESERVICE_QUANTITYUNITOFMEASURE__C } from "../../../../core/utils/constants";
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

@Injectable()
export class QuoteServiceV2 {
  private useStandalonePricing: boolean;
  private quoteHtml: boolean;

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
    const cacheDataJSON = {
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

      const cacheData = await this.cacheService.get<string>(createQuoteRequest.requestId);
      if (cacheData) {
        // existing request
        const requestData = JSON.parse(JSON.stringify(cacheData));
        const checkResponse = requestData.response;
        if (checkResponse) {
          // response completed
          return checkResponse;
        } else {
          // response in progress
          return {
            success: false,
            status: 1018,
            message: 'Please wait, saving your site address.',
            data: {},
          };
        }
      } else {
        // new request
        await this.cacheService.set(createQuoteRequest.requestId, cacheDataJSON, TIMEMS_CACHE_REQUEST_FOR_QUOTE);
      }

      let quoteRequestModel;
      if (createQuoteRequest.id === "") {
        // this.logger.info(`starting at: ${new Date()}`);
        const poId = '';
        let addressId: string;

        this.logger.info(`starting at: ${new Date()}`);
        // Concurrently fetch standard pricebook and check serviceable zipcode
        const [standardPricebook, serviceableZipResult] = await Promise.all([
          this.productsService.getStandardPricebook(),
          this.sfdcServiceableZipCodeService.checkServiceableZipcode(createQuoteRequest.zipcode),
        ]);

        if (!serviceableZipResult) {
          return this.handleServiceableZipCodeError(createQuoteRequest.requestId, cacheDataJSON);
        }

        const pricebookId = standardPricebook.Id;
        const serviceableZipCode = serviceableZipResult.Id;
        const quoteName = `MyUSS Quote ${new Date().toISOString()}`;

        const opportunity = this.createOpportunityData(createQuoteRequest);
        // create Opportunity
        const opportunityPromise = this.sfdcQuoteService.createOpportunity(opportunity);
        let addAddressPromise;

        if (createQuoteRequest.addressExist) {
          addressId = createQuoteRequest.addressId;
          const addressDetails: Address = await this.sfdcQuoteService.getAddressDetailsById(createQuoteRequest.addressId);
          const updateFlag = !addressDetails.isShippingAddress || !addressDetails.siteName;

          if (updateFlag) {
            addAddressPromise = this.sfdcQuoteService.updateAddressDetails(
              createQuoteRequest.addressId,
              addressDetails.street,
            );
          }
        } else {
          // create address
          const addAddressDetailsModel = this.addressDetailsData(createQuoteRequest);
          addAddressPromise = this.sfdcAddressService.createAddress(addAddressDetailsModel);
        }

        const [opportunityResult, addressResult] = await Promise.all([opportunityPromise, addAddressPromise]);

        // set quote fields
        quoteRequestModel = await this.quoteRequestData(
          opportunityResult,
          poId,
          addressResult ? addressResult.id : addressId,
          createQuoteRequest,
          pricebookId,
          serviceableZipCode,
          quoteName,
        );
      } else {
        // set quote fields
        quoteRequestModel = await this.updateQuoteRequestData(createQuoteRequest);
      }

      const createQuoteRespPromise = this.sfdcQuoteService.createQuote(quoteRequestModel);
      const [createQuoteResp] = await Promise.all([createQuoteRespPromise]);
      this.logger.info("createQuoteResp");
      this.logger.info(createQuoteResp);
      const quoteModel = await SFDC_QuoteMapper.getMyUSSQuoteModeFromCPQ(createQuoteResp);

      this.logger.info(`ending at: ${new Date()}`);
      const quoteArray = [createQuoteResp.Id];

      if (quoteModel.quoteId) {
        quoteResult = { success: true, status: 1000, data: quoteModel, message: "success" };
        await this.saveAccoutwiseIdsToFirestore({
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

  private handleServiceableZipCodeError(requestId: string, cacheDataJSON: any) {
    const quoteResult = {
      success: false,
      status: 1007,
      message: 'This ZIP code is not currently eligible for web orders. Please call 1-800-TOILETS to speak with a representative.',
      data: {},
    };
    cacheDataJSON.response = quoteResult;
    cacheDataJSON.updatedAt = new Date().toISOString();
    this.cacheService.set(requestId, cacheDataJSON, TIMEMS_CACHE_REQUEST_FOR_QUOTE);
    return quoteResult;
  }

  // for add/update quote/contract Id
  async saveAccoutwiseIdsToFirestore(obj) {
    const doc = await this.firestoreService.getDocument('accounts', obj.accountId);
    if (doc) {
      if (obj.quotes) {
        const array = doc.quotes || [];
        array.push(obj.quotes[0]);
        obj.quotes = array;
      } else {
        const array = doc.contracts || [];
        array.push(obj.contracts[0]);
        obj.contracts = array;
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
    const opportunity = new Opportunity();
    opportunity.AccountId = createQuoteRequest.accountId;
    opportunity.Name = `Opportunity_${new Date().toISOString()}`;
    opportunity.StageName = OPPORTUNITY_STAGE;
    opportunity.Amount = OPPORTUNITY_AMOUNT;
    opportunity.CloseDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    opportunity.LeadSource = OPPORTUNITY_LEAD_SOURCE;
    opportunity.USF_Bill_To_Account__c = createQuoteRequest.accountId;
    opportunity.USF_Start_Date__c = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    opportunity.USF_End_Date__c = DEFAULT_END_DATE;
    opportunity.USF_Order_Type__c = createQuoteRequest.orderType;
    opportunity.USF_Primary_Contact__c = createQuoteRequest.contactId;
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
    quoteRequestModel.Id = createQuoteRequest.id;
    quoteRequestModel.SBQQ__Opportunity2__c = opportunityResult.id;
    quoteRequestModel.Purchase_Order__c = poId;
    quoteRequestModel.Shipping_Address__c = addressId;
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
    quoteRequestModel.Payment_Mode__c = QUOTE_PAYMENT_MODE;
    quoteRequestModel.PreOrder_Flow_Complete__c = false;
    quoteRequestModel.Site_Complete__c = false;
    quoteRequestModel.Billing_Approval_Status__c = QUOTE_BILLING_APPROVAL_STATUS;
    quoteRequestModel.isCheckPaymentMethod__c = false;
    quoteRequestModel.Fuel_Surcharge_Percent__c = FUEL_SURCHARGE_PERCENT__C;
    quoteRequestModel.SBQQ__StartDate__c = createQuoteRequest.startDate;
    quoteRequestModel.SBQQ__EndDate__c = createQuoteRequest.endDate;
    quoteRequestModel.Duration__c = createQuoteRequest.duration;
    quoteRequestModel.SBQQ__Status__c = 'Draft';
    
    quoteRequestModel.Estimated_End_Date__c = createQuoteRequest.orderType !== "Recurring Service"
      ? createQuoteRequest.estimatedEndDate
      : null;

    const updateSiteContactResp = await this.sfdcQuoteService.updateSiteContactV2(createQuoteRequest);
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

    quoteRequestModel.Estimated_End_Date__c = createQuoteRequest.orderType !== "Recurring Service"
      ? createQuoteRequest.estimatedEndDate
      : null;

    const updateSiteContactResp = await this.sfdcQuoteService.updateSiteContactV2(createQuoteRequest);
    quoteRequestModel.SBQQ__PrimaryContact__c = updateSiteContactResp.id;

    return quoteRequestModel;
  }

  public async addProductAndSave(
    addProductRequest: AddProductAndCalculateReqDTO,
    auth0Id: string,
    accountId: string
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

      addProductRequest.productDetails.forEach((product, index) => {
        if (product.additionalProduct && product.additionalProduct.length > 0) {
          let count = 1;
          product.additionalProduct.forEach((additionalProduct) => {
            product[`productIdAS_${count}`] = additionalProduct.productIdAS;
            product[`productOptionSkuAS_${count}`] = additionalProduct.productOptionSkuAS;
            product[`aSSummery_${count}`] = additionalProduct.aSSummery;
            count++;
          });
        }
      });

      const productList = await this.productsService.getProducts();
      const bundles: Bundle[] = addProductRequest.productDetails.map((productDetail) => {
        return this.getBundleFromProductDetails(productDetail, productList);
      });

      const q = new SBQQ__Quote__c();
      q.Id = addProductRequest.quoteId;
      q.SBQQ__StartDate__c = addProductRequest.startDate;
      q.SBQQ__EndDate__c = addProductRequest.endDate;
      q.Shipping_Address__c = addProductRequest.addressId;

      const cartLevelQuoteLines = this.createCartLevelQuoteLines(addProductRequest, productList);
      const shortTermQuoteLine = this.createShortTermQuoteLineIfNeeded(q, productList);
      if (shortTermQuoteLine) {
        cartLevelQuoteLines.push(shortTermQuoteLine);
      }

      const quoteModel = this.createQuoteModelFromBundles(addProductRequest, bundles, cartLevelQuoteLines);
      quoteModel.record.Id = addProductRequest.quoteId;
      quoteModel.record.SBQQ__StartDate__c = addProductRequest.startDate;
      quoteModel.record.SBQQ__EndDate__c = addProductRequest.endDate;
      quoteModel.record.SBQQ__Status__c = 'Draft';

      let saveQuoteResult = new CPQ_QuoteModel();
      const saveQuotePromise = this.sfdcCPQService.saveQuoteAndDeleteExistingLines(quoteModel)
        .then((result) => {
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

  private createQuoteModelFromBundles(
    addProductRequest: AddProductAndCalculateReqDTO,
    bundles: Bundle[],
    cartLevelQuoteLines: SBQQ__QuoteLine__c[],
  ): CPQ_QuoteModel {
    const quoteModel = new CPQ_QuoteModel();
    quoteModel.calculationRequired = false;
    quoteModel.calculatePending = false;
    quoteModel.backgroundCalculatePending = false;

    const quoteRecord = new SBQQ__Quote__c();
    quoteRecord.Id = addProductRequest.quoteId;
    quoteModel.record = quoteRecord;
    quoteModel.record.setTypeAttribute();

    const lineItems: CPQ_QuoteLineModel[] = [];

    let currentKey = 0;
    bundles.forEach((bundle) => {
      // increment the current key and set bundle key to it
      currentKey++;
      bundle.key = currentKey;
      const quoteLines = this.createQuoteLinesModel(addProductRequest, bundle, currentKey);
      // create the bundle line
      lineItems.push(this.sfdcCPQService.createQuoteLineModel(quoteLines.quoteLineBundle, bundle.key));
      // create additional service lines
      quoteLines.quoteLineAdditionalServiceArr.forEach((quoteLineAdditionalService) => {
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
    cartLevelQuoteLines.forEach((cartLevelQuoteLine) => {
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
    const cartLevelQuoteLines: SBQQ__QuoteLine__c[] = [];

    const cartLevelPickupProduct = productList.find((product) => {
      return (
        product.ProductType__c === 'P n D' &&
        product.Asset_Summary__c.startsWith('Cart-level') &&
        product.Name.startsWith('Pick')
      );
    });

    const quoteLinePickupCartModel = new SBQQ__QuoteLine__c();
    quoteLinePickupCartModel.SBQQ__Quote__c = addProductRequest.quoteId;
    quoteLinePickupCartModel.SBQQ__Bundle__c = false;
    quoteLinePickupCartModel.SBQQ__StartDate__c = addProductRequest.startDate;
    quoteLinePickupCartModel.SBQQ__EndDate__c = addProductRequest.endDate;
    quoteLinePickupCartModel.SBQQ__Product__c = cartLevelPickupProduct?.Id || null;
    quoteLinePickupCartModel.SBQQ__PricebookEntryId__c = cartLevelPickupProduct?.PricebookEntries[0].Id || null;
    quoteLinePickupCartModel.SBQQ__Quantity__c = 1; // qty is 1 for cart-level fees
    cartLevelQuoteLines.push(quoteLinePickupCartModel);

    // cart-level delivery
    const cartLevelDeliveryProduct = productList.find((product) => {
      return (
        product.ProductType__c === 'P n D' &&
        product.Asset_Summary__c.startsWith('Cart-level') &&
        product.Name.startsWith('Del')
      );
    });

    const quoteLineDeliveryCartModel = new SBQQ__QuoteLine__c();
    quoteLineDeliveryCartModel.SBQQ__Quote__c = addProductRequest.quoteId;
    quoteLineDeliveryCartModel.SBQQ__Bundle__c = false;
    quoteLineDeliveryCartModel.SBQQ__StartDate__c = addProductRequest.startDate;
    quoteLineDeliveryCartModel.SBQQ__EndDate__c = addProductRequest.endDate;
    quoteLineDeliveryCartModel.SBQQ__Product__c = cartLevelDeliveryProduct?.Id || null;
    quoteLineDeliveryCartModel.SBQQ__PricebookEntryId__c = cartLevelDeliveryProduct?.PricebookEntries[0].Id || null;

    cartLevelQuoteLines.push(quoteLineDeliveryCartModel);
    return cartLevelQuoteLines;
  }

  private createQuoteLinesModel(
    addProductRequest: AddProductAndCalculateReqDTO,
    bundle: Bundle,
    startingSortKey?: number,
  ): QuoteLinesModel {
    let currentSortKey = startingSortKey ? startingSortKey : 1;
    const quoteLinesModel = new QuoteLinesModel();
    
    // Setting properties for the bundle
    const quoteLineBundleModel = this.createQuoteLineModel(addProductRequest, bundle.bundleProduct, currentSortKey, true);
    quoteLinesModel.quoteLineBundle = quoteLineBundleModel;

    // Asset product
    const quoteLineAssetModel = this.createQuoteLineModel(addProductRequest, bundle.assetProduct, currentSortKey);
    quoteLinesModel.quoteLineAsset = quoteLineAssetModel;

    // Service product
    const quoteLineServiceModel = this.createQuoteLineModel(addProductRequest, bundle.serviceProduct, currentSortKey);
    quoteLinesModel.quoteLineService = quoteLineServiceModel;

    // Collect additional services if any
    quoteLinesModel.quoteLineAdditionalServiceArr = bundle.additionalProducts.map((additionalProduct) => {
      return this.createQuoteLineModel(addProductRequest, additionalProduct, currentSortKey);
    });

    // Create delivery and pickup models
    quoteLinesModel.quoteLineDelivery = this.createQuoteLineModel(addProductRequest, bundle.deliveryProduct, currentSortKey);
    quoteLinesModel.quoteLinePickup = this.createQuoteLineModel(addProductRequest, bundle.pickupProduct, currentSortKey);

    return quoteLinesModel;
  }

  private createQuoteLineModel(addProductRequest: AddProductAndCalculateReqDTO, product: any, sortKey: number, isBundle: boolean = false) {
    const quoteLineModel = new SBQQ__QuoteLine__c();
    const quantity = 1; // Adjust as necessary based on business rules

    quoteLineModel.SBQQ__Quote__c = addProductRequest.quoteId;
    quoteLineModel.SBQQ__Bundle__c = isBundle;
    quoteLineModel.SBQQ__StartDate__c = addProductRequest.startDate;
    quoteLineModel.SBQQ__EndDate__c = addProductRequest.endDate;
    quoteLineModel.SBQQ__Product__c = product.id;
    quoteLineModel.SBQQ__Quantity__c = quantity;
    quoteLineModel.SBQQ__Number__c = sortKey;

    return quoteLineModel;
  }

  private createShortTermQuoteLineIfNeeded(quote: SBQQ__Quote__c, productList: Product2[]): SBQQ__QuoteLine__c | undefined {
    // if the order type is not Recurring Service then we don't need to create a short term quote line
    if (quote.Order_Type__c !== 'Recurring Service') {
      return;
    }

    const daysBetween = DateUtils.getDifferenceInDays(new Date(quote.SBQQ__StartDate__c), new Date(quote.SBQQ__EndDate__c));
    
    if (daysBetween > 30) {
      return;
    }

    const shortTermProduct = productList.find((product) => product.ProductCode === 'ShortTerm');
    const shortTermQuoteLineModel = new SBQQ__QuoteLine__c();
    shortTermQuoteLineModel.SBQQ__Product__c = shortTermProduct?.Id || null;
    shortTermQuoteLineModel.SBQQ__Quote__c = quote.Id;
    shortTermQuoteLineModel.SBQQ__ChargeType__c = 'One-Time';
    shortTermQuoteLineModel.SBQQ__Quantity__c = 1;
    shortTermQuoteLineModel.SBQQ__StartDate__c = quote.SBQQ__StartDate__c;
    shortTermQuoteLineModel.SBQQ__EndDate__c = DateUtils.formatDateAsSalesforceString(DateUtils.addDays(new Date(quote.SBQQ__StartDate__c), 35));
    shortTermQuoteLineModel.SBQQ__PricebookEntryId__c = shortTermProduct?.PricebookEntries[0].Id || null;

    return shortTermQuoteLineModel;
  }

  getBundleFromProductDetails(productDetails: ProductDetails, productList: Product2[]): Bundle {
    const bundle = new Bundle();
    bundle.quantity = productDetails.bundleQty;

    // bundle product
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
    bundle.additionalProducts = productDetails.additionalProduct?.map((additionalProduct) => {
      const additionalProductId = additionalProduct.productIdAS;
      return this.mapProductIdToBundleProduct(additionalProductId, productList, bundleProductId);
    }) || [];
    
    // delivery and pickup product
    bundle.deliveryProduct = this.getDeliveryPickupProduct(bundleSFDCProduct, productList, 'Del');
    bundle.pickupProduct = this.getDeliveryPickupProduct(bundleSFDCProduct, productList, 'Pick');

    return bundle;
  }

  private getDeliveryPickupProduct(bundleSFDCProduct: any, productList: Product2[], type: string) {
    const deliverySFDCProductId = bundleSFDCProduct.SBQQ__Options__r.find((option) => {
      return (
        option.SBQQ__OptionalSKU__r.ProductType__c === 'P n D' && option.SBQQ__OptionalSKU__r.Name.startsWith(type)
      );
    }).SBQQ__OptionalSKU__c;

    return this.mapProductIdToBundleProduct(deliverySFDCProductId, productList);
  }

  private mapProductIdToBundleProduct(
    productId: string,
    productList: Product2[],
    parentBundleProductId?: string,
  ): BundleProduct {
    const bundleProduct = new BundleProduct();
    
    const product = productList.find((product) => product.Id === productId);
    if (!product) return bundleProduct; // Return empty if product not found

    bundleProduct.id = product.Id;
    bundleProduct.name = product.Name;
    bundleProduct.summary = product.Asset_Summary__c;
    bundleProduct.productCode = product.ProductCode;
    bundleProduct.taxCode = product.AVA_SFCPQ__TaxCode__c;
    bundleProduct.chargeType = product.SBQQ__SubscriptionType__c === 'One-time' ? 'One-Time' : 'Recurring';
    bundleProduct.priceBookEntryId = product.PricebookEntries[0].Id;

    if (parentBundleProductId) {
      const bundleSFDCProduct = productList.find((product) => product.Id === parentBundleProductId);
      const opt = bundleSFDCProduct?.SBQQ__Options__r.find((option) => option.SBQQ__OptionalSKU__r.Id === productId);
      if (opt) {
        bundleProduct.productOptionId = opt?.Id;
        bundleProduct.featureId = opt?.SBQQ__Feature__c;
        bundleProduct.productOptionType = opt?.SBQQ__Type__c;
      }
    }

    return bundleProduct;
  }

  async getQuoteDetailsById(quoteId: string): Promise<ApiRespDTO<GetQuoteDetailsRespDTO | object>> {
    try {
      const quoteModel = await this.quoteService.getQuoteHtmlModel(quoteId, new CPQ_QuoteModel());
      
      quoteModel.jobSites.forEach((site) => {
        quoteModel.quoteLines.some((quoteLine) => {
          if (site.quoteLineId === quoteLine.quoteLineId) {
            const bundleId = quoteLine.product.id;
            const productArr = quoteModel.quoteLines.filter((line) => line.requiredBy === quoteLine.quoteLineId);
            const serviceDetails = productArr.filter((line) => line.productType === 'Service');
            const assetDetails = productArr.filter((line) => line.productType === 'Asset');
            const ancillaryServiceDetails = productArr.filter((line) => 
              line.productType === 'Ancillary Services' || line.productType === 'Ancillary Asset'
            );

            site.productDetails = {
              bundleId: bundleId,
              assetId: assetDetails[0]?.product.id,
              serviceId: serviceDetails[0]?.product.id,
              bundleName: quoteLine.product.description,
              assetName: assetDetails[0]?.product.description,
              serviceName: serviceDetails[0]?.product.description,
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
        data: { quoteModel }
      };
    } catch (err) {
      this.logger.error(err);
      return {
        success: false,
        message: 'fail',
        status: 1006,
        data: {}
      };
    }
  }
}
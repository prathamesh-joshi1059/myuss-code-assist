import { Injectable } from '@nestjs/common';
import { CPQ_QuoteModel } from '../../../model/cpq/QuoteModel';
import { SfdcBaseService } from '../../sfdc-base/sfdc-base.service';
import { SBQQ__QuoteLine__c } from '../../../model/SBQQ__QuoteLine__c';
import { SBQQ__ProductOption__c } from '../../../model/Product2';
import { LoggerService } from '../../../../../core/logger/logger.service';

@Injectable()
export class CPQPriceRulesEngineService {
  private static readonly RULES_ENGINE_NAME = 'CPQ Price Rules Engine';
  private onInitializationRules: any[] = ['setParentAccountNumberOnQuote'];
  private beforeCalculateRules: any[] = [
    'setParentAccountNumberOnQuote',
    'setSpecialPriceTypeToOpenMarket',
    'setServiceTypeScenario',
    'setQuoteLineSortOrder',
  ];
  private onCalculateRules: any[] = [
    'setQuoteLineSortOrder',
    'setCOVIDSafetyFeePriceUpdate',
    'setTotalOneTimeCharges',
    'setCustomerOwnedCheckbox',
    'setAdHocCheckbox',
  ];
  private afterCalculateRules: any[] = [
    'setContractedPriceOverride',
    'setQuoteLineFeesPercents',
    'setTrailerCount',
    'setServiceStartDate',
    'setServiceEndDate',
    'setCustomerOwnedCheckbox',
    'setAdHocCheckbox',
    'setMLCPQStatusToAmendPending',
    'setUSSNetToTotalFormula',
    'setQuoteFiledsNotARule',
  ];

  constructor(private sfdcBaseService: SfdcBaseService, private logger: LoggerService) {}

  public runRulesSetForHook(
    quoteModel: CPQ_QuoteModel,
    sfdcData: any,
    hook: 'onInitialization' | 'beforeCalculate' | 'onCalculate' | 'afterCalculate',
  ): CPQ_QuoteModel {
    let rulesSetName = `${hook}Rules`;
    if (this[rulesSetName]) {
      this[rulesSetName].forEach((rule: string) => {
        this.logger.info(`Running rule ${rule} for ${CPQPriceRulesEngineService.RULES_ENGINE_NAME}`);
        try {
          quoteModel = this[rule](quoteModel, sfdcData);
        } catch (err) {
          this.logger.error(`Error running rule ${rule} for ${CPQPriceRulesEngineService.RULES_ENGINE_NAME}: ${err}`);
          throw new Error(`Error running rule ${rule} for ${CPQPriceRulesEngineService.RULES_ENGINE_NAME}: ${err}`);
        }
      });
    } else {
      throw new Error(`Rules set ${rulesSetName} not found for ${CPQPriceRulesEngineService.RULES_ENGINE_NAME}`);
    }
    return quoteModel;
  }

  public async getSalesforceDataForRulesEngine(quoteModel: CPQ_QuoteModel): Promise<any> {
    // TODO: refactor to use the composite API
    // Account.Parent_Account_Number__c;
    const accounts = [];
    const products = [];
    const accountPromise = this.sfdcBaseService.conn
      .sobject('Account')
      .select('Id, Parent_Account_Number__c')
      .where({ Id: quoteModel.record.SBQQ__Account__c })
      .execute((err, records) => {
        if (err) {
          return this.logger.error(err);
        }
        accounts.push(...records);
      });
    // products
    // Name, Asset_Summary__c, Apply_Fuel_Surcharge__c, ApplyEnhancedSafetyFee__c, Apply_EEC__c
    const productIdList = quoteModel.lineItems.map((lineItem) => lineItem.record.SBQQ__Product__c);
    const productsPromise = this.sfdcBaseService.conn
      .sobject('Product2')
      .select('Id, Name, Asset_Summary__c, Apply_Fuel_Surcharge__c, ApplyEnhancedSafetyFee__c, Apply_EEC__c')
      .where({ Id: { $in: productIdList } })
      .execute((err, records) => {
        if (err) {
          return this.logger.error(err);
        }
        products.push(...records);
      });

    // product options
    // Id, SBQQ__Number__c
    // where Id in the list of product option ids from the quote line items
    const productOptions = [];
    const productOptionIdList = quoteModel.lineItems.map((lineItem) => lineItem.record.SBQQ__ProductOption__c);
    const productOptionsPromise = this.sfdcBaseService.conn
      .sobject('SBQQ__ProductOption__c')
      .select('Id, SBQQ__Number__c')
      .where({ Id: { $in: productOptionIdList } })
      .execute((err, records) => {
        if (err) {
          return this.logger.error(err);
        }
        productOptions.push(...records);
      });

    await Promise.all([accountPromise, productsPromise, productOptionsPromise]);
    return {
      account: accounts[0],
      products: products,
      productOptions: productOptions,
    };
  }

  // evaluation order: null
  // Rule Name: Set Parent Account Number on Quote
  // Evaluation Event: On Initialization;Before Calculate
  // Description: Get the Parent_Account_Number__c from the Account and set it on the Quote
  // Required data: Account.Parent_Account_Number__c
  public setParentAccountNumberOnQuote(quoteModel: CPQ_QuoteModel, sfdcData: any): CPQ_QuoteModel {
    if (!quoteModel.record.Parent_Account_Number__c) {
      quoteModel.record.Parent_Account_Number__c = sfdcData.account.Parent_Account_Number__c;
    }
    return quoteModel;
  }

  // evaluation order: 1
  // Rule Name: Set Special Price Type to Open Market
  // Evaluation Event: Before Calculate
  // Conditions:
  //   Quote.Business_Type__c == 'Federal'
  //   QuoteLine.IS2PContractedPrice__c == FALSE
  // Actions:
  //   Set SBQQ__SpecialPriceType__c = 'Open Market'
  // Description: Set the Quote Name
  // Required data: Quote.Name
  public setSpecialPriceTypeToOpenMarket(quoteModel: CPQ_QuoteModel, sfdcData: any): CPQ_QuoteModel {
    if (quoteModel.record.Business_Type__c === 'Federal') {
      quoteModel.lineItems.forEach((lineItem) => {
        if (!lineItem.record.IS2PContractedPrice__c) {
          lineItem.record.SBQQ__SpecialPriceType__c = 'Open Market';
        }
      });
    }
    return quoteModel;
  }

  // evaluation order: 1
  // Rule Name: Set Special Price Type to Open Market
  // Evaluation Event: Before Calculate
  // Conditions:
  //   None
  // Actions:
  //   Set Quote.Service_Type_Scenario__c = IF (TEXT(Order_Type__c) = "One-Time Service", "One-Time",
  //  IF (ISPICKVAL(Business_Type__c, "Agriculture"), "Agriculture",
  //  IF (ISPICKVAL(Business_Type__c, "Industrial"), "Industrial",
  //  IF(ISPICKVAL(Customer_Type__c, "Government"), "Government",
  // "Other Business Type"))))
  // Description: Based on the Order Type, Business Type, and Customer Type, set the Service Type Scenario
  // Required data: Quote.Order_Type__c, Quote.Business_Type__c, Quote.Customer_Type__c
  public setServiceTypeScenario(quoteModel: CPQ_QuoteModel, sfdcData: any): CPQ_QuoteModel {
    if (quoteModel.record.Order_Type__c === 'One-Time Service') {
      quoteModel.record.Service_Type_Scenario__c = 'One-Time';
    } else if (quoteModel.record.Business_Type__c === 'Agriculture') {
      quoteModel.record.Service_Type_Scenario__c = 'Agriculture';
    } else if (quoteModel.record.Business_Type__c === 'Industrial') {
      quoteModel.record.Service_Type_Scenario__c = 'Industrial';
    } else if (quoteModel.record.Customer_Type__c === 'Government') {
      quoteModel.record.Service_Type_Scenario__c = 'Government';
    } else {
      quoteModel.record.Service_Type_Scenario__c = 'Other Business Type';
    }
    return quoteModel;
  }

  // evaluation order: 1
  // Rule Name: Populate EEC/ESF Values
  // Evaluation Event: After Calculate
  // Conditions:
  //   None
  // Actions:
  //  1) Set QuoteLine.Fuel_Surcharge_Percent__c =
  //    IF(AND(SBQQ__Product__r.Apply_Fuel_Surcharge__c, SBQQ__Quote__r.NF_Quote_Type__c != 'Move' ), SBQQ__Quote__r.Fuel_Surcharge_Percent__c, 0)
  //  2) Set QuoteLine.ESF_Percent__c =
  //    IF(SBQQ__Product__r.ApplyEnhancedSafetyFee__c, SBQQ__Quote__r.ESF_Percent__c, 0)
  //  3) Set QuoteLine.EEC_Percent__c =
  //   IF( SBQQ__Quote__r.EEC__c || SBQQ__Product__r.Apply_EEC__c <> true ,0 , SBQQ__Quote__r.EEC_Percent__c)
  // Description: Based on the Order Type, Business Type, and Customer Type, set the Service Type Scenario
  // Required data: Quote.Order_Type__c, Quote.Business_Type__c, Quote.Customer_Type__c
  public setQuoteLineFeesPercents(quoteModel: CPQ_QuoteModel, sfdcData: any): CPQ_QuoteModel {
    quoteModel.lineItems.forEach((lineItem) => {
      const product = sfdcData.products.find((product) => product.Id === lineItem.record.SBQQ__Product__c);
      //  IF(AND(SBQQ__Product__r.Apply_Fuel_Surcharge__c, SBQQ__Quote__r.NF_Quote_Type__c != 'Move' ), SBQQ__Quote__r.Fuel_Surcharge_Percent__c, 0)
      if (product.Apply_Fuel_Surcharge__c && quoteModel.record.NF_Quote_Type__c !== 'Move') {
        lineItem.record.Fuel_Surcharge_Percent__c = quoteModel.record.Fuel_Surcharge_Percent__c;
      } else {
        lineItem.record.Fuel_Surcharge_Percent__c = 0;
      }
      // IF(SBQQ__Product__r.ApplyEnhancedSafetyFee__c, SBQQ__Quote__r.ESF_Percent__c, 0)
      lineItem.record.ESF_Percent__c = product.ApplyEnhancedSafetyFee__c ? quoteModel.record.ESF_Percent__c : 0;
      // IF( SBQQ__Quote__r.EEC__c || SBQQ__Product__r.Apply_EEC__c <> true ,0 , SBQQ__Quote__r.EEC_Percent__c)
      if (quoteModel.record.EEC__c || product.Apply_EEC__c !== true) {
        lineItem.record.EEC_Percent__c = 0;
      } else {
        lineItem.record.EEC_Percent__c = quoteModel.record.EEC_Percent__c;
      }
    });
    return quoteModel;
  }

  // evaluation order: 2
  // Rule Name: Contracted Price Override
  // Evaluation Event: On Calculate
  // Conditions:
  //   QuoteLine.IS2PContractedPrice__c == TRUE
  // Actions:
  //  Set QuoteLine.Price_Override__c = QuoteLine.Target_Price__c
  // Description: Based on the Order Type, Business Type, and Customer Type, set the Service Type Scenario
  // Required data: Quote.Order_Type__c, Quote.Business_Type__c, Quote.Customer_Type__c
  public setContractedPriceOverride(quoteModel: CPQ_QuoteModel, sfdcData: any): CPQ_QuoteModel {
    quoteModel.lineItems.forEach((lineItem) => {
      if (lineItem.record.IS2PContractedPrice__c) {
        lineItem.record.Price_Override__c = lineItem.record.Target_Price__c;
      } else {
        // Adam: We're using target, let's always set the price override here.  may need to revisit later
        lineItem.record.Price_Override__c = lineItem.record.Target_Price__c;
      }
    });
    return quoteModel;
  }

  // evaluation order: 5
  // Rule Name: Set Trash Box Liner Quantity
  // Evaluation Event: Save (Configurator)
  // Conditions:
  //   QuoteLine.SBQQ__ProductCode__c == 900-4005 (Trash Box Liners)
  // Actions:
  //  Set QuoteLine.SBQQ__Quantity__c =
  //      SUM of all QuoteLine.SBQQ__Quantity__c WHERE
  //      QuoteLine.SBQQ__ProductCode__c == 900-4004 within the bundle
  // Description: Align the number of trash box liners with the number of trash boxes
  // Required data: QuoteLine.Product.ProductCode, QuoteLine.SBQQ__Quantity__c
  public setTrashBoxLinerQuantity(quoteModel: CPQ_QuoteModel, sfdcData: any): CPQ_QuoteModel {
    quoteModel.lineItems.forEach((lineItem) => {
      if (lineItem.record.SBQQ__ProductCode__c === '900-4005') {
        let quantity = 0;
        // get the bundle
        const bundleId = lineItem.record.SBQQ__RequiredBy__c;
        // get the line items in the bundle
        const lineItemsInBundle = quoteModel.lineItems.filter(
          (lineItem) => lineItem.record.SBQQ__RequiredBy__c === bundleId,
        );
        // get the trash box line items in the bundle and sum the quantity
        lineItemsInBundle.forEach((relatedLineItem) => {
          if (relatedLineItem.record.SBQQ__ProductCode__c === '900-4004') {
            quantity += relatedLineItem.record.SBQQ__Quantity__c;
          }
        });
        // set the quantity on the trash box liner line item
        lineItem.record.SBQQ__Quantity__c = quantity;
      }
    });
    return quoteModel;
  }

  /* evaluation order: 10
   * Rule Name: Calculate Sort Order
   * Evaluation Event: Before Calculate;On Calculate
   * Conditions:
   *   None
   * Actions:
   *  Set QuoteLine.Sort_Order__c =
   *  IF(
   *   OR(
   *     AND(ISBLANK( SBQQ__RequiredBy__c),(SBQQ__Product__r.Asset_Summary__c = 'Cart-level P&D Sanitation')),
   *     AND(NOT(ISBLANK(SBQQ__RequiredBy__c)),(SBQQ__RequiredBy__r.SBQQ__Product__r.Asset_Summary__c = 'Cart-level P&D Sanitation'))
   *     ),
   *      TEXT("5000") + LPAD( TEXT( SBQQ__ProductOption__r.SBQQ__Number__c), 5, "0") + LPAD(TEXT(SBQQ__Number__c), 5, "0"),
   *   IF(
   *     OR(
   *       SBQQ__Product__r.Name = 'EEC Sanitation',
   *       AND(ISBLANK( SBQQ__RequiredBy__c),(SBQQ__Product__r.Name = 'Permit Fee'))
   *      ),
   *       TEXT("9999") + LPAD( TEXT( SBQQ__ProductOption__r.SBQQ__Number__c), 5, "0") + LPAD(TEXT(SBQQ__Number__c), 5, "0") ,
   *       TEXT("0000") + LPAD( TEXT( SBQQ__Number__c), 5, "0") + LPAD( TEXT( SBQQ__ProductOption__r.SBQQ__Number__c), 5, "0")
   *     )
   *    )
   * Description: Calculate the sort order value from the Quote Line
   * Required data: None
   */
  public setQuoteLineSortOrder(quoteModel: CPQ_QuoteModel, sfdcData: any): CPQ_QuoteModel {
    quoteModel.lineItems.forEach((lineItem) => {
      let sortOrder = '';
      let rec = lineItem.record;
      const product = sfdcData.products.find((product) => product.Id === rec.SBQQ__Product__c);
      const requiredByProduct = sfdcData.products.find(
        (product) => product.Id === rec.SBQQ__RequiredBy__r?.SBQQ__Product__c,
      );
      const productOption: SBQQ__ProductOption__c = sfdcData.productOptions.find(
        (productOption) => productOption.Id === rec.SBQQ__ProductOption__c,
      );
      if (!rec.SBQQ__RequiredBy__c && product.Asset_Summary__c === 'Cart-level P&D Sanitation') {
        sortOrder = this.calcSortOrder(rec, productOption, '5000');
      } else if (rec.SBQQ__RequiredBy__c && requiredByProduct?.Asset_Summary__c === 'Cart-level P&D Sanitation') {
        sortOrder = this.calcSortOrder(rec, productOption, '5000');
      } else if (product.Name === 'EEC Sanitation' || product.Name === 'Permit Fee') {
        sortOrder = this.calcSortOrder(rec, productOption, '9999');
      } else {
        sortOrder = this.calcSortOrderZeroes(rec, productOption);
      }
      lineItem.record.Sort_Order__c = sortOrder;
    });
    return quoteModel;
  }

  private calcSortOrder(quoteLine: SBQQ__QuoteLine__c, productOption: SBQQ__ProductOption__c, prefix: string): string {
    let sortOrder = prefix;
    // product option segment
    if (productOption && productOption.SBQQ__Number__c) {
      sortOrder += productOption.SBQQ__Number__c.toString().padStart(5, '0');
    } else {
      sortOrder += '00000';
    }
    // quote line segment
    if (quoteLine.SBQQ__Number__c) {
      sortOrder += quoteLine.SBQQ__Number__c.toString().padStart(5, '0');
    } else {
      sortOrder += '00000';
    }
    return sortOrder;
  }

  private calcSortOrderZeroes(quoteLine: SBQQ__QuoteLine__c, productOption: SBQQ__ProductOption__c): string {
    let sortOrder = '0000';
    if (quoteLine.SBQQ__Number__c) {
      sortOrder += quoteLine.SBQQ__Number__c.toString().padStart(5, '0');
    } else {
      sortOrder += '00000';
    }
    if (productOption && productOption.SBQQ__Number__c) {
      sortOrder += productOption.SBQQ__Number__c.toString().padStart(5, '0');
    } else {
      sortOrder += '00000';
    }
    // sortOrder += quoteLine.SBQQ__Number__c.toString().padStart(5, '0');
    // sortOrder += productOption ? productOption.SBQQ__Number__c.toString().padStart(5, '0') : '00000';
    return sortOrder;
  }

  /* evaluation order: 10
   * Rule Name: Calculate Sort Order
   * Evaluation Event: On Calculate
   * Conditions:
   *   QuoteLine.SBQQ__ProductCode__c == 113-3102 (Enhanced Safety Fee)
   *   QuoteLine.Price_Override__c != ESFPrice__c
   * Actions:
   *  Set QuoteLine.Price_Override__c = QuoteLine.ESFPrice__c
   * Description: Not really sure - doing something with fees using separate line items
   * Required data: None
   *****************/
  public setCOVIDSafetyFeePriceUpdate(quoteModel: CPQ_QuoteModel, sfdcData: any): CPQ_QuoteModel {
    // TODO: check in with Santhosh to see if this is still relevant
    quoteModel.lineItems.forEach((lineItem) => {
      if (
        lineItem.record.SBQQ__ProductCode__c === '113-3102' &&
        lineItem.record.Price_Override__c !== lineItem.record.ESFPrice__c
      ) {
        lineItem.record.Price_Override__c = lineItem.record.ESFPrice__c;
      }
    });
    return quoteModel;
  }

  /* evaluation order: 100
   * Rule Name: Trailer Count
   * Evaluation Event: After Calculate
   * Conditions:
   *   SUM(QuoteLine.SBQQ__Quantity__c WHERE SBQQ__ProductCode__c = 200-0000) >= 0
   * Actions:
   *  Set Quote.NF_Trailer_Count__c = SUM(QuoteLine.SBQQ__Quantity__c WHERE SBQQ__ProductCode__c = 200-0000)
   * Description: Calculate and store the number of trailers on the quote
   * Required data: None
   *****************/
  public setTrailerCount(quoteModel: CPQ_QuoteModel, sfdcData: any): CPQ_QuoteModel {
    let trailerCount = 0;
    quoteModel.lineItems.forEach((lineItem) => {
      if (lineItem.record.SBQQ__ProductCode__c === '200-0000') {
        trailerCount += lineItem.record.SBQQ__Quantity__c;
      }
    });
    if (trailerCount > 0) {
      quoteModel.record.NF_Trailer_Count__c = trailerCount;
    }
    return quoteModel;
  }

  /* evaluation order: 100
   * Rule Name: Set Service Start Date
   * Evaluation Event: After Calculate
   * Conditions:
   *   QuoteLine.Service_Frequency__c IS NOT NULL
   *   QuoteLine.NF_Service_Start_Date__c IS NULL
   * Actions:
   *  Set QuoteLine.NF_Service_Start_Date__c = QuoteLine.SBQQ__EffectiveStartDate__c
   * Description: Set the custom start date from the CPQ date
   * Required data: None
   *****************/
  public setServiceStartDate(quoteModel: CPQ_QuoteModel, sfdcData: any): CPQ_QuoteModel {
    quoteModel.lineItems.forEach((lineItem) => {
      if (lineItem.record.Service_Frequency__c && !lineItem.record.NF_Service_Start_Date__c) {
        lineItem.record.NF_Service_Start_Date__c = lineItem.record.SBQQ__EffectiveStartDate__c;
      }
    });
    return quoteModel;
  }

  /* evaluation order: 100
   * Rule Name: Set Service End Date
   * Evaluation Event: After Calculate
   * Conditions:
   *   QuoteLine.Service_Frequency__c IS NOT NULL
   *   QuoteLine.NF_Service_End_Date__c IS NULL
   * Actions:
   *  Set QuoteLine.NF_Service_End_Date__c = QuoteLine.SBQQ__EffectiveEndDate__c
   * Description: Set the custom end date from the CPQ date
   * Required data: None
   *****************/
  public setServiceEndDate(quoteModel: CPQ_QuoteModel, sfdcData: any): CPQ_QuoteModel {
    quoteModel.lineItems.forEach((lineItem) => {
      if (lineItem.record.Service_Frequency__c && !lineItem.record.NF_Service_End_Date__c) {
        lineItem.record.NF_Service_End_Date__c = lineItem.record.SBQQ__EffectiveEndDate__c;
      }
    });
    return quoteModel;
  }

  /* evaluation order: 124
   * Rule Name: Total One Time Charges
   * Evaluation Event: On Calculate
   * Conditions:
   *   None
   * Actions:
   *  Set Quote.TotalOneTimeCharges__c = SUM (QuoteLine.Product_Net_Amount__c WHERE QuoteLine.SBQQ__SubscriptionType__c = NULL)
   *  NOTE: This logic seems incorrect, should be looking at QuoteLine.SBQQ__ChargeType__c = 'One-Time'.  Almost always $0
   * Description: Set the value of the rollup of one-time charges on the Quote
   * Required data: None
   *****************/
  public setTotalOneTimeCharges(quoteModel: CPQ_QuoteModel, sfdcData: any): CPQ_QuoteModel {
    let totalOneTimeCharges = 0;
    quoteModel.lineItems.forEach((lineItem) => {
      if (!lineItem.record.SBQQ__SubscriptionType__c) {
        totalOneTimeCharges += lineItem.record.Product_Net_Amount__c;
      }
    });
    quoteModel.record.TotalOneTimeCharges__c = totalOneTimeCharges;
    return quoteModel;
  }

  /* evaluation order: 145
   * Rule Name: Update Customer Owned Checkbox
   * Evaluation Event: On Calculate;After Calculate
   * Conditions:
   *   QuoteLine.AdditionalOptions__c = 'Customer Owned'
   * Actions:
   *  Set QuoteLine.CustomerOwned__c = TRUE
   * Description: Set the customer owned checkbox based on the Additional Options field
   * Required data: None
   *****************/
  public setCustomerOwnedCheckbox(quoteModel: CPQ_QuoteModel, sfdcData: any): CPQ_QuoteModel {
    quoteModel.lineItems.forEach((lineItem) => {
      if (lineItem.record.AdditionalOptions__c === 'Customer Owned') {
        lineItem.record.CustomerOwned__c = true;
      }
    });
    return quoteModel;
  }

  /* evaluation order: 147
   * Rule Name: Update Ad Hoc Checkbox - NOTE: there are two rules with this name, both are included in this logic
   * Evaluation Event: On Calculate;After Calculate
   * Conditions:
   *   Quote.Sub_Order_Type__c = 'Ad Hoc' OR
   *   QuoteLine.AdditionalOptions__c = 'Ad Hoc'
   * Actions:
   *  Set QuoteLine.AdHoc__c = TRUE
   * Description: Set the Quote Line Ad Hoc checkbox based on the Quote's Sub Order Type (a616O000000LDV3QAO)
   *  AND Setting the Quote Line Ad Hoc checkbox based on the Quote Line Additional Options field (a613m000000cJDSAA2)
   * Required data: None
   *****************/
  public setAdHocCheckbox(quoteModel: CPQ_QuoteModel, sfdcData: any): CPQ_QuoteModel {
    const subOrderType = quoteModel.record.Sub_Order_Type__c;
    quoteModel.lineItems.forEach((lineItem) => {
      if (subOrderType === 'Ad Hoc' || lineItem.record.AdditionalOptions__c === 'Ad Hoc') {
        lineItem.record.AdHoc__c = true;
      }
    });
    return quoteModel;
  }

  /* evaluation order: 999
   * Rule Name: NF_MLCPQ_PostAmendment
   * Evaluation Event: After Calculate
   * Conditions:
   *   Quote.NF_MlcpqStatus__c = 'None' OR
   *   Quote.SBQQ__Type__c = 'Amendment'
   * Actions:
   *  Set Quote.NF_MlcpqStatus__c = 'Amend Pending'
   * Description: Set the Quote's MLCPQ Status to Amend Pending if the Quote's MLCPQ Status
   *    is None and the Quote Type is Amendment
   * Required data: None
   *****************/
  public setMLCPQStatusToAmendPending(quoteModel: CPQ_QuoteModel, sfdcData: any): CPQ_QuoteModel {
    if (quoteModel.record.NF_MlcpqStatus__c === 'None' && quoteModel.record.SBQQ__Type__c === 'Amendment') {
      quoteModel.record.NF_MlcpqStatus__c = 'Amend Pending';
    }
    return quoteModel;
  }

  /* Rule Name: USS_Net__c formula
   * Evaluation Event: Formula (after calculate)
   * Actions:
   *  IF(ISPICKVAL(SBQQ__ChargeType__c, "Usage"), null, Price_Override__c * SBQQ__Quantity__c)
   * Description: USS_Net__c is a formula field but needed during tax calcs so need to calculate it here
   * Required data: None
   *****************/
  public setUSSNetToTotalFormula(quoteModel: CPQ_QuoteModel, sfdcData: any): CPQ_QuoteModel {
    quoteModel.lineItems.forEach((lineItem) => {
      if (lineItem.record.SBQQ__ChargeType__c !== 'Usage') {
        lineItem.record.USS_Net__c = lineItem.record.Price_Override__c * lineItem.record.SBQQ__Quantity__c;
      }
    });
    return quoteModel;
  }

    /* Rule Name: Not a rule - setting fields on the Quote that is normally handled by CPQ
   * Evaluation Event: Formula (after calculate)
   * Actions:
   *  Set the follwing fields on the Quote
   * LastActivityDate = Today's Date
   * LastViewedDate = Now
   * LastReferencedDate = Now
   * SBQQ__LastCalculatedOn__c = Now
   * SBQQ__Uncalculated__c = false
   * SBQQ__Unopened__c = false
   * Description: USS_Net__c is a formula field but needed during tax calcs so need to calculate it here
   * Required data: None
   *****************/
    public setQuoteFiledsNotARule(quoteModel: CPQ_QuoteModel, sfdcData: any): CPQ_QuoteModel {
      const now = new Date();
      quoteModel.record.LastActivityDate = now.toISOString().split('T')[0];
      quoteModel.record.LastViewedDate = now.toISOString();
      quoteModel.record.LastReferencedDate = now.toISOString();
      quoteModel.record.SBQQ__LastCalculatedOn__c = now.toISOString();
      quoteModel.record.SBQQ__Uncalculated__c = false;
      quoteModel.record.SBQQ__Unopened__c = false;
      return quoteModel;
    }
}

import { Injectable } from '@nestjs/common';
import { CPQ_QuoteModel } from '../../../model/cpq/QuoteModel';
import { SfdcBaseService } from '../../sfdc-base/sfdc-base.service';
import { SBQQ__QuoteLine__c } from '../../../model/SBQQ__QuoteLine__c';
import { SBQQ__ProductOption__c } from '../../../model/Product2';
import { LoggerService } from '../../../../../core/logger/logger.service';

@Injectable()
export class CPQPriceRulesEngineService {
  private static readonly RULES_ENGINE_NAME = 'CPQ Price Rules Engine';
  private onInitializationRules: string[] = ['setParentAccountNumberOnQuote'];
  private beforeCalculateRules: string[] = [
    'setParentAccountNumberOnQuote',
    'setSpecialPriceTypeToOpenMarket',
    'setServiceTypeScenario',
    'setQuoteLineSortOrder',
  ];
  private onCalculateRules: string[] = [
    'setQuoteLineSortOrder',
    'setCOVIDSafetyFeePriceUpdate',
    'setTotalOneTimeCharges',
    'setCustomerOwnedCheckbox',
    'setAdHocCheckbox',
  ];
  private afterCalculateRules: string[] = [
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
    const rulesSetName = `${hook}Rules`;
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

  public async getSalesforceDataForRulesEngine(quoteModel: CPQ_QuoteModel): Promise<{ account: any; products: any[]; productOptions: any[]; }> {
    const accounts: any[] = [];
    const products: any[] = [];
    const accountPromise = this.sfdcBaseService.conn
      .sobject('Account')
      .select('Id, Parent_Account_Number__c')
      .where({ Id: quoteModel.record.SBQQ__Account__c })
      .execute((err, records) => {
        if (err) {
          this.logger.error(err);
        } else {
          accounts.push(...records);
        }
      });

    const productIdList = quoteModel.lineItems.map((lineItem) => lineItem.record.SBQQ__Product__c);
    const productsPromise = this.sfdcBaseService.conn
      .sobject('Product2')
      .select('Id, Name, Asset_Summary__c, Apply_Fuel_Surcharge__c, ApplyEnhancedSafetyFee__c, Apply_EEC__c')
      .where({ Id: { $in: productIdList } })
      .execute((err, records) => {
        if (err) {
          this.logger.error(err);
        } else {
          products.push(...records);
        }
      });

    const productOptions: any[] = [];
    const productOptionIdList = quoteModel.lineItems.map((lineItem) => lineItem.record.SBQQ__ProductOption__c);
    const productOptionsPromise = this.sfdcBaseService.conn
      .sobject('SBQQ__ProductOption__c')
      .select('Id, SBQQ__Number__c')
      .where({ Id: { $in: productOptionIdList } })
      .execute((err, records) => {
        if (err) {
          this.logger.error(err);
        } else {
          productOptions.push(...records);
        }
      });

    await Promise.all([accountPromise, productsPromise, productOptionsPromise]);
    return {
      account: accounts[0],
      products: products,
      productOptions: productOptions,
    };
  }

  public setParentAccountNumberOnQuote(quoteModel: CPQ_QuoteModel, sfdcData: any): CPQ_QuoteModel {
    if (!quoteModel.record.Parent_Account_Number__c) {
      quoteModel.record.Parent_Account_Number__c = sfdcData.account.Parent_Account_Number__c;
    }
    return quoteModel;
  }

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

  public setServiceTypeScenario(quoteModel: CPQ_QuoteModel, sfdcData: any): CPQ_QuoteModel {
    const { record } = quoteModel;
    if (record.Order_Type__c === 'One-Time Service') {
      record.Service_Type_Scenario__c = 'One-Time';
    } else if (record.Business_Type__c === 'Agriculture') {
      record.Service_Type_Scenario__c = 'Agriculture';
    } else if (record.Business_Type__c === 'Industrial') {
      record.Service_Type_Scenario__c = 'Industrial';
    } else if (record.Customer_Type__c === 'Government') {
      record.Service_Type_Scenario__c = 'Government';
    } else {
      record.Service_Type_Scenario__c = 'Other Business Type';
    }
    return quoteModel;
  }

  public setQuoteLineFeesPercents(quoteModel: CPQ_QuoteModel, sfdcData: any): CPQ_QuoteModel {
    quoteModel.lineItems.forEach((lineItem) => {
      const product = sfdcData.products.find((product: any) => product.Id === lineItem.record.SBQQ__Product__c);
      lineItem.record.Fuel_Surcharge_Percent__c = product.Apply_Fuel_Surcharge__c && quoteModel.record.NF_Quote_Type__c !== 'Move'
        ? quoteModel.record.Fuel_Surcharge_Percent__c
        : 0;
      lineItem.record.ESF_Percent__c = product.ApplyEnhancedSafetyFee__c ? quoteModel.record.ESF_Percent__c : 0;
      lineItem.record.EEC_Percent__c = quoteModel.record.EEC__c || product.Apply_EEC__c !== true
        ? 0
        : quoteModel.record.EEC_Percent__c;
    });
    return quoteModel;
  }

  public setContractedPriceOverride(quoteModel: CPQ_QuoteModel, sfdcData: any): CPQ_QuoteModel {
    quoteModel.lineItems.forEach((lineItem) => {
      lineItem.record.Price_Override__c = lineItem.record.Target_Price__c;
    });
    return quoteModel;
  }

  public setTrashBoxLinerQuantity(quoteModel: CPQ_QuoteModel, sfdcData: any): CPQ_QuoteModel {
    quoteModel.lineItems.forEach((lineItem) => {
      if (lineItem.record.SBQQ__ProductCode__c === '900-4005') {
        const bundleId = lineItem.record.SBQQ__RequiredBy__c;
        const quantity = quoteModel.lineItems
          .filter((relatedLineItem) => relatedLineItem.record.SBQQ__RequiredBy__c === bundleId)
          .reduce((sum, relatedLineItem) => {
            return relatedLineItem.record.SBQQ__ProductCode__c === '900-4004' ? sum + relatedLineItem.record.SBQQ__Quantity__c : sum;
          }, 0);
        lineItem.record.SBQQ__Quantity__c = quantity;
      }
    });
    return quoteModel;
  }

  public setQuoteLineSortOrder(quoteModel: CPQ_QuoteModel, sfdcData: any): CPQ_QuoteModel {
    quoteModel.lineItems.forEach((lineItem) => {
      const rec = lineItem.record;
      const product = sfdcData.products.find((product: any) => product.Id === rec.SBQQ__Product__c);
      const requiredByProduct = sfdcData.products.find(
        (product: any) => product.Id === rec.SBQQ__RequiredBy__r?.SBQQ__Product__c,
      );
      const productOption: SBQQ__ProductOption__c = sfdcData.productOptions.find(
        (productOption: SBQQ__ProductOption__c) => productOption.Id === rec.SBQQ__ProductOption__c,
      );

      let sortOrder = '';
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
    sortOrder += productOption && productOption.SBQQ__Number__c ? productOption.SBQQ__Number__c.toString().padStart(5, '0') : '00000';
    sortOrder += quoteLine.SBQQ__Number__c ? quoteLine.SBQQ__Number__c.toString().padStart(5, '0') : '00000';
    return sortOrder;
  }

  private calcSortOrderZeroes(quoteLine: SBQQ__QuoteLine__c, productOption: SBQQ__ProductOption__c): string {
    let sortOrder = '0000';
    sortOrder += quoteLine.SBQQ__Number__c ? quoteLine.SBQQ__Number__c.toString().padStart(5, '0') : '00000';
    sortOrder += productOption && productOption.SBQQ__Number__c ? productOption.SBQQ__Number__c.toString().padStart(5, '0') : '00000';
    return sortOrder;
  }

  public setCOVIDSafetyFeePriceUpdate(quoteModel: CPQ_QuoteModel, sfdcData: any): CPQ_QuoteModel {
    quoteModel.lineItems.forEach((lineItem) => {
      if (lineItem.record.SBQQ__ProductCode__c === '113-3102' && lineItem.record.Price_Override__c !== lineItem.record.ESFPrice__c) {
        lineItem.record.Price_Override__c = lineItem.record.ESFPrice__c;
      }
    });
    return quoteModel;
  }

  public setTrailerCount(quoteModel: CPQ_QuoteModel, sfdcData: any): CPQ_QuoteModel {
    const trailerCount = quoteModel.lineItems.reduce((count, lineItem) => {
      return lineItem.record.SBQQ__ProductCode__c === '200-0000' ? count + lineItem.record.SBQQ__Quantity__c : count;
    }, 0);
    if (trailerCount > 0) {
      quoteModel.record.NF_Trailer_Count__c = trailerCount;
    }
    return quoteModel;
  }

  public setServiceStartDate(quoteModel: CPQ_QuoteModel, sfdcData: any): CPQ_QuoteModel {
    quoteModel.lineItems.forEach((lineItem) => {
      if (lineItem.record.Service_Frequency__c && !lineItem.record.NF_Service_Start_Date__c) {
        lineItem.record.NF_Service_Start_Date__c = lineItem.record.SBQQ__EffectiveStartDate__c;
      }
    });
    return quoteModel;
  }

  public setServiceEndDate(quoteModel: CPQ_QuoteModel, sfdcData: any): CPQ_QuoteModel {
    quoteModel.lineItems.forEach((lineItem) => {
      if (lineItem.record.Service_Frequency__c && !lineItem.record.NF_Service_End_Date__c) {
        lineItem.record.NF_Service_End_Date__c = lineItem.record.SBQQ__EffectiveEndDate__c;
      }
    });
    return quoteModel;
  }

  public setTotalOneTimeCharges(quoteModel: CPQ_QuoteModel, sfdcData: any): CPQ_QuoteModel {
    const totalOneTimeCharges = quoteModel.lineItems.reduce((total, lineItem) => {
      return !lineItem.record.SBQQ__SubscriptionType__c ? total + lineItem.record.Product_Net_Amount__c : total;
    }, 0);
    quoteModel.record.TotalOneTimeCharges__c = totalOneTimeCharges;
    return quoteModel;
  }

  public setCustomerOwnedCheckbox(quoteModel: CPQ_QuoteModel, sfdcData: any): CPQ_QuoteModel {
    quoteModel.lineItems.forEach((lineItem) => {
      if (lineItem.record.AdditionalOptions__c === 'Customer Owned') {
        lineItem.record.CustomerOwned__c = true;
      }
    });
    return quoteModel;
  }

  public setAdHocCheckbox(quoteModel: CPQ_QuoteModel, sfdcData: any): CPQ_QuoteModel {
    const subOrderType = quoteModel.record.Sub_Order_Type__c;
    quoteModel.lineItems.forEach((lineItem) => {
      if (subOrderType === 'Ad Hoc' || lineItem.record.AdditionalOptions__c === 'Ad Hoc') {
        lineItem.record.AdHoc__c = true;
      }
    });
    return quoteModel;
  }

  public setMLCPQStatusToAmendPending(quoteModel: CPQ_QuoteModel, sfdcData: any): CPQ_QuoteModel {
    if (quoteModel.record.NF_MlcpqStatus__c === 'None' && quoteModel.record.SBQQ__Type__c === 'Amendment') {
      quoteModel.record.NF_MlcpqStatus__c = 'Amend Pending';
    }
    return quoteModel;
  }

  public setUSSNetToTotalFormula(quoteModel: CPQ_QuoteModel, sfdcData: any): CPQ_QuoteModel {
    quoteModel.lineItems.forEach((lineItem) => {
      if (lineItem.record.SBQQ__ChargeType__c !== 'Usage') {
        lineItem.record.USS_Net__c = lineItem.record.Price_Override__c * lineItem.record.SBQQ__Quantity__c;
      }
    });
    return quoteModel;
  }

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
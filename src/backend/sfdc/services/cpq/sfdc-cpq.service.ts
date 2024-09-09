import { Injectable } from '@nestjs/common';
import { SfdcBaseService } from '../sfdc-base/sfdc-base.service';
import {
  SBQQ__Quote__c,
  SBQQ__Quote__c_DtoCreate,
} from '../../model/SBQQ__Quote__c';
import { SfdcUssPortalUserService } from '../sfdc-uss-portal-user/sfdc-uss-portal-user.service';
import { LoggerService } from '../../../../core/logger/logger.service';
import { SfdcDocumentService } from '../sfdc-document/sfdc-document.service';
import { CPQ_QuoteLineModel, CPQ_QuoteModel } from '../../model/cpq/QuoteModel';
import { SBQQ__QuoteLine__c } from '../../model/SBQQ__QuoteLine__c';
import { USSQuoteCalculatorPlugin } from './uss-quote-calculator-plugin';
import { CPQPriceRulesEngineService } from './cpq-price-rules-engine/cpq-price-rules-engine.service';

@Injectable()
export class SfdcCpqService {

  constructor(
    private logger: LoggerService,
    private sfdcBaseService: SfdcBaseService,
    private cpqPriceRulesEngineService: CPQPriceRulesEngineService,
  ) {}

  async getCpqProduct(productId: string, context: object) {
    const products = await this.sfdcBaseService.patchApex(
      '/SBQQ/ServiceRouter?loader=SBQQ.ProductAPI.ProductLoader&uid=' +
        productId,
      context,
    );
    return products;
  }

  async getCpqProductOption(productId: string, context: object) {
    const products = await this.sfdcBaseService.patchApex(
      '/SBQQ/ServiceRouter?loader=SBQQ.ProductOptionAPI.ProductOptionLoader&uid=' +
        productId,
      context,
    );
    return products;
  }

  public async saveQuoteCPQ(quoteModel: CPQ_QuoteModel): Promise<CPQ_QuoteModel> {
    // this.logger.info('saveQuote: ' + JSON.stringify(quoteModel));
    return await this.sfdcBaseService.saveQuoteCPQ(quoteModel);
  }

  public async saveQuote(quoteModel: CPQ_QuoteModel): Promise<CPQ_QuoteModel> {
    // this.logger.info('saveQuote: ' + JSON.stringify(quoteModel));
    return await this.sfdcBaseService.saveQuote(quoteModel, false);
  }

  public async saveQuoteAndDeleteExistingLines(quoteModel: CPQ_QuoteModel): Promise<CPQ_QuoteModel> {
    // this.logger.info('saveQuote: ' + JSON.stringify(quoteModel));
    return await this.sfdcBaseService.saveQuote(quoteModel, true);
  }

  public createQuoteLineModel(line: SBQQ__QuoteLine__c, key: number, parentItemKey?: number): CPQ_QuoteLineModel {
    const quoteLineModel = new CPQ_QuoteLineModel();
    quoteLineModel.record = line;
    quoteLineModel.record.setTypeAttribute();
    quoteLineModel.key = key;
    quoteLineModel.parentItemKey = parentItemKey;
    return quoteLineModel;
  }

  public async calculateQuote(quoteModel: CPQ_QuoteModel): Promise<CPQ_QuoteModel> {
    // this.logger.info('calculateQuote: ' + JSON.stringify(quoteModel));
    // new calculator 
    // https://developer.salesforce.com/docs/atlas.en-us.222.0.cpq_dev_plugins.meta/cpq_dev_plugins/cpq_dev_jsqcp_methods.htm
    // https://help.salesforce.com/s/articleView?id=sf.cpq_quote_calc_process.htm&type=5
    this.logger.info('starting calculateQuote: ', new Date());
    const calculator = new USSQuoteCalculatorPlugin();
    // get the data required for price rules
    const sfdcDataForPriceRules = await this.cpqPriceRulesEngineService.getSalesforceDataForRulesEngine(quoteModel);
    // execute On Initialization price rules
    quoteModel = this.cpqPriceRulesEngineService.runRulesSetForHook(quoteModel, sfdcDataForPriceRules, 'onInitialization');
    const initResp = await calculator.onInit(quoteModel.lineItems, this.sfdcBaseService.conn);
    // this.logger.info('initResp: ' + JSON.stringify(initResp));
    // execute Before Calculate price rules
    quoteModel = this.cpqPriceRulesEngineService.runRulesSetForHook(quoteModel, sfdcDataForPriceRules, 'beforeCalculate');
    const onBeforeCalculateResp = await calculator.onBeforeCalculate(quoteModel, quoteModel.lineItems, this.sfdcBaseService.conn);
    // this.logger.info('onBeforeCalculateResp: ' + JSON.stringify(onBeforeCalculateResp));
    // execute On Calculate price rules
    quoteModel = this.cpqPriceRulesEngineService.runRulesSetForHook(quoteModel, sfdcDataForPriceRules, 'onCalculate');
    // execute After Calculate price rules
    quoteModel = this.cpqPriceRulesEngineService.runRulesSetForHook(quoteModel, sfdcDataForPriceRules, 'afterCalculate');
    const onAfterCalculateResp = await calculator.onAfterCalculate(quoteModel, quoteModel.lineItems, this.sfdcBaseService.conn);
    // HACK: just running the rules again after calculations to get pricing right
    quoteModel = this.cpqPriceRulesEngineService.runRulesSetForHook(quoteModel, sfdcDataForPriceRules, 'afterCalculate');
    this.logger.info('finished calculateQuote: ', new Date());
    // this.logger.info('onAfterCalculateResp: ' + JSON.stringify(onAfterCalculateResp));
    // this.logger.info('calculateQuote: ' + JSON.stringify(quoteModel));
    return quoteModel;    
  }

  
}

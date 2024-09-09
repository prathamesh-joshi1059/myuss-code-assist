import { Injectable } from '@nestjs/common';
import { SfdcBaseService } from '../sfdc-base/sfdc-base.service';
import { SBQQ__Quote__c, SBQQ__Quote__c_DtoCreate } from '../../model/SBQQ__Quote__c';
import { LoggerService } from '../../../../core/logger/logger.service';
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

  async getCpqProduct(productId: string, context: object): Promise<any> {
    return await this.sfdcBaseService.patchApex(
      `/SBQQ/ServiceRouter?loader=SBQQ.ProductAPI.ProductLoader&uid=${productId}`,
      context,
    );
  }

  async getCpqProductOption(productId: string, context: object): Promise<any> {
    return await this.sfdcBaseService.patchApex(
      `/SBQQ/ServiceRouter?loader=SBQQ.ProductOptionAPI.ProductOptionLoader&uid=${productId}`,
      context,
    );
  }

  public async saveQuoteCPQ(quoteModel: CPQ_QuoteModel): Promise<CPQ_QuoteModel> {
    return await this.sfdcBaseService.saveQuoteCPQ(quoteModel);
  }

  public async saveQuote(quoteModel: CPQ_QuoteModel): Promise<CPQ_QuoteModel> {
    return await this.sfdcBaseService.saveQuote(quoteModel, false);
  }

  public async saveQuoteAndDeleteExistingLines(quoteModel: CPQ_QuoteModel): Promise<CPQ_QuoteModel> {
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
    this.logger.info('starting calculateQuote: ', new Date());
    const calculator = new USSQuoteCalculatorPlugin();
    const sfdcDataForPriceRules = await this.cpqPriceRulesEngineService.getSalesforceDataForRulesEngine(quoteModel);

    quoteModel = this.cpqPriceRulesEngineService.runRulesSetForHook(quoteModel, sfdcDataForPriceRules, 'onInitialization');
    await calculator.onInit(quoteModel.lineItems, this.sfdcBaseService.conn);

    quoteModel = this.cpqPriceRulesEngineService.runRulesSetForHook(quoteModel, sfdcDataForPriceRules, 'beforeCalculate');
    await calculator.onBeforeCalculate(quoteModel, quoteModel.lineItems, this.sfdcBaseService.conn);

    quoteModel = this.cpqPriceRulesEngineService.runRulesSetForHook(quoteModel, sfdcDataForPriceRules, 'onCalculate');
    quoteModel = this.cpqPriceRulesEngineService.runRulesSetForHook(quoteModel, sfdcDataForPriceRules, 'afterCalculate');
    await calculator.onAfterCalculate(quoteModel, quoteModel.lineItems, this.sfdcBaseService.conn);

    quoteModel = this.cpqPriceRulesEngineService.runRulesSetForHook(quoteModel, sfdcDataForPriceRules, 'afterCalculate');
    this.logger.info('finished calculateQuote: ', new Date());
    return quoteModel;    
  }
}
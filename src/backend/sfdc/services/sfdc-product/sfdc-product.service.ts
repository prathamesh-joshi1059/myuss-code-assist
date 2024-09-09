import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../../../core/logger/logger.service';
import { SfdcBaseService } from '../sfdc-base/sfdc-base.service';
import { PricebookEntry, Product2, SBQQ__ProductOption__c } from '../../model/Product2';
import { Pricebook2 } from '../../model/Pricebook';

@Injectable()
export class SfdcProductService {
  constructor(private logger: LoggerService, private sfdcBaseService: SfdcBaseService) {}

  async getProductList(): Promise<Product2[]> {
    const soql = `SELECT Id, ProductCode, Name, ProductType__c, Line_Type__c, SBQQ__SubscriptionType__c, Requires_Parent_Asset__c, AVA_SFCPQ__TaxCode__c, ProductCategory__c, Asset_Summary__c, Description2__c, Number_of_Services__c,
                (SELECT Id, SBQQ__OptionalSKU__c, SBQQ__OptionalSKU__r.Id, SBQQ__OptionalSKU__r.ProductCode, SBQQ__OptionalSKU__r.Name, 
                  SBQQ__OptionalSKU__r.ProductType__c, AdditionalOptions__c, SBQQ__Type__c, SBQQ__Feature__c 
                FROM SBQQ__Options__r 
                WHERE SBQQ__OptionalSKU__r.MyUSS_Eligible__c = TRUE
                    AND SBQQ__OptionalSKU__r.IsActive = TRUE),
                (SELECT Id 
                FROM PricebookEntries 
                WHERE Pricebook2.IsStandard = TRUE)
            FROM Product2
            WHERE MyUSS_Eligible__c = TRUE
            AND IsActive = TRUE`;

    const resp = await this.sfdcBaseService.getQuery(soql);

    const products = resp.records.map((record) => {
      const product = new Product2();
      product.Id = record.Id;
      product.ProductCode = record.ProductCode;
      product.Name = record.Name;
      product.ProductType__c = record.ProductType__c;
      product.Line_Type__c = record.Line_Type__c;
      product.SBQQ__SubscriptionType__c = record.SBQQ__SubscriptionType__c;
      product.Requires_Parent_Asset__c = record.Requires_Parent_Asset__c;
      product.AVA_SFCPQ__TaxCode__c = record.AVA_SFCPQ__TaxCode__c;
      product.ProductCategory__c = record.ProductCategory__c;
      product.Asset_Summary__c = record.Asset_Summary__c;
      product.Description2__c = record.Description2__c;
      product.Number_of_Services__c = record.Number_of_Services__c;

      product.SBQQ__Options__r = record.SBQQ__Options__r?.records.map((option) => {
        const opt = new SBQQ__ProductOption__c();
        opt.Id = option.Id;
        opt.SBQQ__OptionalSKU__c = option.SBQQ__OptionalSKU__c;
        opt.SBQQ__OptionalSKU__r = new Product2();
        opt.SBQQ__OptionalSKU__r.Id = option.SBQQ__OptionalSKU__r.Id;
        opt.SBQQ__OptionalSKU__r.ProductCode = option.SBQQ__OptionalSKU__r.ProductCode;
        opt.SBQQ__OptionalSKU__r.Name = option.SBQQ__OptionalSKU__r.Name;
        opt.SBQQ__OptionalSKU__r.ProductType__c = option.SBQQ__OptionalSKU__r.ProductType__c;
        opt.SBQQ__Type__c = option.SBQQ__Type__c;
        opt.SBQQ__Feature__c = option.SBQQ__Feature__c;
        opt.AdditionalOptions__c = option.AdditionalOptions__c;
        return opt;
      });
      
      product.PricebookEntries = record.PricebookEntries?.records.map((entry) => {
        const e = new PricebookEntry();
        e.Id = entry.Id;
        return e;
      });
      
      return product;
    });
    
    // this.logger.info(products);
    return products;
  }

  public async getStandardPricebook(): Promise<Pricebook2> {
    const resp = await this.sfdcBaseService.conn.sobject('Pricebook2').find({ IsStandard: true }).limit(1).execute();
    if (resp.length === 0) {
      throw new Error('No standard pricebook found');
    }
    
    const pricebook = new Pricebook2();
    pricebook.Id = resp[0].Id;
    pricebook.Name = resp[0].Name;
    pricebook.IsActive = resp[0].IsActive;
    pricebook.IsStandard = resp[0].IsStandard;
    pricebook.Description = resp[0].Description;
    
    return pricebook;
  }
}
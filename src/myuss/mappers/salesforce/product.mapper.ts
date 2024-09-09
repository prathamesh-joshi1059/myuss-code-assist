import { ProductModel, ProductOption } from '../../../myuss/models';
import { SBQQ__Product__c } from '../../../backend/sfdc/model/SBQQ__Product__c';
import { Product2, SBQQ__ProductOption__c  } from 'src/backend/sfdc/model/Product2';

export class SFDC_ProductMapper {
  public static getMyUSSProductFromSFDCProduct(sfProduct: SBQQ__Product__c): ProductModel {
    const product = new ProductModel();
    product.id = sfProduct.Id;
    product.productCode = sfProduct.ProductCode;
    product.name = sfProduct.Name;
    product.description = sfProduct.Description;
    product.assetSummary = sfProduct.Asset_Summary__c;
    product.applyFuelSurcharge = sfProduct.ApplyEnhancedSafetyFee__c;
    product.applyEnhancedSafetyFee = sfProduct.ApplyEnhancedSafetyFee__c;
    product.applyEEC = sfProduct.Apply_EEC__c;
    return product;
  }

  public static getMyUSSProductFromSFDCProductList(Product: Product2): ProductModel {
    const product = new ProductModel();
    product.id = Product.Id;
    product.productCode = Product.ProductCode;
    product.name = Product.Name;
    product.productType = Product.ProductType__c;
    product.requiredParentAsset = Product.Requires_Parent_Asset__c;
    product.avaSfcpqTaxcode = Product.AVA_SFCPQ__TaxCode__c;
    product.productCategory = Product.ProductCategory__c;
    product.productChargeType = Product.Line_Type__c;
    product.productSubscriptionType = Product.SBQQ__SubscriptionType__c;
    product.assetSummary = Product.Asset_Summary__c;
    product.description = Product.Description2__c;
    product.priceBookId = Product.PricebookEntries[0].Id;
    product.productOptions = Product.SBQQ__Options__r?.map((option) => {
      return this.getMyUSSProductOptionsFromSFDCProductListOption(option);
    });

    return product;
  }
  public static getMyUSSProductOptionsFromSFDCProductListOption(ProductOptionSfdc: SBQQ__ProductOption__c) {
    const productOption = new ProductOption();
    productOption.id = ProductOptionSfdc.Id;
    productOption.productId = ProductOptionSfdc.SBQQ__OptionalSKU__c;
    productOption.product = {
      id: ProductOptionSfdc.SBQQ__OptionalSKU__r.Id,
      productCode: ProductOptionSfdc.SBQQ__OptionalSKU__r.ProductCode,
      name: ProductOptionSfdc.SBQQ__OptionalSKU__r.Name,
      productType: ProductOptionSfdc.SBQQ__OptionalSKU__r.ProductType__c
    } as ProductModel
    productOption.additionalProductId = ProductOptionSfdc.AdditionalOptions__c;
    productOption.optionsNumber = ProductOptionSfdc.SBQQ__Number__c;
    productOption.optionsType = ProductOptionSfdc.SBQQ__Type__c;
    productOption.featureId = ProductOptionSfdc.SBQQ__Feature__c;
    return productOption;
  }
}

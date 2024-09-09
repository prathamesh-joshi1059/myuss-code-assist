import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Product2 } from '../../../backend/sfdc/model/Product2';
import { SfdcProductService } from '../../../backend/sfdc/services/sfdc-product/sfdc-product.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { TEMPLATES_DATA, TIMEMS_CACHE_PRODUCT, TIMEMS_CACHE_USER } from '../../../core/utils/constants';
import { ApiRespDTO } from '../../../common/dto/api-resp.dto';
import { AncillaryServiceDetails, AssetDetails, BundleDetails, ServiceDetails } from '../../models';
import { Pricebook2 } from '../../../backend/sfdc/model/Pricebook';
import { CacheService } from '../../../core/cache/cache.service';

@Injectable()
export class ProductsService {
  constructor(
    private logger: LoggerService,
    private sfdcProductService: SfdcProductService,
    private cacheService: CacheService
  ) {}

  async getProductsWrapper(): Promise<ApiRespDTO<Object>> {
    const products = await this.getProducts();
    this.logger.info(`productList: ${JSON.stringify(products)}`);

    if (!products) {
      throw new HttpException('Something went wrong getting products from Salesforce', 500);
    }
    if (products.length === 0) {
      return { status: HttpStatus.NOT_FOUND, message: 'Products not found' };
    }

    return {
      status: 200,
      message: 'Success',
      data: products,
    };
  }

  async getProducts(): Promise<Product2[]> {
    const productsString = null;

    if (productsString) {
      return JSON.parse(productsString) as Product2[];
    }

    const products = await this.sfdcProductService.getProductList();
    await this.cacheService.set('productList', JSON.stringify(products), TIMEMS_CACHE_PRODUCT);
    return products;
  }

  async getStandardPricebook(): Promise<Pricebook2> {
    const standardPricebookObj = await this.cacheService.get<string>('standardPricebook');

    if (standardPricebookObj) {
      return JSON.parse(standardPricebookObj);
    }

    const standardPricebook = await this.sfdcProductService.getStandardPricebook();
    await this.cacheService.set('standardPricebook', JSON.stringify(standardPricebook), TIMEMS_CACHE_USER);
    return standardPricebook;
  }

  async getStandardTemplate(): Promise<ApiRespDTO<Object>> {
    let productList = await this.cacheService.get<string>('bundleList');
    if (!productList) {
      //store in cache
      await this.getBundleList();
      productList = await this.cacheService.get<string>('bundleList');
    }

    const bundleArr: BundleDetails[] = JSON.parse(productList).bundle;
    const templates: any = TEMPLATES_DATA;

    for (const template of templates) {
      for (const bundle of template.products) {
        const assetId = bundle.asset.assetProductCode;
        bundleArr.forEach((bundleProduct: BundleDetails) => {
          bundleProduct.assetList.forEach((asset: AssetDetails) => {
            if (asset.assetProductCode === assetId) {
              bundle.asset.assetId = asset.id;
            }
          });
        });

        const serviceId = bundle.service.serviceProductCode;
        bundleArr.forEach((bundleProduct: BundleDetails) => {
          bundleProduct.serviceList.forEach((service: ServiceDetails) => {
            if (service.serviceProductCode === serviceId) {
              bundle.service.serviceId = service.id;
            }
          });
        });

        if (bundle.ancillary) {
          const ancillaryServiceId = bundle.ancillary.ancillaryServiceProductCode;
          bundleArr.forEach((bundleProduct: BundleDetails) => {
            bundleProduct.ancillaryServiceList.forEach((ancillaryService: AncillaryServiceDetails) => {
              if (ancillaryService.ancillaryServiceProductCode === ancillaryServiceId) {
                bundle.ancillary.ancillaryServiceId = ancillaryService.id;
              }
            });
          });
        }
      }
    }

    return {
      status: 1000,
      message: 'Success',
      success: true,
      data: templates,
    };
  }

  async getBundleList(): Promise<ApiRespDTO<Object>> {
    let bundleList = await this.cacheService.get<string>('bundleList');
    if (bundleList) {
      return {
        status: 1000,
        success: true,
        message: 'Success',
        data: {
          bundle: JSON.parse(bundleList).bundle,
        },
      };
    }

    const productList = await this.sfdcProductService.getProductList();
    const bundleProducts = productList.filter((product) => product.ProductType__c === 'Bundle');
    const bundles: BundleDetails[] = [];

    for (const bundleProduct of bundleProducts) {
      const assetList = bundleProduct.SBQQ__Options__r.filter(
        (asset) => asset.SBQQ__OptionalSKU__r.ProductType__c === 'Asset'
      );

      const serviceList = bundleProduct.SBQQ__Options__r.filter(
        (service) => service.SBQQ__OptionalSKU__r.ProductType__c === 'Service'
      );

      const ancillaryServiceList = bundleProduct.SBQQ__Options__r.filter(
        (ancillaryService) =>
          ancillaryService.SBQQ__OptionalSKU__r.ProductType__c === 'Ancillary Services' ||
          ancillaryService.SBQQ__OptionalSKU__r.ProductType__c === 'Ancillary Asset'
      );

      const assetArray: AssetDetails[] = [];
      for (const asset of assetList) {
        const filteredArr = productList.filter(
          (product) => product.ProductCode === asset.SBQQ__OptionalSKU__r.ProductCode
        );
        if (filteredArr.length > 0) {
          assetArray.push({
            id: asset.Id,
            assetName: filteredArr[0].Description2__c,
            assetProductCode: filteredArr[0].ProductCode,
            assetOptionalId: filteredArr[0].Id,
            assetTaxCode: filteredArr[0].AVA_SFCPQ__TaxCode__c,
          });
        }
      }

      const serviceArrary: ServiceDetails[] = [];
      for (const service of serviceList) {
        const filteredArr = productList.filter(
          (product) => product.ProductCode === service.SBQQ__OptionalSKU__r.ProductCode
        );
        if (filteredArr.length > 0) {
          serviceArrary.push({
            id: service.Id,
            serviceName: filteredArr[0].Description2__c,
            serviceProductCode: filteredArr[0].ProductCode,
            serviceOptionalId: filteredArr[0].Id,
            serviceTaxCode: filteredArr[0].AVA_SFCPQ__TaxCode__c,
            numberOfServices: filteredArr[0].Number_of_Services__c,
          });
        }
      }

      serviceArrary.sort((a, b) => (a.serviceName > b.serviceName ? 1 : -1));

      const ancillaryServiceArrary: AncillaryServiceDetails[] = [];
      for (const ancillaryService of ancillaryServiceList) {
        const filteredArr = productList.filter(
          (product) => product.ProductCode === ancillaryService.SBQQ__OptionalSKU__r.ProductCode
        );
        if (filteredArr.length > 0) {
          ancillaryServiceArrary.push({
            id: ancillaryService.Id,
            ancillaryServiceName: filteredArr[0].Description2__c,
            ancillaryServiceProductCode: filteredArr[0].ProductCode,
            ancillaryServiceOptionalId: filteredArr[0].Id,
          });
        }
      }

      bundles.push({
        bundleId: bundleProduct.Id,
        bundleName: bundleProduct.Name,
        bundleProductCode: bundleProduct.ProductCode,
        assetList: assetArray,
        serviceList: serviceArrary,
        ancillaryServiceList: ancillaryServiceArrary,
      });
    }

    await this.cacheService.set('bundleList', JSON.stringify({ bundle: bundles }), TIMEMS_CACHE_PRODUCT);
    return {
      status: 1000,
      success: true,
      message: 'Success',
      data: { bundle: bundles },
    };
  }
}
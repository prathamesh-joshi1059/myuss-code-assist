import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Product2 } from '../../../backend/sfdc/model/Product2';
import { SfdcProductService } from '../../../backend/sfdc/services/sfdc-product/sfdc-product.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { TEMPLATES_DATA, TIMEMS_CACHE_PRODUCT, TIMEMS_CACHE_USER } from '../../../core/utils/constants';
import { ApiRespDTO } from '../../../common/dto/api-resp.dto';
import { AncillaryServiceDetails, AssetDetails, BundleDetails, ServiceDetails } from '../../models';
import { Pricebook2 } from '../../../backend/sfdc/model/Pricebook';
import { CacheService } from '../../../core/cache/cache.service';
import { FirestoreService } from '../../../backend/google/firestore/firestore.service';



@Injectable()
export class ProductsService {
  constructor(
    private logger: LoggerService,
    private sfdcProductService: SfdcProductService,
    private cacheService: CacheService,
    private firestoreService: FirestoreService,

    
  ) {}

  async getProductsWrapper(): Promise<ApiRespDTO<Object>> {
    const products = await this.getProducts();
    this.logger.info(`productList: ${JSON.stringify(products)}`);
    if (products == undefined) {
      throw new HttpException('Something went wrong getting products from Salesforce', 500);
    }
    if (products.length == 0) {
      return { status: HttpStatus.NOT_FOUND, message: 'Products not found' };
    }
    const respObj = {
      status: 200,
      message: 'Success',
      data: products,
    };
    return respObj;
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

  //TODO: map the SFDC object to a MyUSS object
  async getStandardPricebook(): Promise<Pricebook2> {
    const standardPricebookObj = await this.cacheService.get<string>('standardPricebook');

    if (standardPricebookObj) {
      let standardPricebook = JSON.parse(standardPricebookObj);
      return standardPricebook;
    } else {
      const standardPricebook = await this.sfdcProductService.getStandardPricebook();
      await this.cacheService.set('standardPricebook', JSON.stringify(standardPricebook), TIMEMS_CACHE_USER);
      return standardPricebook;
    }
  }

  async getStandardTemplate(): Promise<ApiRespDTO<Object>> {
    let productList = await this.cacheService.get<string>('bundleList');
    if (!productList) {
      //store in cache
      await this.getBundleList();
      productList = await this.cacheService.get<string>('bundleList');
    }
    let bundleArr: BundleDetails[] = JSON.parse(productList).bundle;
    let templates: any = TEMPLATES_DATA;
    for (const template of templates) {
      for (const bundle of template.products) {
        let assetId = bundle.asset.assetProductCode;
        bundleArr.filter((bundleProduct: BundleDetails) => {
          bundleProduct.assetList.filter((asset: AssetDetails) => {
            if (asset.assetProductCode == assetId) {
              bundle.asset.assetId = asset.id;
            }
          });
        });
        let serviceId = bundle.service.serviceProductCode;
        bundleArr.filter((bundleProduct: BundleDetails) => {
          bundleProduct.serviceList.filter((service: ServiceDetails) => {
            if (service.serviceProductCode == serviceId) {
              bundle.service.serviceId = service.id;
            }
          });
        });
        try {
          // only do this if there is an ancillary service
          if (bundle.ancillary) {
            let ancillaryServiceId = bundle.ancillary.ancillaryServiceProductCode;
            bundleArr.filter((bundleProduct: BundleDetails) => {
              bundleProduct.ancillaryServiceList.filter((ancillaryService: AncillaryServiceDetails) => {
                if (ancillaryService.ancillaryServiceProductCode == ancillaryServiceId) {
                  bundle.ancillary.ancillaryServiceId = ancillaryService.id;
                }
              });
            });
          }
        } catch (err) {
          this.logger.error('In catch -ancillaryServiceId', err);
        }
      }
    }
    const respObj = {
      status: 1000,
      message: 'Success',
      success: true,
      data: templates,
    };
    return respObj;
  }
  async getBundleList(): Promise<ApiRespDTO<Object>> {
    let bundleList = await this.cacheService.get<string>('bundleList');
    if (bundleList) {
      const respObj = {
        status: 1000,
        success: true,
        message: 'Success',
        data: {
          bundle: JSON.parse(bundleList).bundle,
        },
      };
      return respObj;
    }

    const productList = await this.sfdcProductService.getProductList();
    let bundleProducts = productList.filter((product) => product.ProductType__c == 'Bundle');
    let bundles = [];
    for (const bundleProduct of bundleProducts) {
      let assetList = bundleProduct.SBQQ__Options__r.filter(
        (asset) => asset.SBQQ__OptionalSKU__r.ProductType__c == 'Asset',
      );

      let serviceList = bundleProduct.SBQQ__Options__r.filter(
        (service) => service.SBQQ__OptionalSKU__r.ProductType__c == 'Service',
      );

      let ancillaryServiceList = bundleProduct.SBQQ__Options__r.filter(
        (ancillaryService) =>
          ancillaryService.SBQQ__OptionalSKU__r.ProductType__c == 'Ancillary Services' ||
          ancillaryService.SBQQ__OptionalSKU__r.ProductType__c == 'Ancillary Asset',
      );

      let assetArray = [];
      for (const asset of assetList) {
        let filteredArr = productList.filter(
          (product) => product.ProductCode == asset.SBQQ__OptionalSKU__r.ProductCode,
        );
        let assetObj: AssetDetails = {
          id: asset.Id,
          assetName: filteredArr[0].Description2__c,
          assetProductCode: filteredArr[0].ProductCode,
          assetOptionalId: filteredArr[0].Id,
          assetTaxCode: filteredArr[0].AVA_SFCPQ__TaxCode__c,
        };
        assetArray.push(assetObj);
      }
      let serviceArrary = [];
      for (const service of serviceList) {
        let filteredArr = productList.filter(
          (product) => product.ProductCode == service.SBQQ__OptionalSKU__r.ProductCode,
        );
        let serviceObj: ServiceDetails = {
          id: service.Id,
          serviceName: filteredArr[0].Description2__c,
          serviceProductCode: filteredArr[0].ProductCode,
          serviceOptionalId: filteredArr[0].Id,
          serviceTaxCode: filteredArr[0].AVA_SFCPQ__TaxCode__c,
          numberOfServices: filteredArr[0].Number_of_Services__c,
        };
        serviceArrary.push(serviceObj);
      }
      serviceArrary.sort((a, b) => (a.serviceName > b.serviceName ? 1 : -1));
      let ancillaryServiceArrary = [];
      for (const ancillaryService of ancillaryServiceList) {
        let filteredArr = productList.filter(
          (product) => product.ProductCode == ancillaryService.SBQQ__OptionalSKU__r.ProductCode,
        );
        let aServiceObj: AncillaryServiceDetails = {
          id: ancillaryService.Id,
          ancillaryServiceName: filteredArr[0].Description2__c,
          ancillaryServiceProductCode: filteredArr[0].ProductCode,
          ancillaryServiceOptionalId: filteredArr[0].Id,
        };
        ancillaryServiceArrary.push(aServiceObj);
      }
      let bundle: BundleDetails = {
        bundleId: bundleProduct.Id,
        bundleName: bundleProduct.Name,
        bundleProductCode: bundleProduct.ProductCode,
        assetList: assetArray,
        serviceList: serviceArrary,
        ancillaryServiceList: ancillaryServiceArrary,
      };
      bundles.push(bundle);
    }
    this.cacheService.set('bundleList', JSON.stringify({ bundle: bundles }), TIMEMS_CACHE_PRODUCT);
    const respObj = {
      status: 1000,
      success: true,
      message: 'Success',
      data: {
        bundle: bundles,
      },
    };
    return respObj;
  }
}

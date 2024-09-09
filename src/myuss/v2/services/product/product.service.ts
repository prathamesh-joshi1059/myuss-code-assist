import { QueryDocumentSnapshot } from "@google-cloud/firestore";
import { Injectable } from "@nestjs/common";
import { FirestoreService } from "src/backend/google/firestore/firestore.service";
import { Product2 } from "src/backend/sfdc/model/Product2";
import { SfdcProductService } from "src/backend/sfdc/services/sfdc-product/sfdc-product.service";
import { ApiRespDTO } from "src/common/dto/api-resp.dto";
import { CacheService } from "src/core/cache/cache.service";
import { LoggerService } from "src/core/logger/logger.service";
import { SFDC_ProductMapper } from "src/myuss/mappers/salesforce/product.mapper";
import { PlytixProduct, ProductModel, ProductModelWithPlytixInfo } from "src/myuss/models";

@Injectable()
export class ProductsServiceV2 {
  constructor(
    private logger: LoggerService,
    private sfdcProductService: SfdcProductService,
    private cacheService: CacheService,
    private firebaseService: FirestoreService
  ) {}

  async getBundleList(): Promise<ApiRespDTO<ProductModelWithPlytixInfo[]> | null> {
    try {
      const sfdcProductList = await this.sfdcProductService.getProductList();

      const productList = sfdcProductList.map((product: Product2) =>
        SFDC_ProductMapper.getMyUSSProductFromSFDCProductList(product)
      );

      const plytixProductsCollection = await this.firebaseService.getCollectionDocs('plytixProducts');

      // mapping firestore data to PlytixProduct model
      const plytixProducts = plytixProductsCollection.map((doc: QueryDocumentSnapshot) => {
        const plytixProduct = new PlytixProduct();
        Object.assign(plytixProduct, doc.data());
        return plytixProduct;
      });

      // merge plytixProducts with productList
      const mergedProducts: ProductModelWithPlytixInfo[] = this.mapPlytixProductsInfo(plytixProducts, productList);

      return {
        status: 1000,
        success: true,
        message: 'Success',
        data: mergedProducts,
      };
    } catch (err) {
      this.logger.error(`Error in getBundleListV2: ${err}`);
      return null;
    }
  }

  mapPlytixProductsInfo(
    plytixProducts: PlytixProduct[],
    productList: ProductModel[]
  ): ProductModelWithPlytixInfo[] {
    const infoMap = plytixProducts.reduce((map, info) => {
      map[info.sku] = info;
      return map;
    }, {} as Record<string, PlytixProduct>);

    return productList.map(product => {
      const plytixFields = infoMap[product.productCode];

      // Use Object.assign to add the plytixProducts property if it exists
      return plytixFields !== undefined ? Object.assign({}, product, plytixFields) : product;
    });
  }
}
import {IsArray, IsNumber, IsOptional, IsString, IsNotEmpty} from 'class-validator';

export class AddProductAndCalculateReqDTO {
    @IsNotEmpty()
    @IsString()
    quoteId: string;
    @IsNotEmpty()
    @IsString()
    accountId: string;
    @IsNotEmpty()
    @IsString()
    contactId: string;
    @IsNotEmpty()
    @IsString()
    startDate: string;
    @IsNotEmpty()
    @IsString()
    endDate: string;
    @IsNotEmpty()
    @IsString()
    orderType: string;
    @IsNotEmpty()
    @IsString()
    zipcode: string;
    @IsString()
    duration: string;
    @IsNotEmpty()
    @IsString()
    billTiming: string;
    @IsNotEmpty()
    @IsString()
    billingPeriod: string;
    @IsNotEmpty()
    @IsString()
    customerType: string;
    @IsNotEmpty()
    @IsString()
    businessType: string;
    @IsNotEmpty()
    @IsString()
    prodSubType: string;
    @IsNotEmpty()
    @IsArray()
    productDetails: ProductDetails[];
    @IsNotEmpty()
    @IsString()
    addressId: string;
    @IsString()
    estimatedEndDate:string;
  }
  export class ProductDetails {
    @IsNotEmpty()
    @IsString()
    productIdBundle: string;
    @IsNotEmpty()
    @IsString()
    productOptionSkuBundle: string;
    @IsNotEmpty()
    @IsString()
    bundleSummery: string;
    @IsNotEmpty()
    @IsString()
    bundleQty: number;
    @IsNotEmpty()
    @IsString()
    productIdService: string;
    @IsNotEmpty()
    @IsString()
    productOptionSkuService: string;
    @IsNotEmpty()
    @IsString()
    serviceSummery: string;
    @IsNotEmpty()
    @IsString()
    serviceTaxcode: string;
    @IsNotEmpty()
    @IsString()
    productIdAsset: string;
    @IsNotEmpty()
    @IsString()
    productOptionSkuAsset: string;
    @IsNotEmpty()
    @IsString()
    assetSummary: string;
    @IsNotEmpty()
    @IsString()
    assetTaxcode: string;
    @IsNotEmpty()
    @IsString()
    pricebookEntryIdBundle: string;
    @IsNotEmpty()
    @IsString()
    pricebookEnteryIdService: string;
    @IsNotEmpty()
    @IsString()
    pricebookEnteryIdAsset: string;
    @IsNotEmpty()
    @IsArray()
    additionalProduct: AdditionalProduct[];
  }
  export class Bundle {
    @IsString()
    bundleId: string;
    @IsNumber()
    quantity: number;
    bundleProduct: BundleProduct;
    assetProduct: BundleProduct;
    serviceProduct: BundleProduct;
    @IsArray()
    additionalProducts: BundleProduct[];
    deliveryProduct: BundleProduct;
    pickupProduct: BundleProduct;
  }
  export class BundleProduct {
    @IsString()
    id: string;
    @IsString()
    name: string;
    @IsString()
    summary: string;
    @IsString()
    productCode: string;
    @IsString()
    taxCode: string;
    @IsString()
    priceBookEntryId: string;
    @IsString()
    productOptionId: string;
  }
  export class AdditionalProduct {
    @IsString()
    productIdAS: string;
    @IsString()
    productOptionSkuAS: string;
    @IsString()
    aSSummery: string;
    @IsString()
    aSTaxCode: string;
  }
  export class MockFailResponse {
    "status": 500
    "message": "Fail"
    "data": {}
  }
  export class MockSuccessResponse {
    "status": 200
    "message": "Success"
    "data": {
        "quoteId": "a6O8I000000HDlUUAW"
    }
}
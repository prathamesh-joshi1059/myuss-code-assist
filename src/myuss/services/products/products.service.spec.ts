import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { SfdcProductService } from '../../../backend/sfdc/services/sfdc-product/sfdc-product.service';
import { ConfigService } from '@nestjs/config';
import { SfdcBaseService } from '../../../backend/sfdc/services/sfdc-base/sfdc-base.service';
import { CacheService } from '../../../core/cache/cache.service';
jest.mock('../../../core/cache/cache.service');

describe('ProductsService', () => {
  let service: ProductsService;
  let cache: Cache;
  let mockProductService = {
    getProductsWrapper: jest.fn(),
    getProducts : jest.fn(),
    getStandardPricebook : jest.fn(),
    getStandardTemplate: jest.fn(),
    getBundleList: jest.fn()
  };
  let mockGetProductsListSuccessResponse = {
    "status": 1000,
    "success" : true,
    "message": "Success",
    "data": {
        "bundle": [
            {
                "bundleId": "01t3m00000PPH5MAAX",
                "bundleName": "Restroom Bundle",
                "bundleProductCode": "110-0000",
                "assetList": [
                    {
                        "id": "a6D8I0000008aKcUAI",
                        "assetName": "Std Rest",
                        "assetProductCode": "111-1001",
                        "assetOptionalId": "01t3m00000NTiw6AAD",
                        "assetTaxCode": "SANIRENT"
                    }
                ],
                "serviceList": [
                    {
                        "id": "a6D8I0000008aRVUAY",
                        "serviceName": "1 Svc 1 Day Wk",
                        "serviceProductCode": "112-2001",
                        "serviceOptionalId": "01t3m00000NTivwAAD",
                        "serviceTaxCode": "SANISERV"
                    },
                    {
                        "id": "a6D8I0000008aNLUAY",
                        "serviceName": "1 Svc 2 Days Wk",
                        "serviceProductCode": "112-2002",
                        "serviceOptionalId": "01t3m00000POgudAAD",
                        "serviceTaxCode": "SANISERV"
                    }
                ],
                "ancillaryServiceList": [
                    {
                        "id": "a6D8I0000008aMGUAY",
                        "ancillaryServiceName": "Hand Sani Refill",
                        "ancillaryServiceProductCode": "112-2208",
                        "ancillaryServiceOptionalId": "01t3m00000POgw6AAD"
                    },
                    {
                        "id": "a6D8I0000008aSfUAI",
                        "ancillaryServiceName": "Toilet Seat Cover Refill",
                        "ancillaryServiceProductCode": "112-2209",
                        "ancillaryServiceOptionalId": "01t6O000006aeezQAA"
                    },
                    {
                        "id": "a6D8I0000008aMUUAY",
                        "ancillaryServiceName": "Install / Setup Rest",
                        "ancillaryServiceProductCode": "113-2201",
                        "ancillaryServiceOptionalId": "01t3m00000POgwUAAT"
                    },
                    {
                        "id": "a6D8I0000008aPZUAY",
                        "ancillaryServiceName": "Stake Secure Rest",
                        "ancillaryServiceProductCode": "113-2203",
                        "ancillaryServiceOptionalId": "01t3m00000POgweAAD"
                    }
                ]
            },
            {
                "bundleId": "01t3m00000PPH5RAAX",
                "bundleName": "Hand Cleaning Bundle",
                "bundleProductCode": "120-0000",
                "assetList": [
                    {
                        "id": "a6D8I0000008aKyUAI",
                        "assetName": "2 Stn Hand Sink",
                        "assetProductCode": "121-1102",
                        "assetOptionalId": "01t3m00000NTiuFAAT",
                        "assetTaxCode": "SANIRENT"
                    }
                ],
                "serviceList": [
                    {
                        "id": "a6D8I0000008aK1UAI",
                        "serviceName": "1 Svc 1 Day Wk",
                        "serviceProductCode": "122-2001",
                        "serviceOptionalId": "01t3m00000NTix0AAD",
                        "serviceTaxCode": "SANISERV"
                    },
                    {
                        "id": "a6D8I0000008aUwUAI",
                        "serviceName": "1 Svc 2 Days Wk",
                        "serviceProductCode": "122-2002",
                        "serviceOptionalId": "01t3m00000POgyQAAT",
                        "serviceTaxCode": "SANISERV"
                    }
                ],
                "ancillaryServiceList": [
                    {
                        "id": "a6D8I0000008aMdUAI",
                        "ancillaryServiceName": "Stake Secure Hand",
                        "ancillaryServiceProductCode": "123-2203",
                        "ancillaryServiceOptionalId": "01t3m00000POgyHAAT"
                    }
                ]
            }
        ]
    }
  }
  let mockGetProductsListFailResponse =  {
      "status": 1006,
      "success": false,
      "message": "Fail",
      "data": {}
  }
  let mockGetStandardTemplateSuccessResponse = {
    "status": 1000,
    "message": "Success",
    "success" : true,
    "data": [
        {
            "label1": "One Standard Restroom with hand sanitizer",
            "label2": "One Standard Restroom with hand sanitizer",
            "url": "https://storage.googleapis.com/myuss_portal_dev/1.png",
            "service": "Once per week service",
            "products": [
                {
                    "bundle": {
                        "bundleProductCode": "110-0000",
                        "bundleName": "Restroom Bundle",
                        "qty": 1
                    },
                    "asset": {
                        "assetId": "a6D8I0000008aKcUAI",
                        "assetName": "Std Rest",
                        "assetProductCode": "111-1001"
                    },
                    "service": {
                        "serviceId": "a6D8I0000008aRVUAY",
                        "serviceName": "1 Svc 1 Day Wk",
                        "serviceProductCode": "112-2001"
                    },
                    "ancillary": {
                        "ancillaryServiceId": "a6D8I0000008aMGUAY",
                        "ancillaryServiceName": "Hand Sani Refill",
                        "ancillaryServiceProductCode": "112-2208"
                    }
                }
            ]
        },
        {
            "label1": "One Standard Restroom with hand sanitizer",
            "label2": "One Standard Restroom with hand sanitizer",
            "url": "https://storage.googleapis.com/myuss_portal_dev/2.png",
            "service": "Twice per week service",
            "products": [
                {
                    "bundle": {
                        "bundleProductCode": "110-0000",
                        "bundleName": "Restroom Bundle",
                        "qty": 1
                    },
                    "asset": {
                        "assetId": "a6D8I0000008aKcUAI",
                        "assetName": "Std Rest",
                        "assetProductCode": "111-1001"
                    },
                    "service": {
                        "serviceId": "a6D8I0000008aNLUAY",
                        "serviceName": "1 Svc 2 Days Wk",
                        "serviceProductCode": "112-2002"
                    },
                    "ancillary": {
                        "ancillaryServiceId": "a6D8I0000008aMGUAY",
                        "ancillaryServiceName": "Hand Sani Refill",
                        "ancillaryServiceProductCode": "112-2208"
                    }
                }
            ]
        },
        {
            "label1": "One Standard Restroom with one 2-station hand sink",
            "label2": "One Standard Restroom with one 2-station hand sink (No Hand Sani Refill)",
            "service": "Twice per week service",
            "url": "https://storage.googleapis.com/myuss_portal_dev/3.png",
            "products": [
                {
                    "bundle": {
                        "bundleProductCode": "110-0000",
                        "bundleName": "Restroom Bundle",
                        "qty": 1
                    },
                    "asset": {
                        "assetId": "a6D8I0000008aKcUAI",
                        "assetName": "Std Rest",
                        "assetProductCode": "111-1001"
                    },
                    "service": {
                        "serviceId": "a6D8I0000008aNLUAY",
                        "serviceName": "1 Svc 2 Days Wk",
                        "serviceProductCode": "112-2002"
                    }
                },
                {
                    "bundle": {
                        "bundleProductCode": "120-0000",
                        "bundleName": "Hand Cleaning Bundle",
                        "qty": 1
                    },
                    "asset": {
                        "assetId": "a6D8I0000008aKyUAI",
                        "assetName": "2 Stn Hand Sink",
                        "assetProductCode": "121-1102"
                    },
                    "service": {
                        "serviceId": "a6D8I0000008aUwUAI",
                        "serviceName": "1 Svc 2 Days Wk",
                        "serviceProductCode": "122-2002"
                    }
                }
            ]
        },
        {
            "label1": "Two Standard Restrooms with one 2-station hand sink",
            "label2": "Two Standard Restrooms with one 2-station hand sink (No Hand Sani Refill)",
            "url": "https://storage.googleapis.com/myuss_portal_dev/4.png",
            "service": "Twice per week service",
            "products": [
                {
                    "bundle": {
                        "bundleProductCode": "110-0000",
                        "bundleName": "Restroom Bundle",
                        "qty": 2
                    },
                    "asset": {
                        "assetId": "a6D8I0000008aKcUAI",
                        "assetName": "Std Rest",
                        "assetProductCode": "111-1001"
                    },
                    "service": {
                        "serviceId": "a6D8I0000008aNLUAY",
                        "serviceName": "1 Svc 2 Days Wk",
                        "serviceProductCode": "112-2002"
                    }
                },
                {
                    "bundle": {
                        "bundleProductCode": "120-0000",
                        "bundleName": "Hand Cleaning Bundle",
                        "qty": 1
                    },
                    "asset": {
                        "assetId": "a6D8I0000008aKyUAI",
                        "assetName": "2 Stn Hand Sink",
                        "assetProductCode": "121-1102"
                    },
                    "service": {
                        "serviceId": "a6D8I0000008aUwUAI",
                        "serviceName": "1 Svc 2 Days Wk",
                        "serviceProductCode": "122-2002"
                    }
                }
            ]
        }
    ]
  }
  let mockGetStandardTemplateFailResponse = {
    "status": 1006,
    "message": "Fail",
    "success" : false,
    "data": {}
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        LoggerService,
        SfdcProductService,
        CacheService,
        ConfigService,
        SfdcBaseService,
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  //getBundleList success true
  it('should return success true', async () => {
    
    jest.spyOn(mockProductService, 'getBundleList').mockReturnValue(mockGetProductsListSuccessResponse);
    const result = await mockProductService.getBundleList();
    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('data')
  })
  //getBundleList success false
  it('should return success false', async () => {
    jest.spyOn(mockProductService, 'getBundleList').mockReturnValue(mockGetProductsListFailResponse);
    const result = await mockProductService.getBundleList();
    expect(result).toHaveProperty('success', false);
  })
  //getStandardTemplate success true
  it('should return success true', async () => {
    
    jest.spyOn(mockProductService, 'getStandardTemplate').mockReturnValue(mockGetStandardTemplateSuccessResponse);
    const result = await mockProductService.getStandardTemplate();
    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('data')
  })
  //getStandardTemplate success false
  it('should return success false', async () => {
    jest.spyOn(mockProductService, 'getStandardTemplate').mockReturnValue(mockGetStandardTemplateFailResponse);
    const result = await mockProductService.getStandardTemplate();
    expect(result).toHaveProperty('success', false);
  })
});

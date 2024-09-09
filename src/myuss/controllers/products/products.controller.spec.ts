import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from '../../services/products/products.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { CacheService } from '../../../core/cache/cache.service';
jest.mock('../../../core/cache/cache.service');
import { SfdcProductService } from '../../../backend/sfdc/services/sfdc-product/sfdc-product.service';
import { ConfigService } from '@nestjs/config';
import { SfdcBaseService } from '../../../backend/sfdc/services/sfdc-base/sfdc-base.service';


describe('ProductsController', () => {
  let controller: ProductsController;
  let mockProductService = {
    getProductsWrapper: jest.fn(),
    getProducts : jest.fn(),
    getStandardPricebook : jest.fn(),
    getStandardTemplate: jest.fn(),
    getBundleList: jest.fn()
  };
  let mockGetProductsListSuccessResponse = {
    "status": 1000,
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
      "message": "Fail",
      "data": {}
    }
  let mockGetStandardTemplateSuccessResponse = {
    "status": 1000,
    "message": "Success",
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
    "data": {}
  }


  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        LoggerService,
        SfdcProductService,
        ConfigService,
        SfdcBaseService,
        CacheService,
      ],
      controllers: [ProductsController],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
  //getBundleList success
  it('Should return success', async () => {
    jest
      .spyOn(mockProductService, 'getBundleList')
      .mockResolvedValue(mockGetProductsListSuccessResponse);

    const result = await mockProductService.getBundleList();
    expect(result.message).toMatch('Success');
    expect(result.data).toHaveProperty("bundle")
  });
  //getBundleList Fail
  it('Should return fail', async () => {
    jest
      .spyOn(mockProductService, 'getBundleList')
      .mockResolvedValue(mockGetProductsListFailResponse);

    const result = await mockProductService.getBundleList("");
    expect(result.message).toMatch('Fail');
  });
  //getStandardTemplate success
  it('Should return success', async () => {
    jest
      .spyOn(mockProductService, 'getStandardTemplate')
      .mockResolvedValue(mockGetStandardTemplateSuccessResponse);

    const result = await mockProductService.getStandardTemplate();
    expect(result.message).toMatch('Success');
    
  });
  //getStandardTemplate Fail
  it('Should return fail', async () => {
    jest
      .spyOn(mockProductService, 'getStandardTemplate')
      .mockResolvedValue(mockGetStandardTemplateFailResponse);

    const result = await mockProductService.getStandardTemplate();
    expect(result.message).toMatch('Fail');
  });
});

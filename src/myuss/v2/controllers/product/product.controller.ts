import { Controller, Get, UseGuards, UseFilters } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ThrottlerExceptionFilter } from 'src/core/utils/rate-limiting-exception/throttler-exception-filter';
import { ProductsServiceV2 } from 'src/myuss/v2/services/product/product.service';

@UseFilters(ThrottlerExceptionFilter)
@ApiBearerAuth()
@ApiTags('v2')
@Controller({ path: 'api/products', version: '2' })
@UseGuards(AuthGuard('jwt'))
export class ProductsControllerV2 {
  constructor(private productsService: ProductsServiceV2) {}

  @Get('list')
  async getProductsListV2() {
    const bundleListResp = await this.productsService.getBundleList();

    if (bundleListResp.success) {
      return {
        status: 1000,
        message: 'Success',
        data: bundleListResp.data,
      };
    } else {
      return {
        status: 1006,
        message: 'Error while fetching products',
        data: {},
      };
    }
  }
}
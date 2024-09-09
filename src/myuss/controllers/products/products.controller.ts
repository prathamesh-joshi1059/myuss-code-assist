import { Controller, Get, UseGuards, UseFilters } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProductsService } from '../../services/products/products.service';
import { ApiRespDTO } from '../../../common/dto/api-resp.dto';
import { ApiBadRequestResponse, ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ThrottlerExceptionFilter } from '../../../core/utils/rate-limiting-exception/throttler-exception-filter';

@UseFilters(ThrottlerExceptionFilter)
@ApiBearerAuth()
@ApiTags('products')
@Controller('api/products')
@UseGuards(AuthGuard('jwt'))
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get('list')
  @ApiResponse({ status: 1000, description: 'Success', type: ApiRespDTO })
  @ApiBadRequestResponse({ status: 400, description: 'Error in getting products' })
  async getProductsList(): Promise<ApiRespDTO<Object>> {
    const bundleListResp = await this.productsService.getBundleList();

    return {
      status: bundleListResp.success ? 1000 : 1006,
      message: bundleListResp.success ? 'Success' : 'Error while fetching products',
      data: bundleListResp.success ? bundleListResp.data : {},
    };
  }

  @Get('standard/template')
  async getStandardTemplate(): Promise<ApiRespDTO<Object>> {
    const templateResp = await this.productsService.getStandardTemplate();

    return {
      status: templateResp.success ? 1000 : 1006,
      message: templateResp.success ? 'Success' : 'Fail',
      data: templateResp.success ? templateResp.data : {},
    };
  }
}
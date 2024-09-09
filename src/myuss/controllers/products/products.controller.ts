import { Controller, Get, Req, UseGuards, UseFilters } from '@nestjs/common';
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

  constructor(private productsService: ProductsService) {
  }

  @Get('list')
      //Open API Documentation - Expected Success Response
    @ApiResponse({ status:1000,description: "Success",type: ApiRespDTO})

    @ApiBadRequestResponse({ status: 400, description: 'Error in getting products' })
  async getProductsList(): Promise<ApiRespDTO<Object>> {
    const bundleListResp = await this.productsService.getBundleList();
    
    if (bundleListResp.success) {
      return {
        status: 1000,
        message: 'Success',
        data: bundleListResp.data
      };
    }else{
      return {
        status: 1006,
        message: 'Error while fetching products',
        data: { }
      };
    }
  }
 
  @Get('standard/template')
  async getStandardTemplate() {
    let templateResp = await this.productsService.getStandardTemplate();
    if (templateResp.success) {
      return {
        status: 1000,
        message: 'Success',
        data: templateResp.data
      };
    }else{
      return {
        status: 1006,
        message: 'Fail',
        data: { }
      };
    }
  }

 
}

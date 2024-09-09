import {
    Body,
    Get,
    Param,
    Post,
    Res,
    StreamableFile,
    UseGuards,
    Request,
    UseFilters,
    Query,
    Put,
    Delete,
    Version,
    Controller
  } from '@nestjs/common';
  
  import { AuthGuard } from '@nestjs/passport';
 
  import { ApiBearerAuth, ApiInternalServerErrorResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ApiRespDTO } from '../../../../common/dto/api-resp.dto';
import { CacheService } from '../../../../core/cache/cache.service';
import { LoggerService } from '../../../../core/logger/logger.service';
import { ThrottlerExceptionFilter } from '../../../../core/utils/rate-limiting-exception/throttler-exception-filter';
import { AccountIdGuard } from '../../../../myuss/custom-guard/accountId.guard';
// import { QuoteService } from '../../../../myuss/services/quote/quote.service';
import { UserService } from '../../../../myuss/services/user/user.service';
import { QuoteServiceV2 } from '../../services/quote/quote.service';
import { AddProductAndCalculateReqDTO } from './dto/add-product-calculate-req.dto';
import { CreateInitialQuoteReqDTO } from './dto/create-initial-quote-req.dto';
import { QuoteIdGuard } from '../../../../myuss/custom-guard/quoteId.guard';
import { QuoteModel } from 'src/myuss/models';


  //@Version('2')
  @ApiTags('v2')
  @ApiBearerAuth()
  @UseFilters(ThrottlerExceptionFilter)
  @Controller({ path: 'api/quotes', version: '2' })
  @UseGuards(AuthGuard('jwt'))
  export class QuoteV2Controller {
    constructor(
      private userService: UserService,
      private quoteService: QuoteServiceV2,
      private logger: LoggerService,
      private cacheService: CacheService,
    ) {}
  
    //unit and services step 1 part 1 create quote object with default values.
    @UseGuards(AccountIdGuard)
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error' })
    @Post('create-quote')
    async createInitialQuote(
      @Request() req,
      @Body() body: CreateInitialQuoteReqDTO,
      @Param('accountId') accountId: string,
    ): Promise<ApiRespDTO<Object>> {
     
      this.logger.info("req.user.sub",req.user.sub);
      const createQuoteResp = await this.quoteService.createInitialQuote(
        body,
        accountId,
        req.user.sub,
      );
  
      if (createQuoteResp.success) {
        await this.userService.updateCache(
          'quote',
          req.user.sub,
          { id: createQuoteResp.data['quoteId'] },
          body.accountId
        );
      }
      this.logger.info(createQuoteResp);
      return createQuoteResp;
    }

  @UseGuards(AccountIdGuard)
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @Post('update-quote')
  async addProductAndSave(@Request() req, @Body() request: AddProductAndCalculateReqDTO): Promise<ApiRespDTO<Object>> {
    const updateQuoteResp = await this.quoteService.addProductAndSave(request, req.user?.sub,req.query.accountId);
    return updateQuoteResp;
  }


  //get quote details
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @UseGuards(QuoteIdGuard)
  @Get(':id')
  async getQuote(@Param('id') id: string): Promise<ApiRespDTO<QuoteModel | object>> {
    const resp = await this.quoteService.getQuoteDetailsById(id);
    if (resp.success) {
      return {
        status: 1000,
        message: 'Success',
        data: resp.data,
      };
    } else {
      return {
        status: 1006,
        message: 'Fail',
        data: { error: resp.message },
      };
    }
  }


}
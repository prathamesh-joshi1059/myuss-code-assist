import {
  Body,
  Controller,
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
} from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';
import { QuoteService } from '../../../myuss/services/quote/quote.service';
import { UserService } from '../../../myuss/services/user/user.service';
import { Response } from 'express';
import { LoggerService } from '../../../core/logger/logger.service';
import { AccountIdGuard } from '../../custom-guard/accountId.guard';
import { CreateInitialQuoteReqDTO } from './dto/create-initial-quote-req.dto';
import { AddProductAndCalculateReqDTO } from './dto/add-product-calculate-req.dto';
import { ConfirmQuoteReqDTO } from './dto/confirm-quote-req-dto';
import { QuoteIdGuard } from '../../custom-guard/quoteId.guard';
import { UpdateQuoteStatusReqDTO } from './dto/update-quote-status-req-dto';
import { DeleteQuotedJobSiteReqDTO, SiteDetailsReqDTO } from './dto/save-site-details-req-dto';
import { ApiRespDTO } from '../../../common/dto/api-resp.dto';
import { ApiBearerAuth, ApiInternalServerErrorResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { BillingDetailsReqDTO } from './dto/save-billing-details-req-dto';
import { TIMEMS_CACHE_REQUEST_FOR_QUOTE } from '../../../core/utils/constants';
import { CacheService } from '../../../core/cache/cache.service';
import { ThrottlerExceptionFilter } from '../../../core/utils/rate-limiting-exception/throttler-exception-filter';

@ApiBearerAuth()
@ApiTags('quotes')
//@Version('1')
@UseFilters(ThrottlerExceptionFilter)
@Controller('api/quotes')
@UseGuards(AuthGuard('jwt'))
export class QuoteController {
  constructor(
    private userService: UserService,
    private quoteService: QuoteService,
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
    @Query() params,
  ): Promise<ApiRespDTO<any>> {
    const createQuoteResp = await this.quoteService.createInitialQuote(
      body,
      params.accountId,
      req.user.sub,
    );

    if (createQuoteResp.success) {
      await this.userService.updateCache(
        'quote',
        req.user.sub,
        { id: createQuoteResp.data['quoteId'] },
        params.accountId,
      );
    }
    this.logger.info(createQuoteResp);
    return createQuoteResp;
  }

  //unit and services step 1 part 2 Add Products and calculate quote
  @UseGuards(AccountIdGuard)
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @Post('update-quote')
  async addProductAndSave(@Request() req, @Body() request: AddProductAndCalculateReqDTO): Promise<ApiRespDTO<any>> {
    return await this.quoteService.addProductAndSave(request, req.user?.sub, req.query.accountId);
  }

  @UseGuards(QuoteIdGuard)
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @Post(':id/document')
  async createQuoteDocument(
    @Request() req,
    @Param('id') id: string,
    @Query('accountId') accountId: string,
    @Query('quotehtml') quoteHtml: string = 'false',
    @Body() body,
  ): Promise<ApiRespDTO<any>> {
    const cacheResp = await this.quoteService.handleCache(body.requestId, body, TIMEMS_CACHE_REQUEST_FOR_QUOTE);
    if (!cacheResp?.isEligibleForNewRequest) {
      return cacheResp.resp;
    }

    await this.quoteService.calculateAndSavePriceAndTax(id, accountId, req.user?.sub, quoteHtml);
    return await this.quoteService.createAndSaveQuoteDocument(id, body.requestId, accountId, req.user?.sub);
  }

  @UseGuards(QuoteIdGuard)
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @Post(':id/quote-html')
  async createQuoteHtml(
    @Request() req,
    @Param('id') id: string,
    @Query('quotehtml') quoteHtml: string = 'true',
    @Query('accountId') accountId: string,
    @Body() body,
  ): Promise<ApiRespDTO<any>> {
    const cacheResp = await this.quoteService.handleCache(body.requestId, body, TIMEMS_CACHE_REQUEST_FOR_QUOTE);
    if (!cacheResp?.isEligibleForNewRequest) {
      return cacheResp.resp;
    }

    const calculateAndSavePriceAndTax = await this.quoteService.calculateAndSavePriceAndTax(id, accountId, req.user?.sub, quoteHtml);
    
    const cacheDataJSON = {
      response: calculateAndSavePriceAndTax,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await this.cacheService.set(body.requestId, cacheDataJSON, TIMEMS_CACHE_REQUEST_FOR_QUOTE);

    return calculateAndSavePriceAndTax;
  }

  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @UseGuards(QuoteIdGuard)
  @Get(':id/documents/:documentId')
  async getQuoteDocumentBody(
    @Param('id') id: string,
    @Param('documentId') documentId: string,
    @Param('accountId') accountId: string,
    @Res({ passthrough: true }) res: Response,
    @Request() req,
  ): Promise<StreamableFile> {
    const documentBlob = await this.quoteService.getQuoteDocumentBody(id, documentId, req.query.accountId, req.user?.sub);
    const buffer = Buffer.from(await documentBlob.arrayBuffer());
    const file = new StreamableFile(buffer);
    res.set({
      'Content-Type': documentBlob.type,
    });
    return file;
  }

  //get quote details
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @UseGuards(QuoteIdGuard)
  @Get(':id')
  async getQuote(@Param('id') id: string): Promise<ApiRespDTO<any>> {
    const resp = await this.quoteService.getQuoteDetailsById(id);

    return resp.success ? {
      status: 1000,
      message: 'Success',
      data: resp.data,
    } : {
      status: 1006,
      message: 'Fail',
      data: { error: resp.message },
    };
  }

  //step - 2 Accept/Reject quote
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @UseGuards(QuoteIdGuard)
  @Post('update-status')
  async updateQuoteStatus(@Request() req, @Body() body: UpdateQuoteStatusReqDTO): Promise<ApiRespDTO<any>> {
    return await this.quoteService.updateQuoteStatus(body, req.query.accountId, req.user?.sub);
  }

  //step - 3 Site Details
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @UseGuards(QuoteIdGuard)
  @Post('site-details')
  async saveSiteDetails(@Body() body: SiteDetailsReqDTO, @Request() req): Promise<ApiRespDTO<any>> {
    return await this.quoteService.updateSiteDetails(body, req.query.accountId, req.user?.sub);
  }

  //delete quoted job site
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @Delete('site-details')
  async deleteQuotedJobSite(@Body() body: DeleteQuotedJobSiteReqDTO): Promise<ApiRespDTO<any>> {
    return await this.quoteService.deleteQuotedJobSite(body.addressId);
  }

  //step - 4 Billing Details
  @UseGuards(QuoteIdGuard)
  @Post('billing-details')
  async saveBillingDetails(@Request() req, @Body() body: BillingDetailsReqDTO): Promise<ApiRespDTO<any>> {
    return await this.quoteService.updateBillingAddress(body, req.query.accountId, req.user?.sub);
  }

  //step - 5 Confirm Quote
  @UseGuards(QuoteIdGuard)
  @Post('confirm-quote')
  async confirmQuote(@Request() req, @Body() body: ConfirmQuoteReqDTO, @Query() params): Promise<ApiRespDTO<any>> {
    const cacheResp = await this.quoteService.handleCache(body.requestId, body, TIMEMS_CACHE_REQUEST_FOR_QUOTE);
    if (!cacheResp?.isEligibleForNewRequest) {
      return cacheResp.resp;
    }

    body.isAutoPay = body.isAutoPay ?? false;
    await this.quoteService.approveQuote(body.quoteId, req.user?.sub, req.query.accountId);
    return await this.quoteService.confirmQuote(body, req.user?.sub, req.query.accountId);
  }
}
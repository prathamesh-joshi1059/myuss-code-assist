import { Body, Controller, Get, Param, Post, Query, UseFilters, UseGuards, Request, UploadedFiles, UseInterceptors, ParseFilePipe, Res, StreamableFile  } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiInternalServerErrorResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ThrottlerExceptionFilter } from '../../../core/utils/rate-limiting-exception/throttler-exception-filter';
import { ApiRespDTO } from '../../../common/dto/api-resp.dto';
import { CaseService } from '../../../myuss/services/case/case.service';
import { FetchCaseReqDto } from './dto/fetch-case-req.dto';
import { CaseDetails } from '../../../myuss/models/case.model';
import { FetchCaseRespDto } from './dto/fetch-case-resp.dto';
import { CreateCaseDto } from './dto/create-case-req.dto';
import { CacheService } from '../../../core/cache/cache.service';
import { AccountsService } from '../../../myuss/services/accounts/accounts.service';
import { AddCommentReqDto } from './dto/add-comment-req.dto';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { FileIsDefinedValidator } from '../../../core/utils/file-validator';
import { Response } from 'express';

@UseFilters(ThrottlerExceptionFilter)
@ApiBearerAuth()
@ApiTags('Cases')
@UseGuards(AuthGuard('jwt'))
@Controller('api/accounts/:accountId')
export class CaseController {
  constructor(
    private caseService: CaseService,
    private cacheService: CacheService,
    private accountsService: AccountsService,
  ) {}
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @Get('cases')
  getAccountWiseCaseList(
    @Request() req,
    @Param() params,
    @Query() fetchCaseReqObject: FetchCaseReqDto,
  ): Promise<ApiRespDTO<FetchCaseRespDto | Object>> {
    let type = '';
    if(req.query.type == 'MySiteServices'){
      type = 'MySiteServices';
    }
    return this.caseService.getAccountWiseCaseList(params.accountId,fetchCaseReqObject,type);
  }

  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @Get(['cases/:id','contracts/:contractId/cases/:id'])
  getCaseDetails(@Param() params): Promise<ApiRespDTO<CaseDetails | {}>> {
    return this.caseService.getCaseDetails(params.id);
  }

  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @Get('contracts/:id/cases')
  getContractWiseCaseList(
    @Param() params,
    @Query() fetchCaseDto: FetchCaseReqDto,
  ): Promise<ApiRespDTO<FetchCaseRespDto | Object>> {
    return this.caseService.getContractWiseCaseList(params.id, fetchCaseDto);
  }
  
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @Post('cases/create')
  async createCase(@Request() req, @Body() createCaseDto: CreateCaseDto): Promise<ApiRespDTO<Object>> {
    let userObj = await this.cacheService.get<string>('user-' + req.user.sub);
    let accountName = '';
    if (!userObj) {
      // get account number from salesforce
      let accountObj = await this.accountsService.getAccount(createCaseDto.accountId);
      accountName = accountObj.name;
    } else {
      userObj = JSON.parse(userObj);
      accountName = userObj['accounts'].filter((user) => user.accountId === createCaseDto.accountId)[0].accountName;
    }
    let type = ''
    if(req.query.type == 'MySiteServices'){
      type = 'MySiteServices';
    }
    return this.caseService.createCase(createCaseDto, accountName, req.user.sub,type);
  }
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @Post('cases/:id/comment')
  addCaseComment(@Param() params, @Body() addCommentReqDto: AddCommentReqDto): Promise<ApiRespDTO<Object>> {
    return this.caseService.addCaseComment(params.id, addCommentReqDto);
  }

  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @Post(['cases/:caseId/upload','cases/:caseId/comments/:commentId/upload'])
  @UseInterceptors(AnyFilesInterceptor())
  uploadFile(
    @UploadedFiles(new ParseFilePipe({ validators: [new FileIsDefinedValidator()] })) file: Express.Multer.File,
    @Param() params,
  ) {
    let recordId = params.caseId;
    if (params.commentId) {
      recordId = params.commentId;
    }
    return this.caseService.uploadFile(file, recordId);
  }
  
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @Get('documents/:documentId')
  async getCaseDocumentBody(
    @Param('documentId') documentId: string,
    @Param('accountId') accountId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const documentBlob = await this.caseService.getCaseDocumentBody(documentId);
    const arrayBuffer = await documentBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const file = new StreamableFile(buffer);
    res.set({
      'Content-Type': documentBlob.type,
    });
    return file;
  }
}

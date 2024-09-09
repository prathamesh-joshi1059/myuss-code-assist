import { Body, Request, Controller, HttpException, HttpStatus, Param, Post, Req, UseGuards, Get, UseFilters, Put, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AccountsService } from '../../services/accounts/accounts.service';
import { AccountIdGuard } from '../../custom-guard/accountId.guard';
import { LoggerService } from '../../../core/logger/logger.service';
import { ApiRespDTO } from '../../../common/dto/api-resp.dto';
import { ApiTags , ApiBearerAuth, ApiUnauthorizedResponse, ApiInternalServerErrorResponse } from '@nestjs/swagger';
import { GetContactsReqDto } from './dto/get-contacts-req.dto';
import { Account } from '../../../myuss/models/account.model';
import { ThrottlerExceptionFilter } from '../../../core/utils/rate-limiting-exception/throttler-exception-filter';
import { TrackActionsReqDTO } from './dto/track-actions-req.dto';
import { CacheService } from '../../../core/cache/cache.service';
import { ContractQueryReqDto, GetContractDetailsDto } from '../contract/dto/contract-req.dto';
import { UserService } from '../../../myuss/services/user/user.service';
import { ContractService } from '../../../myuss/services/contract/contract.service';
import { ContractIdGuard } from '../../../myuss/custom-guard/contractId.guard';
import { AddressService } from '../../services/address/address.service';
import { GetAllDraftsDTO } from './dto/get-drafts-resp.dto';

@UseFilters(ThrottlerExceptionFilter)
@ApiBearerAuth()

@Controller('api/accounts')
@UseGuards(AuthGuard('jwt'))
@ApiTags('accounts')
export class AccountsController {
  constructor(
    private accountsService: AccountsService,
    private addressService: AddressService,
    private logger: LoggerService,
    private cacheService: CacheService,
    private userService: UserService,
    private contractService: ContractService
  ) {}

  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @UseGuards(AccountIdGuard)
  @Get(':id')
  async getAccount(@Param('id') id: string): Promise<Account> {
    const account = await this.accountsService.getAccount(id);
    return account;
  }

  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @UseGuards(AccountIdGuard)
  @Get(':id/contacts')
  async getContacts(@Param() params: GetContactsReqDto): Promise<ApiRespDTO<any>> {
    const { id } = params;
    let contactsResp = new ApiRespDTO<any>();
    try {
      contactsResp = await this.accountsService.getContacts(id);
    } catch (err) {
      this.logger.error(err);
      contactsResp.status = HttpStatus.INTERNAL_SERVER_ERROR;
      contactsResp.message = 'Internal server error';
      contactsResp.data = err;
    }
    return contactsResp;
  }

  @UseGuards(AccountIdGuard)
  @Get(':id/addresses')
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async getAddresses(@Request() req,@Param('id') id: string): Promise<ApiRespDTO<any>> {
    let addressType = req.query.type;
    let addressesResp = new ApiRespDTO();
    try {
      addressesResp = await this.addressService.getAddressesForAccount(id,addressType);
    } catch (err) {
      this.logger.error(err);
      addressesResp.status = HttpStatus.INTERNAL_SERVER_ERROR;
      addressesResp.message = 'Internal server error';
      addressesResp.data = err;
    }
    return addressesResp;
  }


  @Post('/:id/check-duplicate-address')
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @UseGuards(AccountIdGuard)
  async checkDuplicateAddress(
    @Param('id') id: string,
    @Body() body: { enteredAddress: string },
  ): Promise< Promise<object>> {
    const { enteredAddress } = body;
    try {
      let duplicateAddressResult = await this.accountsService.checkDuplicateAddress(id,enteredAddress);
      let getAddressesResult  = {
        success: true,
        status: 1000,
        message: 'Success',
        data: duplicateAddressResult,
      };
      return  getAddressesResult ;
    } catch (err) {
      this.logger.error(err);
      const respObj = {
        status: 200,
        message: 'Fail',
        data: { error: err },
      };
      return respObj;
    }
  }


  //fetch drafts for Account - all/by projectId
  @Get('/:id/drafts')
  async fetchAllDrafts(@Request() req, @Param('id') id: string,@Query('status') status: string): Promise<ApiRespDTO<GetAllDraftsDTO | []>> {
    const accountIds = [id];
    const draftsResp = await this.accountsService.fetchDrafts(accountIds,req.query.projectId,status);
    return draftsResp;
  }

  @Get('/:id/archived-drafts')
  async fetchArchivedDrafts(
    @Request() req,
    @Param('id') id: string,
  ): Promise<object> {
    const accountIds = [id];
    try {
        const archivedDrafts = await this.accountsService.fetchArchivedDrafts(
        accountIds,req.query.projectId
      );
      return archivedDrafts;
    } catch (err) {
      this.logger.error(err);
      const respObj = {
        status: 1006,
        message: 'Error in fetching archived drafts',
        data: { error: err },
      };
      return respObj;
    }
  }

  @Post('/:id/track-actions')
  async trackUserActions( @Param('id') id: string,@Body() body: TrackActionsReqDTO, @Request() req): Promise<ApiRespDTO<any>> {
    try {
      const trackActionsResp = await this.accountsService.trackUserActions(body,id,req.user?.sub);
      return trackActionsResp;
    } catch (err) {
      this.logger.error(err);
      const trackActionsResp = {
        status: 1026,
        message: 'Track User Action Failed',
        data: { error: err },
      };
      return trackActionsResp;
    }
  }
  @UseGuards(AccountIdGuard)
  @UseGuards(ContractIdGuard)
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @Get(':accountId/contracts/:contractId')
  async getContractDetails(
    @Request() req,
    @Param() params: GetContractDetailsDto,
  ): Promise<ApiRespDTO<any>> {
    this.logger.info('req.user.sub: ' + req.user.sub);
    let userObj: any = await this.cacheService.get<string>(
      'user-' + req.user.sub,
    );
    if (!userObj) {
      await this.userService
        .fetchUsersDetails(req.user.sub)
        .then(async (userDataObj: any) => {
          userObj = userDataObj.data;
        });
    } else {
      userObj = JSON.parse(userObj);
     
    }
    let accountId = req.params.accountId;
    const getContractDetailsRes = await this.contractService.getContractDetails(
      accountId,
      params.contractId,
      req.user?.sub
    );
    // this.logger.info('getContractDetailsRes: ' + JSON.stringify(getContractDetailsRes));
    return getContractDetailsRes;
  }
  @UseGuards(AccountIdGuard)
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @Get(':accountId/contracts')
  async getContracts(
    @Request() req,
    @Query() contractdto: ContractQueryReqDto
  ): Promise<ApiRespDTO<Object>> {
    let status  = contractdto.status;
    let accountId = req.params.accountId;

    if (!status) {
      status = 'Activated,Suspended,Ordered';
    }
    let statusArr = status.split(',');
    let userObj = await this.cacheService.get<string>('user-' + req.user.sub);
    let accountNumber = '';
    if (!userObj) {
      //get account number from salesforce
      accountNumber = await this.accountsService.fetchAccountNumber(accountId);
      this.userService.fetchUsersDetails(req.user.sub);
    } else {
      userObj = JSON.parse(userObj);
      accountNumber = userObj['accounts'].filter((user) => user.accountId === accountId)[0].accountNumber;
    }
    this.logger.info('accountId: ' + accountId);
    this.logger.info('accountNumber: ' + accountNumber);
    const contractResponse = await this.contractService.fetchContracts(
      [accountId],
      statusArr,
      accountNumber,
      contractdto.projectId
    );
    return contractResponse;
  }


//fetch all drafts for Account
@Get('/:accountId/dashboard-details')
async fetchAllDashboardDetails(@Request() req, @Param('accountId') accountId: string): Promise<any> {
  try {
    const dashboardDetailsResp = await this.accountsService.fetchAllDashboardDetails(accountId);
    return dashboardDetailsResp;
  } catch (err) {
    this.logger.error(err);
    const respObj = {
      status: 200,
      message: 'Fail',
      data: { error: err },
    };
    return respObj;
  }
}


@Get('/:id/projects/:projectId/quotes')
async fetchProjectQuotes(@Param('id') id: string,@Param('projectId') projectId: string,@Query('status') status: string): Promise<ApiRespDTO<object>> {
  const accountId = id;
  try {
    const fetchProjectQuoteResp = await this.accountsService.fetchProjectQuotes(accountId,projectId,status);
    return fetchProjectQuoteResp;
  } catch (err) {
    this.logger.error(err);
    const respObj = {
      success: false,
      status: 1022,
      message: 'Error while fetching drafts',
      data:[]
    };
    return respObj;
  }
}

}
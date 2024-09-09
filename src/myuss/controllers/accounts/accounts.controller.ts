import {
  Body,
  Request,
  Controller,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
  Get,
  UseFilters,
  Put,
  Query
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AccountsService } from '../../services/accounts/accounts.service';
import { AccountIdGuard } from '../../custom-guard/accountId.guard';
import { LoggerService } from '../../../core/logger/logger.service';
import { ApiRespDTO } from '../../../common/dto/api-resp.dto';
import {
  ApiTags,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiInternalServerErrorResponse
} from '@nestjs/swagger';
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
    return await this.accountsService.getAccount(id);
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
      contactsResp = {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        data: err
      };
    }
    return contactsResp;
  }

  @UseGuards(AccountIdGuard)
  @Get(':id/addresses')
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async getAddresses(@Request() req, @Param('id') id: string): Promise<ApiRespDTO<any>> {
    const addressType = req.query.type;
    let addressesResp = new ApiRespDTO();
    try {
      addressesResp = await this.addressService.getAddressesForAccount(id, addressType);
    } catch (err) {
      this.logger.error(err);
      addressesResp = {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        data: err
      };
    }
    return addressesResp;
  }

  @Post('/:id/check-duplicate-address')
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @UseGuards(AccountIdGuard)
  async checkDuplicateAddress(
    @Param('id') id: string,
    @Body() body: { enteredAddress: string }
  ): Promise<object> {
    const { enteredAddress } = body;
    try {
      const duplicateAddressResult = await this.accountsService.checkDuplicateAddress(id, enteredAddress);
      return {
        success: true,
        status: 1000,
        message: 'Success',
        data: duplicateAddressResult
      };
    } catch (err) {
      this.logger.error(err);
      return {
        status: 200,
        message: 'Fail',
        data: { error: err }
      };
    }
  }

  @Get('/:id/drafts')
  async fetchAllDrafts(@Request() req, @Param('id') id: string, @Query('status') status: string): Promise<ApiRespDTO<GetAllDraftsDTO | []>> {
    const accountIds = [id];
    return await this.accountsService.fetchDrafts(accountIds, req.query.projectId, status);
  }

  @Get('/:id/archived-drafts')
  async fetchArchivedDrafts(@Request() req, @Param('id') id: string): Promise<object> {
    const accountIds = [id];
    try {
      return await this.accountsService.fetchArchivedDrafts(accountIds, req.query.projectId);
    } catch (err) {
      this.logger.error(err);
      return {
        status: 1006,
        message: 'Error in fetching archived drafts',
        data: { error: err }
      };
    }
  }

  @Post('/:id/track-actions')
  async trackUserActions(@Param('id') id: string, @Body() body: TrackActionsReqDTO, @Request() req): Promise<ApiRespDTO<any>> {
    try {
      return await this.accountsService.trackUserActions(body, id, req.user?.sub);
    } catch (err) {
      this.logger.error(err);
      return {
        status: 1026,
        message: 'Track User Action Failed',
        data: { error: err }
      };
    }
  }

  @UseGuards(AccountIdGuard)
  @UseGuards(ContractIdGuard)
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @Get(':accountId/contracts/:contractId')
  async getContractDetails(@Request() req, @Param() params: GetContractDetailsDto): Promise<ApiRespDTO<any>> {
    this.logger.info('req.user.sub: ' + req.user.sub);
    let userObj: any = await this.cacheService.get<string>('user-' + req.user.sub);
    if (!userObj) {
      userObj = (await this.userService.fetchUsersDetails(req.user.sub)).data;
    } else {
      userObj = JSON.parse(userObj);
    }
    const accountId = req.params.accountId;
    return await this.contractService.getContractDetails(accountId, params.contractId, req.user?.sub);
  }

  @UseGuards(AccountIdGuard)
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @Get(':accountId/contracts')
  async getContracts(@Request() req, @Query() contractdto: ContractQueryReqDto): Promise<ApiRespDTO<Object>> {
    const status = contractdto.status || 'Activated,Suspended,Ordered';
    const accountId = req.params.accountId;
    let userObj = await this.cacheService.get<string>('user-' + req.user.sub);
    let accountNumber = '';

    if (!userObj) {
      accountNumber = await this.accountsService.fetchAccountNumber(accountId);
      await this.userService.fetchUsersDetails(req.user.sub);
    } else {
      userObj = JSON.parse(userObj);
      accountNumber = userObj['accounts'].find((user) => user.accountId === accountId)?.accountNumber;
    }
    this.logger.info('accountId: ' + accountId);
    this.logger.info('accountNumber: ' + accountNumber);
    return await this.contractService.fetchContracts([accountId], status.split(','), accountNumber, contractdto.projectId);
  }

  @Get('/:accountId/dashboard-details')
  async fetchAllDashboardDetails(@Request() req, @Param('accountId') accountId: string): Promise<any> {
    try {
      return await this.accountsService.fetchAllDashboardDetails(accountId);
    } catch (err) {
      this.logger.error(err);
      return {
        status: 200,
        message: 'Fail',
        data: { error: err }
      };
    }
  }

  @Get('/:id/projects/:projectId/quotes')
  async fetchProjectQuotes(@Param('id') id: string, @Param('projectId') projectId: string, @Query('status') status: string): Promise<ApiRespDTO<object>> {
    try {
      return await this.accountsService.fetchProjectQuotes(id, projectId, status);
    } catch (err) {
      this.logger.error(err);
      return {
        success: false,
        status: 1022,
        message: 'Error while fetching drafts',
        data: []
      };
    }
  }
}
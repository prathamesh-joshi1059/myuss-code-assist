import { Body, Controller, Get, HttpStatus, Param, Post, Put, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiInternalServerErrorResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CreateAddressReqDTO } from '../../../common/dto/address.req_res_dto';
import { ApiRespDTO } from '../../../common/dto/api-resp.dto';
import { LoggerService } from '../../../core/logger/logger.service';
import { AccountIdGuard } from '../../../myuss/custom-guard/accountId.guard';
import { AddressService } from '../../../myuss/services/address/address.service';

// Address Controller routes are under accounts because addresses will always be
// managed in the context of an account. An address cannot exist without an account.
// endpoint is plural to avoid a breaking change with the existing API. Opportunity to refactor in v2
@Controller('api/accounts/:accountId/addresses')
@UseGuards(AuthGuard('jwt'), AccountIdGuard)
@ApiTags('addresses')
export class AddressController {
  constructor(
    private addressService: AddressService,
    private logger: LoggerService,
  ) {}

  @Get()
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async getAddresses(@Request() req,@Param('accountId') accountId: string): Promise<ApiRespDTO<any>> {
    let addressType = req.query.type;
    let addressesResp = new ApiRespDTO<any>();
    try {
      addressesResp = await this.addressService.getAddressesForAccount(accountId,addressType);
    } catch (err) {
      this.logger.error(err);
      addressesResp.status = HttpStatus.INTERNAL_SERVER_ERROR;
      addressesResp.message = 'Internal server error';
      addressesResp.data = err;
    }
    return addressesResp;
  }
  @Get(':id/subsites')
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async getChildAddress(@Param('accountId') accountId: string,@Param('id') id: string): Promise<ApiRespDTO<any>> {
    let addressesResp = new ApiRespDTO<any>();
    try {
      addressesResp = await this.addressService.getChildAddress(id,accountId);
    } catch (err) {
      this.logger.error(err);
      addressesResp.status = HttpStatus.INTERNAL_SERVER_ERROR;
      addressesResp.message = 'Internal server error';
      addressesResp.data = err;
    }
    return addressesResp;
  }

  @Post()
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async createAddress(
    @Param('accountId') accountId: string,
    @Body() createAddressDTO: CreateAddressReqDTO,
  ): Promise<ApiRespDTO<any>> {
    let addressesResp = new ApiRespDTO<any>();
    createAddressDTO.address.accountId = accountId;
    addressesResp = await this.addressService.createAddress(createAddressDTO);
    return addressesResp;
  }

  @Put(':id')
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async updateAddress(
    @Param('accountId') accountId: string,
    @Param('id') id: string,
    @Body() updateAddressDTO: CreateAddressReqDTO,
  ): Promise<ApiRespDTO<any>> {
    let addressesResp = new ApiRespDTO<any>();
    updateAddressDTO.address.accountId = accountId;
    addressesResp = await this.addressService.updateAddress(id,updateAddressDTO);
    return addressesResp;
  }
}

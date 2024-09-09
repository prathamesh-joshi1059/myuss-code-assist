import { Controller, Get, Param, UseGuards, Query, Request, Post, Body, UseFilters } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ContractService } from '../../services/contract/contract.service';
import {
  CancelContractReqDto,
  ConfirmEasyPayReqDto,
  EditQuantityReqDto,
  SearchByUnitNumberReqDto,
} from './dto/contract-req.dto';
import { ApiTags, ApiBearerAuth, ApiUnauthorizedResponse, ApiInternalServerErrorResponse } from '@nestjs/swagger';
import { ApiRespDTO } from '../../../common/dto/api-resp.dto';
import { ThrottlerExceptionFilter } from '../../../core/utils/rate-limiting-exception/throttler-exception-filter';
import { SearchByUnitNumber } from '../../models/contract.model';

@UseFilters(ThrottlerExceptionFilter)
@ApiBearerAuth()
@ApiTags('contracts')
@Controller('api/contracts')
@UseGuards(AuthGuard('jwt'))
export class ContractController {
  constructor(private contractService: ContractService) {}

  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @Get('search-unit-number')
  async searchByUnitNumber(
    @Request() req,
    @Query() queryParams: SearchByUnitNumberReqDto,
  ): Promise<ApiRespDTO<SearchByUnitNumber | null>> {
    const { unitNumber, accountId } = queryParams;
    return this.contractService.searchByUnitNumber(unitNumber, accountId);
  }

  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @Post('cancel')
  async cancelContract(
    @Request() req,
    @Body() cancelContractDto: CancelContractReqDto,
    @Param('accountId') accountId: string,
  ): Promise<ApiRespDTO<object>> {
    return this.contractService.cancelContract(cancelContractDto, req.user?.sub, accountId);
  }

  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @Post('confirm-easypay')
  async confirmEasyPay(
    @Request() req,
    @Body() confirmEasyPayReqDto: ConfirmEasyPayReqDto,
    @Param('accountId') accountId: string,
  ): Promise<ApiRespDTO<object>> {
    return this.contractService.confirmEasyPay(confirmEasyPayReqDto, req.user?.sub, accountId);
  }

  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @Post('edit-quantity')
  async editQuantity(
    @Request() req,
    @Body() editQuantityReqDto: EditQuantityReqDto,
    @Param('accountId') accountId: string,
  ): Promise<ApiRespDTO<object>> {
    return this.contractService.editQuantity(editQuantityReqDto, req.user?.sub, accountId);
  }
}
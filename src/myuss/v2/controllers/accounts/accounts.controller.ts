import { Request, Controller, Param, UseGuards, Get, UseFilters, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AccountsServiceV2 } from '../../services/accounts/accounts.service';
import { ApiRespDTO } from '../../../../common/dto/api-resp.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ThrottlerExceptionFilter } from '../../../../core/utils/rate-limiting-exception/throttler-exception-filter';
import { GetAllDraftsDTO } from '../../../../myuss/controllers/accounts/dto/get-drafts-resp.dto';

@UseFilters(ThrottlerExceptionFilter)
@ApiTags('v2')
@ApiBearerAuth()
@Controller({ path: 'api/accounts', version: '2' })
@UseGuards(AuthGuard('jwt'))
export class AccountsControllerV2 {
  constructor(private accountsServiceV2: AccountsServiceV2) {}

  @Get('/:id/drafts')
  async fetchAllDraftsV2(
    @Request() req: Request,
    @Param('id') id: string,
    @Query('status') status: string
  ): Promise<ApiRespDTO<GetAllDraftsDTO | []>> {
    const accountIds = [id];
    const draftResponse = await this.accountsServiceV2.fetchDraftsV2(accountIds, req.query.projectId, status);
    return draftResponse;
  }
}
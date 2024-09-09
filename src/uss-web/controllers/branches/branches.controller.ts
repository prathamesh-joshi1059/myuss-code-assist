import { Controller, Get, HttpException, Param, Post, Query, UseGuards, VERSION_NEUTRAL, UseFilters } from '@nestjs/common';
import { AdminGuard } from '../../../auth/admin/admin.guard';
import { LoggerService } from '../../../core/logger/logger.service';
import { Branch } from '../../models/branch.model';
import { BranchService } from '../../services/branch/branch.service';
import { ThrottlerExceptionFilter } from '../../../core/utils/rate-limiting-exception/throttler-exception-filter';

@UseFilters(ThrottlerExceptionFilter)
@Controller({ 
  path: 'branches',
  version: [VERSION_NEUTRAL, '1']
})
@UseGuards(AdminGuard)
export class BranchesController {
  constructor(private logger: LoggerService, private branchService: BranchService) {}

  @Get()
  async getBranches(@Query('eligible') eligible: boolean): Promise<Branch[]> {
    return eligible 
      ? this.branchService.getEligibleBranches() 
      : this.branchService.getBranches();
  }

  @Get(':id')
  async getBranchById(@Param('id') id: string): Promise<Branch> {
    const branch = await this.branchService.getBranchById(id);
    if (!branch) {
      throw new HttpException('Branch not found', 404);
    }
    return branch;
  }

  @Post('refresh')
  async refreshBranchesFromSalesforce(): Promise<void> {
    await this.branchService.refreshBranchesFromSalesforce();
  }
}
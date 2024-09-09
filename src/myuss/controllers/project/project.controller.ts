import {
  Controller,
  Get,
  UseGuards,
  Request,
  UseFilters,
  Query,
  Body,
  Post,
  Param,
} from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ThrottlerExceptionFilter } from '../../../core/utils/rate-limiting-exception/throttler-exception-filter';
import { ApiRespDTO } from 'src/common/dto/api-resp.dto';
import { ProjectService } from 'src/myuss/services/project/project.service';
import { GetProjectsReqDto } from './dto/get-project-req.dto';
import { AddUpdateProjectReqDto } from './dto/add-update-project-req.dto';
import { AccountIdGuard } from 'src/myuss/custom-guard/accountId.guard';
import { AssignProjectIdReqDto } from './dto/assign-project-id-req.dto';

@ApiBearerAuth()
@ApiTags('projects')
@UseFilters(ThrottlerExceptionFilter)
@Controller('api/projects')
@UseGuards(AuthGuard('jwt'))
export class ProjectController {
  constructor(private projectService: ProjectService) {}

  @UseGuards(AccountIdGuard)
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @Get('list')
  async getProjects(
    @Request() req,
    @Query() projectReqdto: GetProjectsReqDto,
  ): Promise<ApiRespDTO<Object>> {
    const status = projectReqdto.status || 'Active';

    return this.projectService.fetchProjects(projectReqdto);
  }

  @UseGuards(AccountIdGuard)
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @Post('add-update-project')
  async addProject(
    @Request() req,
    @Query('accountId') accountId: string,
    @Body() addUpdateProjectReqdto: AddUpdateProjectReqDto,
  ): Promise<ApiRespDTO<Object>> {
    return this.projectService.addUpdateProject(
      addUpdateProjectReqdto,
      req.user.sub,
    );
  }

  @UseGuards(AccountIdGuard)
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @Get(':id/details')
  async fetchProjectDetails(
    @Request() req,
    @Query('accountId') accountId: string,
    @Param('id') id: string,
  ): Promise<ApiRespDTO<Object>> {
    return this.projectService.fetchProjectDetails(
      id,
      req.user.sub,
      accountId,
    );
  }

  @UseGuards(AccountIdGuard)
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @Post('assign-project')
  async assignProjectId(
    @Request() req,
    @Query('accountId') accountId: string,
    @Body() assignProjectIdReqDto: AssignProjectIdReqDto,
  ): Promise<ApiRespDTO<Object>> {
    return this.projectService.assignProjectId(
      assignProjectIdReqDto,
      req.user.sub,
      accountId,
    );
  }
}
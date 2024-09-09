import { Injectable } from "@nestjs/common";
import { SfdcBaseService } from "src/backend/sfdc/services/sfdc-base/sfdc-base.service";
import { SfdcProjectService } from "src/backend/sfdc/services/sfdc-project/sfdc-project.service";
import { ApiRespDTO } from "src/common/dto/api-resp.dto";
import { TrackUserActionService } from "src/core/track-user-action/track-user-action-service";
import { ADD_PROJECT_SCREEN, CREATED_PROJECT, EDITED_PROJECT, FETCH_PROJECT_DETAILS, QUOTE_OR_ORDER_SCREEN } from "src/core/utils/user-event-messages";
import { AddUpdateProjectReqDto } from "src/myuss/controllers/project/dto/add-update-project-req.dto";
import { AssignProjectIdReqDto } from "src/myuss/controllers/project/dto/assign-project-id-req.dto";
import { GetProjectsReqDto } from "src/myuss/controllers/project/dto/get-project-req.dto";
import { SFDC_ProjectMapper } from "src/myuss/mappers/salesforce/project.mapper";
import { Project } from "src/myuss/models/project.model";

@Injectable()
export class ProjectService {
  constructor(
    private sfdcProjectService: SfdcProjectService,
    private trackUserActionService: TrackUserActionService,
    private sfdcBaseService: SfdcBaseService,
  ) {}

  async fetchProjects(projectReqdto: GetProjectsReqDto): Promise<ApiRespDTO<Object>> {
    try {
      const projectsResp = await this.sfdcProjectService.fetchProjects(projectReqdto.accountId, projectReqdto.status || 'Active');
      if (projectsResp.projectList.length === 0) {
        return {
          status: 1000,
          data: [],
          message: 'No projects found for this account',
          success: true,
        };
      }
      
      const projectsListArr: Project[] = [];
      const projectsRespList = projectReqdto.isRecent === "true"
        ? projectsResp.projectList.sort((prev, next) => new Date(next.LastModifiedDate).getTime() - new Date(prev.LastModifiedDate).getTime()).slice(0, 3)
        : projectsResp.projectList;

      projectsRespList.forEach((project) => {
        projectsListArr.push(SFDC_ProjectMapper.getMyUSSProjectFromSFDCProject(project, projectsResp.quoteOrderCount, projectReqdto.accountId));
      });

      return {
        status: 1000,
        data: projectsListArr,
        message: 'Success',
        success: true,
      };
    } catch (error) {
      return {
        status: 1037,
        data: [],
        message: 'Error while fetching projects',
        success: false,
      };
    }
  }

  async addUpdateProject(addProjectReqdto: AddUpdateProjectReqDto, auth0Id: string): Promise<ApiRespDTO<Object>> {
    const sfdcProjectObj = SFDC_ProjectMapper.getSfdcProjectFromRequest(addProjectReqdto);
    try {
      const projectsResp = await this.sfdcProjectService.addUpdateProject(sfdcProjectObj, addProjectReqdto);
      if (projectsResp.success) {
        const actionType = addProjectReqdto.id === "" ? CREATED_PROJECT : EDITED_PROJECT;
        this.trackUserActionService.setPortalActions(addProjectReqdto.accountId, auth0Id, ADD_PROJECT_SCREEN, actionType, '', '');

        return {
          status: 1000,
          data: { id: projectsResp.id },
          message: 'Successfully created/edited the project',
          success: true,
        };
      }
      
      return {
        status: 1038,
        data: {},
        message: 'Error while creating/editing project',
        success: false,
      };
    } catch (error) {
      return {
        status: 1038,
        data: {},
        message: 'Error while creating/editing project',
        success: false,
      };
    }
  }

  async fetchProjectDetails(projectId: string, auth0Id: string, accountId: string): Promise<ApiRespDTO<Object>> {
    this.trackUserActionService.setPortalActions(accountId, auth0Id, ADD_PROJECT_SCREEN, FETCH_PROJECT_DETAILS, '', '');
    try {
      const projectsDetailsResp = await this.sfdcProjectService.fetchProjectDetails(projectId);
      const caseCountObj = await this.sfdcProjectService.getCasesCount([projectId]);
      const projectDetailsMap = SFDC_ProjectMapper.getMyUSSProjectFromSFDCProject(projectsDetailsResp, [], accountId);
      projectDetailsMap.casesCount = caseCountObj.records.length === 0 ? 0 : caseCountObj.records[0].casesCount;

      return {
        status: 1000,
        data: projectDetailsMap,
        message: 'Successfully fetched the project details',
        success: true,
      };
    } catch (error) {
      return {
        status: 1040,
        data: {},
        message: 'Error while fetching the project details',
        success: false,
      };
    }
  }

  async assignProjectId(assignProjectIdReqDto: AssignProjectIdReqDto, auth0Id: string, accountId: string): Promise<ApiRespDTO<object>> {
    this.trackUserActionService.setPortalActions(accountId, auth0Id, QUOTE_OR_ORDER_SCREEN, `Assigned ${assignProjectIdReqDto.projectId} to ${assignProjectIdReqDto.quoteIds} quotes`, '', '');
    try {
      const assignProjectIdResp = await this.sfdcProjectService.assignProjectId(assignProjectIdReqDto);
      if (assignProjectIdResp) {
        return {
          success: true,
          status: 1000,
          message: 'Project assigned successfully',
          data: {},
        };
      }

      return {
        success: false,
        status: 1043,
        message: 'Fail to assign project',
        data: {},
      };
    } catch (error) {
      return {
        success: false,
        status: 1043,
        message: 'Fail to assign project',
        data: {},
      };
    }
  }
}
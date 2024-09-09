import { Injectable } from '@nestjs/common';
import { SfdcCaseService } from '../../../backend/sfdc/services/sfdc-case/sfdc-case.service';
import { SFDC_CaseMapper } from '../../../myuss/mappers/salesforce/case.mapper';
import { ApiRespDTO } from '../../../common/dto/api-resp.dto';
import { FetchCaseReqDto } from '../../controllers/case/dto/fetch-case-req.dto';
import { SFDC_EventMapper } from '../../../myuss/mappers/salesforce/event.mappers';
import { SFDC_TaskMapper } from '../../../myuss/mappers/salesforce/tasks.mapper';
import { SFDC_FeedsMapper } from '../../../myuss/mappers/salesforce/feeds.mappers';
import { CaseDetails } from '../../../myuss/models/case.model';
import { SFDC_HistoryMapper } from '../../../myuss/mappers/salesforce/history.mapper';
import { FetchCaseRespDto } from '../../controllers/case/dto/fetch-case-resp.dto';
import { CreateCaseDto } from '../../../myuss/controllers/case/dto/create-case-req.dto';
import { CREATE_CASE } from '../../../core/utils/user-event-messages';
import { TrackUserActionService } from '../../../core/track-user-action/track-user-action-service';
import { AddCommentReqDto } from '../../controllers/case/dto/add-comment-req.dto';
import { SFDC_MyUSSCaseCommentMapper } from '../../mappers/salesforce/case-comment.mapper';
import { MyUSS_Case_Comment } from '../../../backend/sfdc/model/CaseComment';
import { Case } from 'src/backend/sfdc/model/Case';
import { Case_Order_Relationship__c } from 'src/backend/sfdc/model/Case_Order_Relationship__c';
import { ConfigService } from '@nestjs/config';
import { GoogleMapsService } from '../../../backend/google/google-maps/google-maps.service';
import { Contract } from 'src/backend/sfdc/model/Contract';

@Injectable()
export class CaseService {
  private googleMapApiKey: string;

  constructor(
    private sfdcCaseService: SfdcCaseService,
    private trackUserActionService: TrackUserActionService,
    private configService: ConfigService,
    private googleMapService: GoogleMapsService
  ) {
    this.googleMapApiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY');
  }

  async getAccountWiseCaseList(
    accountId: string,
    fetchCaseReqObject: FetchCaseReqDto,
    type: string,
  ): Promise<ApiRespDTO<FetchCaseRespDto | Object>> {
    let caseList: Case[] = [];

    if (type === 'MySiteServices') {
      caseList = await this.sfdcCaseService.getAccountWiseMySiteServicesCaseList(accountId, fetchCaseReqObject);
    } else if (!fetchCaseReqObject.projectId) {
      caseList = await this.sfdcCaseService.getAccountWiseCaseList(accountId, fetchCaseReqObject);
    } else {
      caseList = await this.sfdcCaseService.getAccountWiseCaseListForProject(accountId, fetchCaseReqObject);
    }

    if (caseList.length === 0) {
      return {
        status: 1000,
        data: {},
        message: 'No cases found for this account',
        success: true,
      };
    }

    const caseListArr = caseList.map((sfdcCase) => {
      let caseOrderRelationships: Case_Order_Relationship__c = sfdcCase.CaseOrderRelationships__r?.['records'][0] || null;
      sfdcCase.CaseOrderRelationships__r = [];
      if (caseOrderRelationships) {
        sfdcCase.CaseOrderRelationships__r.push(caseOrderRelationships);
      }
      return SFDC_CaseMapper.getMyUSSCaseFromSFDCCase(sfdcCase);
    });

    return {
      status: 1000,
      data: { cases: caseListArr },
      message: 'Success',
      success: true,
    };
  }

  async getContractWiseCaseList(
    contractId: string,
    fetchCaseDto: FetchCaseReqDto,
  ): Promise<ApiRespDTO<FetchCaseRespDto | Object>> {
    const caseList = await this.sfdcCaseService.getContractWiseCaseList(contractId, fetchCaseDto);

    if (caseList.length === 0) {
      return {
        status: 1000,
        data: {},
        message: 'No cases found for this account',
        success: true,
      };
    }

    const caseListArr = caseList.map((sfdcCase) => {
      let caseOrderRelationships: Case_Order_Relationship__c = sfdcCase.CaseOrderRelationships__r?.['records'][0] || null;
      sfdcCase.CaseOrderRelationships__r = [];
      if (caseOrderRelationships) {
        sfdcCase.CaseOrderRelationships__r.push(caseOrderRelationships);
      }
      return SFDC_CaseMapper.getMyUSSCaseFromSFDCCase(sfdcCase);
    });

    return {
      status: 1000,
      data: { cases: caseListArr },
      message: 'Success',
      success: true,
    };
  }

  async getCaseDetails(id: string): Promise<ApiRespDTO<CaseDetails | {}>> {
    const caseDetailsResponse = await this.sfdcCaseService.getCaseDetails(id);

    if (!caseDetailsResponse || !caseDetailsResponse.success) {
      return {
        status: 1032,
        data: {},
        message: 'Error while fetching case details',
        success: false,
      };
    }

    const comments = caseDetailsResponse.comments?.map(comment => 
      SFDC_MyUSSCaseCommentMapper.getMyUSSCaseCommentFromSFDCMyUSSCaseComment(comment)) || [];

    const activities: Array<{ dateTime: string; activity: string }> = [];
    
    const mapEventToActivity = (event: any) => {
      const activityDescription = event.subject + (event.description ? ` - ${event.description}` : '');
      activities.push({ dateTime: event.createdDate, activity: activityDescription });
    };

    const events = caseDetailsResponse.events?.map(event => {
      mapEventToActivity(event);
      return SFDC_EventMapper.getMyUSSEventFromSFDCEvent(event);
    }) || [];

    const tasks = caseDetailsResponse.tasks?.map(task => {
      const activityDescription = task.subject + (task.description ? ` - ${task.description}` : '');
      activities.push({ dateTime: task.createdDate, activity: activityDescription });
      return SFDC_TaskMapper.getMyUSSTasksFromSFDCTasks(task);
    }) || [];

    const feeds = caseDetailsResponse.feeds?.map(feed => {
      activities.push({ dateTime: feed.createdDate, activity: feed.body || '' });
      return SFDC_FeedsMapper.getMyUSSFeedsFromSFDCFeeds(feed);
    }) || [];

    const histories = caseDetailsResponse.histories?.map(history => {
      if (history.Field === 'USF_Closed_By__c') {
        history.Field = 'Closed by - ' + history.NewValue;
      }
      const activityDescription = history.field + 
        (history.oldValue && history.newValue ? ` - ${history.oldValue} to ${history.newValue}` : '');
      activities.push({ dateTime: history.createdDate, activity: activityDescription });
      return SFDC_HistoryMapper.getMyUSSHistoryFromSFDCHistory(history);
    }) || [];

    const responseCaseDetails = {
      caseDetails: SFDC_CaseMapper.getMyUSSCaseFromSFDCCase(caseDetailsResponse.caseDetails),
      comments: comments.sort((a, b) => new Date(b.lastModifiedDate).getTime() - new Date(a.lastModifiedDate).getTime()),
      activities: activities.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()),
    };

    return {
      status: 1000,
      data: responseCaseDetails,
      message: 'Success',
      success: true,
    };
  }

  async createCase(
    createCaseDto: CreateCaseDto,
    accountName: string,
    auth0Id: string,
    type: string,
  ): Promise<ApiRespDTO<Object>> {
    const orderShipAddress = await this.sfdcCaseService.getContractIdByName(createCaseDto.orderName);
    const region = await this.googleMapService.getTimeZoneByAddress(orderShipAddress.Ship_To__c);
    Object.assign(createCaseDto, { caseRegion: region });

    const recordTypeId = await this.sfdcCaseService.fetchRecordTypeId(
      type !== 'MySiteServices' ? 'Order Support' : 'MySiteServices'
    );

    const sfdcCaseObj = type !== 'MySiteServices'
      ? SFDC_CaseMapper.getSfdcCaseFromRequest(createCaseDto, recordTypeId, accountName)
      : SFDC_CaseMapper.getSfdcMyUssServiceCaseFromRequest(createCaseDto, recordTypeId, accountName);

    const createCaseResp = await this.sfdcCaseService.createCase(sfdcCaseObj, orderShipAddress.Id);

    if (createCaseResp.success) {
      this.trackUserActionService.setPortalActions(
        createCaseDto.accountId,
        auth0Id,
        CREATE_CASE,
        `Case with ${createCaseDto.caseSubType} created`,
        '',
        orderShipAddress.Id,
      );
      return {
        status: 1000,
        message: 'Case Created Successfully',
        success: true,
        data: { caseId: createCaseResp.id },
      };
    } else {
      return {
        status: 1033,
        message: 'Error while creating case',
        success: false,
      };
    }
  }

  async addCaseComment(id: string, commentObj: AddCommentReqDto): Promise<ApiRespDTO<Object>> {
    const sfdcComment: MyUSS_Case_Comment = SFDC_MyUSSCaseCommentMapper.getSFDCMyUSSCaseCommentFromRequest(commentObj);
    const caseComment = await this.sfdcCaseService.addCaseComment(sfdcComment);
    if (caseComment.success) {
      return {
        status: 1000,
        message: 'Comment added successfully',
        success: true,
        data: { commentId: caseComment.id },
      };
    } else {
      return {
        status: 1034,
        message: 'Error while adding comment',
        success: false,
      };
    }
  }

  async uploadFile(file: Express.Multer.File, recordId: string): Promise<ApiRespDTO<Object>> {
    const uploadResponse = await this.sfdcCaseService.uploadFile(file, recordId);
    if (uploadResponse) {
      return {
        status: 1000,
        message: 'File uploaded successfully',
        success: true,
      };
    } else {
      return {
        status: 1035,
        message: 'Error while uploading file',
        success: false,
      };
    }
  }

  async getCaseDocumentBody(documentId: string): Promise<Blob> {
    return await this.sfdcCaseService.getDocumentBodyForCase(documentId);
  }
}
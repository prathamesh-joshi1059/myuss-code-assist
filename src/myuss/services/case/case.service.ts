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
    type,
  ): Promise<ApiRespDTO<FetchCaseRespDto | Object>> {
    let caseList: Case[] = [];

    if (type == 'MySiteServices') {
      caseList = await this.sfdcCaseService.getAccountWiseMySiteServicesCaseList(accountId, fetchCaseReqObject);
    } else {
      if (!fetchCaseReqObject.projectId) {
        caseList = await this.sfdcCaseService.getAccountWiseCaseList(accountId, fetchCaseReqObject);
      } else {
        caseList = await this.sfdcCaseService.getAccountWiseCaseListForProject(accountId, fetchCaseReqObject);
      }
    }
    if (caseList.length == 0) {
      return {
        status: 1000,
        data: {},
        message: 'No cases found for this account',
        success: true,
      };
    }
    if (caseList.length > 0) {
      let caseListArr = [];
      if (!fetchCaseReqObject.projectId) {
        for (let i = 0; i < caseList.length; i++) {
          let caseOrderRelationships: Case_Order_Relationship__c;
          caseOrderRelationships = caseList[i].CaseOrderRelationships__r?.['records'][0];
          caseList[i].CaseOrderRelationships__r = [];
          if (caseOrderRelationships != undefined) {
            caseList[i].CaseOrderRelationships__r.push(caseOrderRelationships);
          }
          caseListArr.push(SFDC_CaseMapper.getMyUSSCaseFromSFDCCase(caseList[i]));
        }
      } else {
        for (let i = 0; i < caseList.length; i++) {
          let caseToMap = new Case();
          caseToMap = caseList[i]['Case__r'];
          caseToMap.CaseOrderRelationships__r = [];
          caseToMap.CaseOrderRelationships__r.push(new Case_Order_Relationship__c());
          caseToMap.CaseOrderRelationships__r[0].USS_Order__r = caseList[i]['USS_Order__r'];

          caseListArr.push(SFDC_CaseMapper.getMyUSSCaseFromSFDCCase(caseToMap));
        }
      }
      return {
        status: 1000,
        data: { cases: caseListArr },
        message: 'Success',
        success: true,
      };
    } else {
      return {
        status: 1032,
        data: {},
        message: 'Error while fetching cases',
        success: false,
      };
    }
  }
  async getContractWiseCaseList(
    contractId: string,
    fetchCaseDto: FetchCaseReqDto,
  ): Promise<ApiRespDTO<FetchCaseRespDto | Object>> {
    let caseList = await this.sfdcCaseService.getContractWiseCaseList(contractId, fetchCaseDto);
    if (caseList.length == 0) {
      return {
        status: 1000,
        data: {},
        message: 'No cases found for this account',
        success: true,
      };
    }
    if (caseList.length > 0) {
      let caseListArr = [];
      for (let i = 0; i < caseList.length; i++) {
        let caseOrderRelationships: Case_Order_Relationship__c;
        caseOrderRelationships = caseList[i].CaseOrderRelationships__r?.['records'][0];
        caseList[i].CaseOrderRelationships__r = [];
        if (caseOrderRelationships != undefined) {
          caseList[i].CaseOrderRelationships__r.push(caseOrderRelationships);
        }
        caseListArr.push(SFDC_CaseMapper.getMyUSSCaseFromSFDCCase(caseList[i]));
        //caseListArr.push(SFDC_CaseMapper.getMyUSSCaseFromSFDCCase(caseList[i]));
      }
      return {
        status: 1000,
        data: { cases: caseListArr },
        message: 'Success',
        success: true,
      };
    } else {
      return {
        status: 1032,
        data: {},
        message: 'Error while fetching cases',
        success: false,
      };
    }
  }
  async getCaseDetails(id: string): Promise<ApiRespDTO<CaseDetails | {}>> {
    let caseDetailsResponse = await this.sfdcCaseService.getCaseDetails(id);
    if (!caseDetailsResponse || !caseDetailsResponse.success) {
      return {
        status: 1032,
        data: {},
        message: 'Error while fetching case details',
        success: false,
      };
    }
    let comments = [];
    let activities = [];
    let feeds = [];
    let tasks = [];
    let events = [];
    let histories = [];

    if (caseDetailsResponse.comments) {
      comments = caseDetailsResponse.comments.map((comment) => {
        return SFDC_MyUSSCaseCommentMapper.getMyUSSCaseCommentFromSFDCMyUSSCaseComment(comment);
      });
    }
    if (caseDetailsResponse.events) {
      events = caseDetailsResponse.events.map((event) => {
        return SFDC_EventMapper.getMyUSSEventFromSFDCEvent(event);
      });
      for (const event of events) {
        let activity = '';
        if (event.subject) {
          activity = event.subject;
          if (event.description) {
            activity = activity + ' - ' + event.description;
          }
          activities.push({
            dateTime: event.createdDate,
            activity: activity,
          });
        }
      }
    }
    if (caseDetailsResponse.tasks) {
      tasks = caseDetailsResponse.tasks.map((task) => {
        return SFDC_TaskMapper.getMyUSSTasksFromSFDCTasks(task);
      });
      for (const task of tasks) {
        let activity = '';
        if (task.subject) {
          activity = task.subject;
          if (task.description) {
            activity = activity + ' - ' + task.description;
          }
        }
        activities.push({
          dateTime: task.createdDate,
          activity: activity,
        });
      }
    }
    if (caseDetailsResponse.feeds) {
      feeds = caseDetailsResponse.feeds.map((feed) => {
        return SFDC_FeedsMapper.getMyUSSFeedsFromSFDCFeeds(feed);
      });
      for (const feed of feeds) {
        let activity = '';
        if (feed.body) {
          activity = feed.body;
        }
        activities.push({
          dateTime: feed.createdDate,
          activity: activity,
        });
      }
    }
    if (caseDetailsResponse.histories) {
      histories = caseDetailsResponse.histories.map((history) => {
        if (history.Field == 'USF_Closed_By__c') {
          history.Field = 'Closed by - ' + history.NewValue;
        }
        return SFDC_HistoryMapper.getMyUSSHistoryFromSFDCHistory(history);
      });
      for (const history of histories) {
        let activity = '';
        if (history.field) {
          activity = history.field;
          if (history.oldValue && history.newValue) {
            activity = activity + ' - ' + history.oldValue + ' to ' + history.newValue;
          }
        }
        activities.push({
          dateTime: history.createdDate,
          activity: activity,
        });
      }
    }
    let responseCaseDetails = {
      caseDetails: SFDC_CaseMapper.getMyUSSCaseFromSFDCCase(caseDetailsResponse.caseDetails),
      comments: comments.sort(
        (a, b) => new Date(b.lastModifiedDate).getTime() - new Date(a.lastModifiedDate).getTime(),
      ),
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
    let orderShipAddress = new Contract();
    orderShipAddress = await this.sfdcCaseService.getContractIdByName(createCaseDto.orderName);
    const region = await this.googleMapService.getTimeZoneByAddress(orderShipAddress.Ship_To__c)
    Object.assign(createCaseDto, { caseRegion: region });

    let createCaseResp;
    if (type != 'MySiteServices') {
      const recordTypeId = await this.sfdcCaseService.fetchRecordTypeId('Order Support');
      const sfdcCaseObj = SFDC_CaseMapper.getSfdcCaseFromRequest(createCaseDto, recordTypeId, accountName);
      createCaseResp = await this.sfdcCaseService.createCase(sfdcCaseObj, orderShipAddress.Id);
    } else {
      const recordTypeId = await this.sfdcCaseService.fetchRecordTypeId('MySiteServices');
      const sfdcCaseObj = SFDC_CaseMapper.getSfdcMyUssServiceCaseFromRequest(createCaseDto, recordTypeId, accountName);
      createCaseResp = await this.sfdcCaseService.createCase(sfdcCaseObj, orderShipAddress.Id);
    }

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
    let sfdcComment: MyUSS_Case_Comment = SFDC_MyUSSCaseCommentMapper.getSFDCMyUSSCaseCommentFromRequest(commentObj);
    let caseComment = await this.sfdcCaseService.addCaseComment(sfdcComment);
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
    const uploadResponse = this.sfdcCaseService.uploadFile(file, recordId);
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

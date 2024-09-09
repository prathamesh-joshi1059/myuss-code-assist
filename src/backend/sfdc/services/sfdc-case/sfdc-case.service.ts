import { Injectable } from '@nestjs/common';
import { SfdcBaseService } from '../sfdc-base/sfdc-base.service';
import { Case, SFDCCaseDetails } from '../../model/Case';
import { FetchCaseReqDto } from '../../../../myuss/controllers/case/dto/fetch-case-req.dto';
import { SfdcRespModel } from '../../../../myuss/models';
import { LoggerService } from '../../../../core/logger/logger.service';
import { SfDate } from 'jsforce';
import { MyUSS_Case_Comment } from '../../model/CaseComment';
import { API_VERSION } from '../../../../myuss/services/quote/constants';
import { SfdcContractService } from '../sfdc-contract/sfdc-contract.service';
import { Contact } from '../../model/Contact';
import { Contract } from '../../model/Contract';

@Injectable()
export class SfdcCaseService {
  constructor(
    private salesforceBaseService: SfdcBaseService,
    private loggerService: LoggerService,
    private sfdcContractService: SfdcContractService,
  ) {}

  async getAccountWiseCaseList(accountId: string, fetchCaseDto: FetchCaseReqDto): Promise<Case[]> {
    const recordId = await this.fetchRecordTypeId('Order Support');
    if (fetchCaseDto.status == 'closed') {
      const caseList = await this.salesforceBaseService.conn
        .sobject('Case')
        .select('Id, CaseNumber,CreatedDate,LastModifiedDate,Type,Case_Sub_type__c,Status,Order_Number__c')
        .include('CaseOrderRelationships__r')
        .select(
          'Id, USS_Order__r.SBQQ__Quote__r.Shipping_Address__r.Id,USS_Order__r.SBQQ__Quote__r.Shipping_Address__r.USF_Street__c,USS_Order__r.SBQQ__Quote__r.Shipping_Address__r.USF_City__c,USS_Order__r.SBQQ__Quote__r.Shipping_Address__r.USF_State__c,USS_Order__r.SBQQ__Quote__r.Shipping_Address__r.USF_Zip_Code__c',
        )
        .end()
        .where({
          AccountId: accountId,
          Status: 'closed',
          MYUSS_Show_in_MyUSS__c: true,
          RecordTypeId: { $eq: recordId },
          LastModifiedDate: {
            $gte: SfDate.toDateTimeLiteral(new Date(fetchCaseDto.startTime).setUTCHours(0, 0, 0, 0)),
            $lte: SfDate.toDateTimeLiteral(new Date(fetchCaseDto.endTime).setUTCHours(23, 59, 59, 999)),
          },
        })
        .execute();
      return caseList;
    } else {
      const caseList = await this.salesforceBaseService.conn
        .sobject('Case')
        .select('Id, CaseNumber,CreatedDate,LastModifiedDate,Type,Case_Sub_type__c,Status,Order_Number__c')
        .include('CaseOrderRelationships__r')
        .select(
          'Id, USS_Order__r.SBQQ__Quote__r.Shipping_Address__r.Id,USS_Order__r.SBQQ__Quote__r.Shipping_Address__r.USF_Street__c,USS_Order__r.SBQQ__Quote__r.Shipping_Address__r.USF_City__c,USS_Order__r.SBQQ__Quote__r.Shipping_Address__r.USF_State__c,USS_Order__r.SBQQ__Quote__r.Shipping_Address__r.USF_Zip_Code__c',
        )
        .end()
        .where({
          AccountId: accountId,
          Status: { $ne: 'Closed' },
          MYUSS_Show_in_MyUSS__c: true,
          RecordTypeId: { $eq: recordId },
        })
        .execute();
      return caseList;
    }
  }
  async getAccountWiseCaseListForProject(accountId: string, fetchCaseReqObject: FetchCaseReqDto): Promise<Case[]> {
    const recordId = await this.fetchRecordTypeId('Order Support');
    if (fetchCaseReqObject.status == 'closed') {
      const caseList = await this.salesforceBaseService.conn
        .sobject('Case_Order_Relationship__c')
        .select(
          `Id, Case__r.Account.Name, Case__r.Start_Date_Time__c, Case__c,
                  Case__r.CaseNumber, Case__r.CreatedDate, Case__r.LastModifiedDate, 
                  Case__r.Type, Case__r.Case_Sub_type__c, Case__r.Status, Case__r.Order_Number__c,
                  USS_Order__r.SBQQ__Quote__r.Shipping_Address__r.Id,USS_Order__r.SBQQ__Quote__r.Shipping_Address__r.USF_Street__c,USS_Order__r.SBQQ__Quote__r.Shipping_Address__r.USF_City__c,USS_Order__r.SBQQ__Quote__r.Shipping_Address__r.USF_State__c,USS_Order__r.SBQQ__Quote__r.Shipping_Address__r.USF_Zip_Code__c
                  `,
        )
        .where({
          'Case__r.AccountId': accountId,
          Case_Status__c: 'closed',
          'Case__r.MYUSS_Show_in_MyUSS__c': true,
          'Case__r.RecordTypeId': { $eq: recordId },
          'Case__r.LastModifiedDate': {
            $gte: SfDate.toDateTimeLiteral(new Date(fetchCaseReqObject.startTime).setUTCHours(0, 0, 0, 0)),
            $lte: SfDate.toDateTimeLiteral(new Date(fetchCaseReqObject.endTime).setUTCHours(23, 59, 59, 999)),
          },
          'USS_Order__r.SBQQ__Opportunity__r.USF_Project__c': fetchCaseReqObject.projectId,
        });
      return caseList;
    } else {
      const caseList = await this.salesforceBaseService.conn
        .sobject('Case_Order_Relationship__c')
        .select(
          `Id, Case__r.Account.Name, Case__r.Start_Date_Time__c, Case__c,
                  Case__r.Id,Case__r.AccountId,Case__r.CaseNumber, Case__r.CreatedDate, Case__r.LastModifiedDate, 
                  Case__r.Type, Case__r.Case_Sub_type__c, Case__r.Status, Case__r.Order_Number__c,
                    USS_Order__r.SBQQ__Quote__r.Shipping_Address__r.Id,USS_Order__r.SBQQ__Quote__r.Shipping_Address__r.USF_Street__c,USS_Order__r.SBQQ__Quote__r.Shipping_Address__r.USF_City__c,USS_Order__r.SBQQ__Quote__r.Shipping_Address__r.USF_State__c,USS_Order__r.SBQQ__Quote__r.Shipping_Address__r.USF_Zip_Code__c
                
                  `,
        )
        .where({
          'Case__r.AccountId': accountId,
          Case_Status__c: { $ne: 'closed' },
          'Case__r.MYUSS_Show_in_MyUSS__c': true,
          'Case__r.RecordTypeId': { $eq: recordId },
          'USS_Order__r.SBQQ__Opportunity__r.USF_Project__c': fetchCaseReqObject.projectId,
        })
        .execute();
      return caseList;
    }
  }

  async getAccountWiseMySiteServicesCaseList(accountId: string, fetchCaseDto: FetchCaseReqDto): Promise<Case[]> {
    const recordId = await this.fetchRecordTypeId('MySiteServices');
    if (fetchCaseDto.status == 'closed') {
      const caseList = await this.salesforceBaseService.conn
        .sobject('Case')
        .select('Id,CaseNumber,CreatedDate,LastModifiedDate,Subject,Status')
        .where({
          AccountId: accountId,
          Status: 'closed',
          RecordTypeId: { $eq: recordId },
          MYUSS_Show_in_MyUSS__c: true,
          LastModifiedDate: {
            $gte: SfDate.toDateTimeLiteral(new Date(fetchCaseDto.startTime).setUTCHours(0, 0, 0, 0)),
            $lte: SfDate.toDateTimeLiteral(new Date(fetchCaseDto.endTime).setUTCHours(23, 59, 59, 999)),
          },
          ContactId: fetchCaseDto.contactId,
        })
        .execute();
      return caseList;
    } else {
      const caseList = await this.salesforceBaseService.conn
        .sobject('Case')
        .select('Id,CaseNumber,CreatedDate,LastModifiedDate,Subject,Status')
        .where({
          AccountId: accountId,
          Status: { $ne: 'Closed' },
          RecordTypeId: { $eq: recordId },
          MYUSS_Show_in_MyUSS__c: true,
          ContactId: fetchCaseDto.contactId,
        })
        .execute();
      return caseList;
    }
  }

  async getContractWiseCaseList(contractId: string, fetchCaseDto): Promise<Case[]> {
    const recordId = await this.fetchRecordTypeId('Order Support');
    if (fetchCaseDto.status == 'closed') {
      const caseList = await this.salesforceBaseService.conn

        .sobject('Case')
        .select('Id, CaseNumber,CreatedDate,LastModifiedDate,Type,Case_Sub_type__c,Status,Order_Number__c')
        .include('CaseOrderRelationships__r')
        .select(
          'Id, USS_Order__r.SBQQ__Quote__r.Shipping_Address__r.Id,USS_Order__r.SBQQ__Quote__r.Shipping_Address__r.USF_Street__c,USS_Order__r.SBQQ__Quote__r.Shipping_Address__r.USF_City__c,USS_Order__r.SBQQ__Quote__r.Shipping_Address__r.USF_State__c,USS_Order__r.SBQQ__Quote__r.Shipping_Address__r.USF_Zip_Code__c',
        )
        .end()
        .where({
          Order_Number__c: contractId,
          status: 'closed',
          RecordTypeId: { $eq: recordId },
          MYUSS_Show_in_MyUSS__c: true,
          lastModifiedDate: {
            $gte: SfDate.toDateTimeLiteral(new Date(fetchCaseDto.startTime).setUTCHours(0, 0, 0, 0)),
            $lte: SfDate.toDateTimeLiteral(new Date(fetchCaseDto.endTime).setUTCHours(23, 59, 59, 999)),
          },
        })
        .execute();
      return caseList;
    } else {
      const caseList = await this.salesforceBaseService.conn
        .sobject('Case')
        .select('Id, CaseNumber,CreatedDate,LastModifiedDate,Type,Case_Sub_type__c,Status,Order_Number__c')
        .include('CaseOrderRelationships__r')
        .select(
          'Id, USS_Order__r.SBQQ__Quote__r.Shipping_Address__r.Id,USS_Order__r.SBQQ__Quote__r.Shipping_Address__r.USF_Street__c,USS_Order__r.SBQQ__Quote__r.Shipping_Address__r.USF_City__c,USS_Order__r.SBQQ__Quote__r.Shipping_Address__r.USF_State__c,USS_Order__r.SBQQ__Quote__r.Shipping_Address__r.USF_Zip_Code__c',
        )
        .end()
        .where({
          Order_Number__c: contractId,
          Status: { $ne: 'Closed' },
          RecordTypeId: { $eq: recordId },
          MYUSS_Show_in_MyUSS__c: true,
        })
        .execute();
      return caseList;
    }
  }

  async getCaseDetails(id: string): Promise<SFDCCaseDetails> {
    const caseDetails = this.salesforceBaseService.conn
      .sobject('Case')
      .select(
        `Id,
          CaseNumber,
          CreatedDate, 
          LastModifiedDate, 
          Site_Contact_Name__c,
          Site_Contact_Phone__c,
          Case_Sub_type__c, 
          Site_Address__c,
          Contact.Email,
          Contact.FirstName,
          Contact.LastName,
          Status,
          Priority,
          Order_Number__c,
          Skill_Requirement__c,
          Due_Date__c,
          Placement_Notes__c,
          Description__c,
          Description,
          Subject,
          Type`,
      )
      .include('ContentDocumentLinks')
      .select('Id, ContentDocument.LatestPublishedVersionId, ContentDocument.Title')
      .end()
      .include('Tasks')
      .select(
        `Id, 
          Subject, 
          Description, 
          ActivityDate, 
          TaskSubtype, 
          CreatedDate,
          What.Name, 
          What.Type, 
          Who.Name, 
          Who.Email`,
      )
      .end()
      .include('Events')
      .select(
        `Id, 
          Subject, 
          Description, 
          ActivityDateTime, 
          CreatedDate,
          What.Name, 
          What.Type, 
          Who.Name, 
          Who.Email`,
      )
      .end()
      .include('Histories')
      .select(
        `Id,
          Field,
          DataType,
          OldValue, 
          NewValue, 
          CreatedDate, 
          CreatedBy.Name`,
      )
      .where({ DataType: { $ne: 'EntityID' } })
      .end()
      .include('Feeds')
      .select(
        `Id,
          Type,
          Body,
          CreatedById,
          CreatedDate`,
      )
      .where({ Type: 'TextPost' })
      .end()
      .where({ Id: id })
      .execute();
    const commentResp = this.salesforceBaseService.conn
      .sobject('MyUSS_Case_Comment__c')
      .select(
        `Id, 
          Owner.Name,
          Comment__c,  
          Case__c, 
          Comment_Type__c,
          Commented_By__c,
          Commented_By__r.FirstName,
          Commented_By__r.LastName,
          Commented_By__r.Id,
          LastModifiedDate,
          Commented_By_MyUSS_User__c`,
      )
      .include('ContentDocumentLinks')
      .select('Id, ContentDocument.LatestPublishedVersionId, ContentDocument.Title')
      .end()
      .where({ Case__c: id })
      .execute();
    return await Promise.all([caseDetails, commentResp])
      .then((values) => {
        return {
          caseDetails: values[0][0],
          comments: values[1],
          tasks: values[0][0].Tasks?.records,
          events: values[0][0].Events?.records,
          feeds: values[0][0].Feeds?.records,
          histories: values[0][0].Histories?.records,
          success: true,
        };
      })
      .catch((err) => {
        this.loggerService.error(err.message);
        return {
          success: false,
        };
      });
  }

  async createCase(sfdcCaseObj: Case, orderId: string): Promise<SfdcRespModel> {
    try {
      // ensure the case will be visible in MyUSS
      sfdcCaseObj.MYUSS_Show_in_MyUSS__c = true;
      const createCaseResp = await this.salesforceBaseService.createSObject('Case', sfdcCaseObj);
      if (sfdcCaseObj.USF_Order_Text__c) {
        if (orderId) {
          const caseOrderRelationship = {
            Case__c: createCaseResp.id,
            USS_Order__c: orderId,
          };
          await this.salesforceBaseService.createSObject('Case_Order_Relationship__c', caseOrderRelationship);
        }
      }
      const createCaseRespModel = new SfdcRespModel();
      Object.assign(createCaseRespModel, createCaseResp);
      return createCaseRespModel;
    } catch (err) {
      this.loggerService.error(err.message);
      return {
        success: false,
        errors: [err.message],
        id: null,
      };
    }
  }

  async fetchRecordTypeId(type: string): Promise<string> {
    try {
      const recordTypeId = await this.salesforceBaseService.conn
        .sobject('RecordType')
        .select('Id')
        .where({
          Name: type,
        })
        .execute();
      return recordTypeId[0].Id;
    } catch (err) {
      this.loggerService.error(err.message);
      return err.message;
    }
  }

  async addCaseComment(commentObj: MyUSS_Case_Comment): Promise<SfdcRespModel> {
    try {
      const createCommentResp = await this.salesforceBaseService.createSObject('MyUSS_Case_Comment__c', commentObj);
      const createCommentRespModel = new SfdcRespModel();
      Object.assign(createCommentRespModel, createCommentResp);
      if (createCommentRespModel.success) {
        const updateCaseResp = await this.salesforceBaseService.updateSObject('Case', {
          Id: commentObj.Case__c,
          MyUSS_Most_recent_comment__c:
            commentObj.Comment__c.length > 252
              ? commentObj.Comment__c.substring(0, 252) + '...'
              : commentObj.Comment__c,
          MyUSS_Last_comment_from_customer__c: commentObj.Commented_By_MyUSS_User__c,
        });
        return createCommentRespModel;
      } else {
        return {
          success: false,
          errors: createCommentRespModel.errors,
          id: null,
        };
      }
    } catch (err) {
      this.loggerService.error(err.message);
      return {
        success: false,
        errors: [err.message],
        id: null,
      };
    }
  }
  async uploadFile(file: Express.Multer.File, recordId: string): Promise<boolean> {
    const buffer = file[0].buffer;
    const contentInBase64 = buffer.toString('base64');
    try {
      this.uploadFileToSfdc(contentInBase64, file[0].originalname, file[0].mimetype, recordId)
        .then(() => {
          this.loggerService.info('File uploaded Successfully');
          return true;
        })
        .catch((err) => {
          this.loggerService.error(err);
          return false;
        });
    } catch (err) {
      this.loggerService.error(err.message);
      return false;
    }
  }

  async uploadFileToSfdc(base64: string, fileName: string, mimetype: string, recordId: string): Promise<boolean> {
    try {
      //step 1: upload document
      const endpointForUpload = `/services/data/v${API_VERSION}/sobjects/ContentVersion/`;
      const uploadResponse: Object = await this.salesforceBaseService.makeCpqAPICall('POST', endpointForUpload, {
        Title: fileName,
        PathOnClient: fileName,
        ContentLocation: 'S',
        VersionData: base64,
      });
      if (!uploadResponse['success']) {
        this.loggerService.error(uploadResponse['errors']);
        return false;
      }
      //step 2: fetch ContentDocumentId
      const contentDocumentIdResponse: Object = await this.salesforceBaseService.conn
        .sobject('ContentVersion')
        .select('ContentDocumentId')
        .where({ Id: uploadResponse['id'] })
        .limit(1)
        .execute();
      //getting error here
      this.loggerService.info('contentDocumentIdResponse: ', contentDocumentIdResponse);

      //step 3: link the document with the record
      const endpointForLinkDoc = `/services/data/v${API_VERSION}/sobjects/ContentDocumentLink/`;
      const docLinkResponse = await this.salesforceBaseService.makeCpqAPICall('POST', endpointForLinkDoc, {
        ContentDocumentId: contentDocumentIdResponse[0].ContentDocumentId,
        LinkedEntityID: recordId,
        Visibility: 'AllUsers',
        ShareType: 'V',
      });
      if (!docLinkResponse['success']) {
        this.loggerService.error(docLinkResponse['errors']);
        return false;
      } else {
        return true;
      }
    } catch (err) {
      this.loggerService.error(err.message);
      return false;
    }
  }

  async getDocumentBodyForCase(documentId: string): Promise<Blob> {
    const blob = await this.salesforceBaseService.getDocumentBodyForCase(documentId);
    return blob;
  }

  async getContractIdByName(orderText: string): Promise<Contract> {
    const orderShipAddress:Contract = await this.sfdcContractService.getContractIdByName(orderText);
    return orderShipAddress;
  }
}

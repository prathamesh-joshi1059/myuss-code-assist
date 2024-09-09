import { Injectable } from "@nestjs/common";
import { AddUpdateProjectReqDto } from "../../../../myuss/controllers/project/dto/add-update-project-req.dto";
import { SfdcRespModel } from "../../../../myuss/models";
import { Contact } from "../../model/Contact";
import { SBQQ__Quote__c } from "../../model/SBQQ__Quote__c";
import { USF_Account_Project__c } from "../../model/USF_Account_Project__c";
import { USF_Project__c } from "../../model/USF_Project__c";
import { SfdcBaseService } from "../sfdc-base/sfdc-base.service";
import { AssignProjectIdReqDto } from "../../../../myuss/controllers/project/dto/assign-project-id-req.dto";
import { Opportunity } from "../../model/Opportunity";

@Injectable()
export class SfdcProjectService {
  constructor(private sfdcBaseService: SfdcBaseService) {}

  async fetchProjects(accountId: string, status: string): Promise<FetchProjectsResponse> {
    const projectsFromAccContactRelation = await this.sfdcBaseService.conn
      .sobject('USF_Account_Project__c')
      .select(`USF_Project__c`)
      .where({ 'USF_Project__r.USF_USS_Project_Status__c': status, USF_Account__c: accountId })
      .execute({ autoFetch: true, maxFetch: 100000 });

    const projectsFromQuote = await this.sfdcBaseService.getQuery(`select count(id) quotes,
      SBQQ__Opportunity2__r.USF_Project__r.Name, SBQQ__Opportunity2__r.USF_Project__r.Id
      from SBQQ__Quote__C where SBQQ__Account__c = '${accountId}' and 
      SBQQ__Status__c not in ('Archived','Ordered','Rejected') and 
      SBQQ__Opportunity2__r.USF_Project__r.USF_USS_Project_Status__c = '${status}'
      group by SBQQ__Opportunity2__r.USF_Project__r.Name, SBQQ__Opportunity2__r.USF_Project__r.Id
      order by SBQQ__Opportunity2__r.USF_Project__r.Name`);

    const projectsFromOrder = await this.sfdcBaseService.getQuery(`select count(id) orders,
      SBQQ__Quote__r.SBQQ__Opportunity2__r.USF_Project__r.Name, SBQQ__Quote__r.SBQQ__Opportunity2__r.USF_Project__r.Id 
      from Contract where status != 'Canceled' and 
      SBQQ__Quote__r.SBQQ__Account__c = '${accountId}' and 
      SBQQ__Quote__r.SBQQ__Opportunity2__r.USF_Project__r.USF_USS_Project_Status__c = '${status}'
      group by SBQQ__Quote__r.SBQQ__Opportunity2__r.USF_Project__r.Name, SBQQ__Quote__r.SBQQ__Opportunity2__r.USF_Project__r.Id`);

    const quoteOrderCountMap = new Map();
    
    projectsFromQuote.records.forEach(project => {
      if (project.Id) {
        quoteOrderCountMap.set(project.Id, { quotes: project.quotes, orders: 0, cases: 0 });
      }
    });

    projectsFromOrder.records.forEach(project => {
      if (project.Id) {
        if (quoteOrderCountMap.has(project.Id)) {
          quoteOrderCountMap.get(project.Id).orders = project.orders;
        } else {
          quoteOrderCountMap.set(project.Id, { quotes: 0, orders: project.orders, cases: 0 });
        }
      }
    });

    const uniqueProjectIds = await this.getUniqueProjectIds(projectsFromAccContactRelation, projectsFromQuote.records);
    const caseCountFromProject = await this.getCasesCount(uniqueProjectIds);

    caseCountFromProject.records.forEach(async caseCountObj => {
      if (quoteOrderCountMap.has(caseCountObj.USF_Project__c)) {
        quoteOrderCountMap.get(caseCountObj.USF_Project__c).cases = caseCountObj.casesCount;
      } else {
        quoteOrderCountMap.set(caseCountObj.USF_Project__c, { quotes: 0, orders: 0, cases: caseCountObj.casesCount });
      }
    });

    const quoteOrderCount = Object.fromEntries(quoteOrderCountMap);
    const projectList = await this.sfdcBaseService.getSObjectByIds('USF_Project__c', uniqueProjectIds);
    
    const projectResp = new FetchProjectsResponse();
    projectResp.projectList = projectList;
    projectResp.quoteOrderCount = quoteOrderCount;
    return projectResp;
  }

  async getUniqueProjectIds(projectsFromAccContactRelation: USF_Account_Project__c[], projectsFromQuote: SBQQ__Quote__c[]): Promise<string[]> {
    const projectsFromAccContactRelUniqueIds = projectsFromAccContactRelation
      .filter(project => project.USF_Project__c)
      .map(project => project.USF_Project__c);

    const projectsFromQuoteUniqueIds = projectsFromQuote
      .filter(projectFromQuote => projectFromQuote.Id)
      .map(projectFromQuote => projectFromQuote.Id);

    const uniqueProjectIdsSet = new Set([...projectsFromAccContactRelUniqueIds, ...projectsFromQuoteUniqueIds]);
    return Array.from(uniqueProjectIdsSet);
  }

  async addUpdateProject(sfdcProjectObj: USF_Project__c, addUpdateProjectReqDto: AddUpdateProjectReqDto): Promise<SfdcRespModel> {
    const createProjectRespModel = new SfdcRespModel();
    let createProjectResp;

    if (sfdcProjectObj.Id === "") {
      createProjectResp = await this.sfdcBaseService.createSObject('USF_Project__c', sfdcProjectObj);
      Object.assign(createProjectRespModel, createProjectResp);

      if (createProjectRespModel.success) {
        const accProjectRelationObj = new USF_Account_Project__c();
        accProjectRelationObj.USF_Account__c = addUpdateProjectReqDto.accountId;
        accProjectRelationObj.USF_Project_Status__c = sfdcProjectObj.USF_USS_Project_Status__c;
        accProjectRelationObj.USF_Project__c = createProjectRespModel.id;

        const accProjectRelationResp = await this.sfdcBaseService.createSObject('USF_Account_Project__c', accProjectRelationObj);
        const accProjectRelationRespModel = new SfdcRespModel();
        Object.assign(accProjectRelationRespModel, accProjectRelationResp);
        
        if (accProjectRelationRespModel.success && !addUpdateProjectReqDto.isContactExists) {
          this.createContact(addUpdateProjectReqDto);
        }
      }
    } else {
      createProjectResp = await this.sfdcBaseService.updateSObject('USF_Project__c', sfdcProjectObj);
      Object.assign(createProjectRespModel, createProjectResp);

      if (createProjectRespModel.success && !addUpdateProjectReqDto.isContactExists) {
        this.createContact(addUpdateProjectReqDto);
      }
    }
    
    return createProjectRespModel;
  }

  async fetchProjectDetails(projectId: string): Promise<USF_Project__c> {
    const projectDetailResp = await this.sfdcBaseService.getSObjectById('USF_Project__c', projectId);
    return Object.assign(new USF_Project__c(), projectDetailResp);
  }

  async createContact(addUpdateProjectReqDto: AddUpdateProjectReqDto): Promise<void> {
    const contactObj = new Contact();
    contactObj.AccountId = addUpdateProjectReqDto.accountId;
    contactObj.FirstName = addUpdateProjectReqDto.contact.firstName;
    contactObj.LastName = addUpdateProjectReqDto.contact.lastName;
    contactObj.Phone = addUpdateProjectReqDto.contact.phone.replace('+1', '');
    contactObj.Email = addUpdateProjectReqDto.contact.email;
    contactObj.Title = addUpdateProjectReqDto.contact.title;
    await this.sfdcBaseService.createSObject('Contact', contactObj);
  }

  async getCasesCount(projectArray: string[]): Promise<any> {
    return this.sfdcBaseService.getQuery(`select count(id) casesCount, USS_Order__r.SBQQ__Opportunity__r.USF_Project__c,
      USS_Order__r.SBQQ__Opportunity__r.USF_Project__r.Name from Case_Order_Relationship__c 
      where Case__r.status != 'Closed' and USS_Order__r.SBQQ__Opportunity__r.USF_Project__c IN ('${projectArray.join("','")}')
      GROUP BY USS_Order__r.SBQQ__Opportunity__r.USF_Project__r.Name, USS_Order__r.SBQQ__Opportunity__r.USF_Project__c`);
  }

  async assignProjectId(assignProjectIdReqDto: AssignProjectIdReqDto): Promise<boolean> {
    if (assignProjectIdReqDto.quoteIds.length === 0) {
      return false;
    }

    const opportunityIds = await this.sfdcBaseService.getSObjectByIds('SBQQ__Quote__c', assignProjectIdReqDto.quoteIds, ['SBQQ__Opportunity2__c']);
    const quoteRecordsToUpdate = opportunityIds.map(opportunity => {
      const opportunityObj = new Opportunity();
      opportunityObj.Id = opportunity.SBQQ__Opportunity2__c;
      opportunityObj.USF_Project__c = assignProjectIdReqDto.projectId;
      return opportunityObj;
    });

    try {
      const quoteUpdateResult = await this.sfdcBaseService.updateSObjectByIds('Opportunity', quoteRecordsToUpdate);
      const isFailed = quoteUpdateResult.every(quoteUpdateResponse => !quoteUpdateResponse.success);
      if (isFailed) {
        throw new Error('Quote update failed');
      }
      return true;
    } catch {
      return false;
    }
  }

  async updateProjectStatus(projectId: string, projectStatus: string): Promise<any> {
    try {
      const newProjectStatus = projectStatus === 'Active' ? 'Inactive' : 'Active';
      return await this.sfdcBaseService.updateSObject('USF_Project__c', {
        Id: projectId,
        USF_USS_Project_Status__c: newProjectStatus,
      });
    } catch (error) {
      console.error("ERROR...", error);
      return error;
    }
  }
}

export class FetchProjectsResponse {
  projectList: USF_Project__c[];
  quoteOrderCount: Object[];
}
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
  constructor(
    private sfdcBaseService: SfdcBaseService,
  ) {}


  async fetchProjects(accountId: string, status: string): Promise<FetchProjectsResponse> {
    
    const projectsFromAccContactRelation = await this.sfdcBaseService.conn
      .sobject('USF_Account_Project__c')
      .select(`USF_Project__c`)
      .where({ 'USF_Project__r.USF_USS_Project_Status__c':status, USF_Account__c: accountId })
      .execute({ autoFetch: true, maxFetch: 100000 });

      const projectsFromQuote = await this.sfdcBaseService.getQuery(`select count(id) quotes,
      SBQQ__Opportunity2__r.USF_Project__r.Name,SBQQ__Opportunity2__r.USF_Project__r.Id
      from SBQQ__Quote__C  where SBQQ__Account__c  = '${accountId}' and SBQQ__Status__c not in ('Archived','Ordered','Rejected') and SBQQ__Opportunity2__r.USF_Project__r.USF_USS_Project_Status__c = '${status}'
      group by SBQQ__Opportunity2__r.USF_Project__r.Name,SBQQ__Opportunity2__r.USF_Project__r.Id
      order by SBQQ__Opportunity2__r.USF_Project__r.Name`);

    

      const projectsFromOrder = await this.sfdcBaseService.getQuery(`select count(id) orders,
       SBQQ__Quote__r.SBQQ__Opportunity2__r.USF_Project__r.Name,SBQQ__Quote__r.SBQQ__Opportunity2__r.USF_Project__r.Id from Contract 
      where status != 'Canceled' and SBQQ__Quote__r.SBQQ__Account__c = '${accountId}' and SBQQ__Quote__r.SBQQ__Opportunity2__r.USF_Project__r.USF_USS_Project_Status__c = '${status}'
      group by SBQQ__Quote__r.SBQQ__Opportunity2__r.USF_Project__r.Name,SBQQ__Quote__r.SBQQ__Opportunity2__r.USF_Project__r.Id`);
   
      // Initialize the map
        const quoteOrderCountMap = new Map();
        // Populate the map with quotes data
        projectsFromQuote.records.map(project => {
        if (project.Id) {
            quoteOrderCountMap.set(project.Id, { quotes: project.quotes, orders: 0, cases: 0 });
        }
        });

        // Update the map with orders data
        projectsFromOrder.records.map(project => {
        if (project.Id) {
            if (quoteOrderCountMap.has(project.Id)) {
            quoteOrderCountMap.get(project.Id).orders = project.orders;
            } else {
            quoteOrderCountMap.set(project.Id, { quotes: 0, orders: project.orders,cases: 0 });
            }
        }
        });

       // Get cases count according to project

      const uniqueProjectIds = await this.getUniqueProjectIds(projectsFromAccContactRelation, projectsFromQuote.records);
    
      const caseCountFromProject = await this.getCasesCount(uniqueProjectIds);
      caseCountFromProject.records.map(async caseCountObj => {
        if (quoteOrderCountMap.has(caseCountObj.USF_Project__c)) {
          quoteOrderCountMap.get(caseCountObj.USF_Project__c).cases = caseCountObj.casesCount;
          } else {
          quoteOrderCountMap.set(caseCountObj.USF_Project__c, { quotes: 0, orders: 0,cases: caseCountObj.casesCount });
          }
      });
      const quoteOrderCount = Object.fromEntries(quoteOrderCountMap);

      let projectList = await this.sfdcBaseService.getSObjectByIds(
        'USF_Project__c',
        uniqueProjectIds,
      );

      const projectResp = new FetchProjectsResponse();
      projectResp.projectList = projectList;
      projectResp.quoteOrderCount = quoteOrderCount
      return projectResp;
     
  }


  async getUniqueProjectIds(projectsFromAccContactRelation:USF_Account_Project__c[], projectsFromQuote:SBQQ__Quote__c[])  {
    // Extract unique IDs from projectsFromAccContactRelUniqueIds
    const projectsFromAccContactRelUniqueIds = projectsFromAccContactRelation
    .filter(project => project.USF_Project__c !== null && project.USF_Project__c !== undefined)
    .map(project => project.USF_Project__c);

     // Extract unique IDs from projectsFromQuoteUniqueIds
     const projectsFromQuoteUniqueIds = projectsFromQuote
     .filter(projectFromQuote => projectFromQuote.Id !== null && projectFromQuote.Id !== undefined)
     .map(projectFromQuote => projectFromQuote.Id);


    // Combine and return unique IDs
    const uniqueProjectIdsSet = new Set([...projectsFromAccContactRelUniqueIds, ...projectsFromQuoteUniqueIds]);
    return Array.from(uniqueProjectIdsSet);
    };

    async addUpdateProject(sfdcProjectObj: USF_Project__c, addUpdateProjectReqDto:AddUpdateProjectReqDto):Promise<SfdcRespModel>{
        if(sfdcProjectObj.Id === ""){
          const createProjectResp = await this.sfdcBaseService.createSObject('USF_Project__c', sfdcProjectObj);
          const createProjectRespModel = new SfdcRespModel();
          Object.assign(createProjectRespModel, createProjectResp);
          if(createProjectRespModel.success){
            const accProjectRelationObj = new USF_Account_Project__c();
            accProjectRelationObj.USF_Account__c = addUpdateProjectReqDto.accountId;
            accProjectRelationObj.USF_Project_Status__c = sfdcProjectObj.USF_USS_Project_Status__c;
            accProjectRelationObj.USF_Project__c = createProjectRespModel.id;
            const accProjectRelationResp = await this.sfdcBaseService.createSObject('USF_Account_Project__c', accProjectRelationObj);
            const accProjectRelationRespModel = new SfdcRespModel();
            Object.assign(accProjectRelationRespModel, accProjectRelationResp);
            if(accProjectRelationRespModel.success){
              if (!addUpdateProjectReqDto.isContactExists) {
                this.createContact(addUpdateProjectReqDto);
              }
            }
          } 
          return createProjectRespModel;
        }else{
          const createProjectResp = await this.sfdcBaseService.updateSObject('USF_Project__c', sfdcProjectObj);
          const createProjectRespModel = new SfdcRespModel();
          Object.assign(createProjectRespModel, createProjectResp);
          if(createProjectRespModel.success){
            if (!addUpdateProjectReqDto.isContactExists) {
              this.createContact(addUpdateProjectReqDto);
            } 
          }
          return createProjectRespModel;
        }
    }


      async fetchProjectDetails(projectId:string) {
        const projectDetailResp = await this.sfdcBaseService.getSObjectById('USF_Project__c', projectId);
        const projectDetails = Object.assign(new USF_Project__c(), projectDetailResp);
        return projectDetails;
      }

      async createContact(addUpdateProjectReqDto:AddUpdateProjectReqDto){
        const contactObj = new Contact();
        contactObj.AccountId = addUpdateProjectReqDto.accountId;
        contactObj.FirstName = addUpdateProjectReqDto.contact.firstName;
        contactObj.LastName = addUpdateProjectReqDto.contact.lastName;
        contactObj.Phone = (addUpdateProjectReqDto.contact.phone).replace('+1', '');
        contactObj.Email = addUpdateProjectReqDto.contact.email;
        contactObj.Title = addUpdateProjectReqDto.contact.title;
        const createContactResult = await this.sfdcBaseService.createSObject('Contact', contactObj);
      }

      async getCasesCount(projectArray:string[]){
        const casesCountOfProjects = await this.sfdcBaseService.getQuery(`select count(id) casesCount,USS_Order__r.SBQQ__Opportunity__r.USF_Project__c
        , USS_Order__r.SBQQ__Opportunity__r.USF_Project__r.Name from Case_Order_Relationship__c where Case__r.status != 'Closed' and USS_Order__r.SBQQ__Opportunity__r.USF_Project__c IN ('${projectArray.join("','")}')
        GROUP BY USS_Order__r.SBQQ__Opportunity__r.USF_Project__r.Name,USS_Order__r.SBQQ__Opportunity__r.USF_Project__c`);

        return casesCountOfProjects;
      }



      async assignProjectId(assignProjectIdReqDto:AssignProjectIdReqDto): Promise<boolean>{
        let quoteRecordsToUpdate = [];
        
        if (assignProjectIdReqDto.quoteIds.length != 0) {
          const opportunityIds = await this.sfdcBaseService.getSObjectByIds('SBQQ__Quote__c', assignProjectIdReqDto.quoteIds, ['SBQQ__Opportunity2__c']);
          opportunityIds.map((opportunity)=>{
               let opportunityObj = new Opportunity();
               opportunityObj.Id = opportunity.SBQQ__Opportunity2__c;
               opportunityObj.USF_Project__c = assignProjectIdReqDto.projectId;
               quoteRecordsToUpdate.push(opportunityObj);
          });

          const quoteUpdatePromise = this.sfdcBaseService
          .updateSObjectByIds('Opportunity', quoteRecordsToUpdate)
          .then((quoteUpdateResult) => {
            console.log(quoteUpdateResult[0].errors);
            const isFailed = quoteUpdateResult.every((quoteUpdateResponse) => quoteUpdateResponse.success == false);
            if (isFailed) {      
              throw new Error('Quote update failed');
            }
            return true;
          });

          return Promise.all([quoteUpdatePromise])
          .then((values) => {
            return true;
          })
          .catch((error) => {
            return false;
          });    
        }  else {
            return false;
        }
          
      }

      async updateProjectStatus(projectId:string, projectStatus:string){
        try {
          let newProjectStatus = projectStatus == 'Active' ? 'Inactive' : 'Active'
          const updateStatusResponse = await this.sfdcBaseService.updateSObject('USF_Project__c', {
            Id : projectId,
            USF_USS_Project_Status__c : newProjectStatus 
          })
          return updateStatusResponse
        } catch (error) {
          console.log("ERROR...",error)
          return error
        }
      }
  }

  
  
   



export class FetchProjectsResponse{
  projectList: USF_Project__c[]
  quoteOrderCount:Object[]
}
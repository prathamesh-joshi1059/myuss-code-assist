import { USF_Project__c } from "../../../backend/sfdc/model/USF_Project__c";
import { AddUpdateProjectReqDto } from "../../../myuss/controllers/project/dto/add-update-project-req.dto";
import { Address, Contact } from "../../../myuss/models";
import { Project } from "../../../myuss/models/project.model";

export class SFDC_ProjectMapper {


 public static getMyUSSProjectFromSFDCProject(sfdcProject: USF_Project__c,quoteOrderCount:Object[],accountId:string): Project {
    const myUSSProject = new Project();

    myUSSProject.id = sfdcProject.Id;
    myUSSProject.name = sfdcProject.Name;
    myUSSProject.projectNumber = sfdcProject.Project_ID_SF__c;
    myUSSProject.description = sfdcProject.USF_Project_Description__c;
    myUSSProject.category = sfdcProject.USF_Project_Type__c;
    myUSSProject.projectType = sfdcProject.USF_External_Project_Type__c;
    myUSSProject.stage = sfdcProject.Stage__c;
    myUSSProject.status = sfdcProject.USF_USS_Project_Status__c;
    myUSSProject.startDate = sfdcProject.USF_Project_Start_Date__c;
    myUSSProject.endDate = sfdcProject.USF_Completion_Date__c;
 
    myUSSProject.createdDate = sfdcProject.CreatedDate;
    myUSSProject.lastModifiedDate = sfdcProject.LastModifiedDate;
    myUSSProject.accountId = accountId;
    myUSSProject.noOfQuotes = quoteOrderCount[sfdcProject.Id] ? quoteOrderCount[sfdcProject.Id]['quotes']: 0;
    myUSSProject.noOfOrders = quoteOrderCount[sfdcProject.Id] ? quoteOrderCount[sfdcProject.Id]['orders']: 0;
    const addressDetails = new Address();
    addressDetails.street = sfdcProject.USF_Project_Address_1__c;
    addressDetails.city = sfdcProject.USF_Project_City__c;
    addressDetails.state = sfdcProject.USF_Project_State__c;
    addressDetails.zipcode = sfdcProject.USF_Project_Zip_Code__c;
    addressDetails.country = sfdcProject.USF_Project_County__c;  
    myUSSProject.address = addressDetails;
    const contactDetails = new Contact();
    contactDetails.fullName = sfdcProject.USF_Project_Contact_Name__c;
    contactDetails.email = sfdcProject.USF_Project_Contact_Email__c;
    contactDetails.title = sfdcProject.USF_Project_Contact_Title__c;
    contactDetails.phone = sfdcProject.USF_Project_Contact_Phone__c;
    myUSSProject.contact = contactDetails;
    myUSSProject.casesCount = quoteOrderCount[sfdcProject.Id] ? quoteOrderCount[sfdcProject.Id]['cases']: 0;
    
    return myUSSProject;
}

public static getSfdcProjectFromRequest(addProjectReqdto: AddUpdateProjectReqDto): USF_Project__c {
    const sfdcProject = new USF_Project__c();

    sfdcProject.Id = addProjectReqdto.id; 
    sfdcProject.Name  = addProjectReqdto.name;
    sfdcProject.USF_Project_Description__c = addProjectReqdto.description;
    sfdcProject.USF_External_Project_Type__c = addProjectReqdto.projectType;
    sfdcProject.USF_USS_Project_Status__c = addProjectReqdto.status ?? 'Active';
    sfdcProject.USF_Project_Start_Date__c = addProjectReqdto.startDate;
    sfdcProject.USF_Completion_Date__c = (addProjectReqdto.endDate != '') ? addProjectReqdto.endDate : null;
    sfdcProject.USF_Project_Address_1__c = addProjectReqdto.address.street;
    sfdcProject.USF_Project_City__c = addProjectReqdto.address.city;
    sfdcProject.USF_Project_State__c = addProjectReqdto.address.state;
    sfdcProject.USF_Project_Zip_Code__c = addProjectReqdto.address.zipcode;
    sfdcProject.USF_Project_County__c = addProjectReqdto.address.country;
    sfdcProject.USF_Project_Contact_Email__c = addProjectReqdto.contact.email;
    sfdcProject.USF_Project_Contact_Name__c = addProjectReqdto.contact.fullName;
    sfdcProject.USF_Project_Contact_Phone__c = addProjectReqdto.contact.phone;
    sfdcProject.USF_Project_Contact_Title__c = addProjectReqdto.contact.title;
    
    return sfdcProject;
}

}
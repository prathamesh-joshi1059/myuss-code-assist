import { CreateCaseDto } from '../../../myuss/controllers/case/dto/create-case-req.dto';
import { Case as SFDC_Case } from '../../../backend/sfdc/model/Case';
import { Case } from '../../models/case.model';
import { SFDC_ContactMapper } from './contact.mapper';
import { SFDC_AddressMapper } from './address.mapper';
export class SFDC_CaseMapper {
  public static getMyUSSCaseFromSFDCCase(sfdcCase: SFDC_Case): Case {
    const myUSSCase = new Case();
    myUSSCase.id = sfdcCase.Id;
    myUSSCase.caseNumber = sfdcCase.CaseNumber;
    myUSSCase.createdDate = sfdcCase.CreatedDate;
    myUSSCase.lastModifiedDate = sfdcCase.LastModifiedDate;
    myUSSCase.orderNumber = sfdcCase.Order_Number__c ? 'O-' + sfdcCase.Order_Number__c : '';
    myUSSCase.priority = sfdcCase.Priority;
    myUSSCase.status = sfdcCase.Status;
    myUSSCase.caseRegion = sfdcCase.Case_Region__c;
    myUSSCase.type = sfdcCase.Case_Sub_type__c ? sfdcCase.Case_Sub_type__c : 'MySiteServices';
    myUSSCase.siteContactName = sfdcCase.Site_Contact_Name__c;
    myUSSCase.siteContactPhone = sfdcCase.Site_Contact_Phone__c;
    myUSSCase.siteAddress = sfdcCase.Site_Address__c;
    myUSSCase.productType = sfdcCase.Skill_Requirement__c?.split(';')[0];
    myUSSCase.caseType = sfdcCase.Skill_Requirement__c?.split(';')[1];
    myUSSCase.cutOffTimeZone = sfdcCase.Skill_Requirement__c?.split(';')[2];
    myUSSCase.contact = sfdcCase.Contact ? SFDC_ContactMapper.getMyUSSContactFromSFDCContact(sfdcCase.Contact) : null;
    myUSSCase.siteAddress = sfdcCase.Site_Address__c;
    myUSSCase.myUSSLastCommentFromCustomer = sfdcCase.MyUSS_Last_comment_from_customer__c;
    myUSSCase.myUSSMostRecentComment = sfdcCase.MyUSS_Most_recent_comment__c;
    myUSSCase.caseSubType = sfdcCase.Case_Sub_type__c;
    myUSSCase.placementNotes = sfdcCase.Placement_Notes__c;
    myUSSCase.dueDate = sfdcCase.Due_Date__c;
    myUSSCase.subject = sfdcCase.Subject;
    myUSSCase.description = sfdcCase.Description;
    myUSSCase.orderAddress =
      sfdcCase.CaseOrderRelationships__r == undefined || sfdcCase.CaseOrderRelationships__r.length == 0
        ? null
        : SFDC_AddressMapper.getMyUSSAddressFromSFDCAddress(
            sfdcCase.CaseOrderRelationships__r?.[0].USS_Order__r?.SBQQ__Quote__r?.Shipping_Address__r,
          );
    myUSSCase.productInfo = this.isJsonString(sfdcCase.Description__c)
      ? JSON.parse(sfdcCase.Description__c).Data.map((product) => {
          return {
            asset: product.Product,
            size: product.Size,
            noOfUnits: product.Quantity,
            frequency: product['Service Frequency'],
            value: product.Price,
            requestType: product.Action,
            instruction: product.Notes,
          };
        })
      : [];
    myUSSCase.attachments = sfdcCase.ContentDocumentLinks
      ? sfdcCase.ContentDocumentLinks['records'].map((attachment) => {
          return {
            docId: attachment['ContentDocument']['LatestPublishedVersionId'],
            title: attachment.ContentDocument.Title,
          };
        })
      : [];
    return myUSSCase;
  }

  public static getSFDCCaseFromMyUSSCase(myUSSCase: Case): SFDC_Case {
    const sfdcCase = new SFDC_Case();
    sfdcCase.Id = myUSSCase.id;
    sfdcCase.CaseNumber = myUSSCase.caseNumber;
    sfdcCase.CreatedDate = myUSSCase.createdDate;
    sfdcCase.LastModifiedDate = myUSSCase.lastModifiedDate;
    sfdcCase.Order_Number__c = myUSSCase.orderNumber;
    sfdcCase.Priority = myUSSCase.priority;
    sfdcCase.Status = myUSSCase.status;
    sfdcCase.Case_Region__c = myUSSCase.caseRegion;
    sfdcCase.Type = myUSSCase.type;
    sfdcCase.Site_Contact_Name__c = myUSSCase.siteContactName;
    sfdcCase.Site_Contact_Phone__c = myUSSCase.siteContactPhone;
    sfdcCase.Site_Address__c = myUSSCase.siteAddress;
    sfdcCase.MyUSS_Last_comment_from_customer__c = myUSSCase.myUSSLastCommentFromCustomer;
    sfdcCase.MyUSS_Most_recent_comment__c = myUSSCase.myUSSMostRecentComment;
    return sfdcCase;
  }

  public static getSfdcCaseFromRequest(
    createCaseDto: CreateCaseDto,
    recordTypeId: string,
    accountName: string,
  ): SFDC_Case {
    const skillRequirementTimezone = createCaseDto.caseRegion == 'East' ? 'Eastern' : createCaseDto.caseRegion;
    let placementNote: string;
    //if createCaseDto.caseRegion is null then set the priority P4-CT
    const priority = `P4-${
      createCaseDto.caseRegion == null || createCaseDto.caseRegion == undefined
        ? 'CT'
        : this.getProrityTimeZoneFromCaseRegion(createCaseDto.caseRegion)
    }`;

    if (createCaseDto.unitNumbers && createCaseDto.unitNumbers.length > 0) {
      placementNote = `Asset Serial Numbers - ${createCaseDto.unitNumbers.join(', ')} | Notes - ${
        createCaseDto.placementNote
      }`;
    } else {
      placementNote = `Asset Serial Numbers - Not provided | Notes - ${createCaseDto.placementNote}`;
    }
    const sfdcCase = new SFDC_Case();
    sfdcCase.Access_Notes__c = createCaseDto.accessNotes;
    sfdcCase.AccountId = createCaseDto.accountId;
    sfdcCase.Case_Region__c = createCaseDto.caseRegion;
    sfdcCase.Case_Sub_type__c = createCaseDto.caseSubType;
    sfdcCase.ContactId = createCaseDto.contactId;
    sfdcCase.Description__c = createCaseDto.productInfo;
    sfdcCase.Instructions_for_Order_Support__c = createCaseDto.summary;
    sfdcCase.Due_Date__c = createCaseDto.selectedDate;
    sfdcCase.Placement_Notes__c = placementNote;
    sfdcCase.Site_Address__c = createCaseDto.siteAddress;
    sfdcCase.Site_City__c = createCaseDto.siteCityName;
    sfdcCase.Site_Contact_Name__c = createCaseDto.siteContactName;
    sfdcCase.Site_Contact_Phone__c = createCaseDto.siteContactPhone;
    sfdcCase.Site_State__c = createCaseDto.siteStateName;
    sfdcCase.USF_Order_Text__c = createCaseDto.orderName;
    sfdcCase.Zip__c = createCaseDto.zipcode;
    if (createCaseDto.caseRegion == null || createCaseDto.caseRegion == undefined) {
      sfdcCase.Skill_Requirement__c = 'Sanitation;Amendment;';
    } else {
      sfdcCase.Skill_Requirement__c = `Sanitation;Amendment;${skillRequirementTimezone}`;
    }
    sfdcCase.Status = 'New';
    sfdcCase.Systems_to_Update__c = 'Salesforce';
    sfdcCase.Type = 'Amendment';
    sfdcCase.USF_Case_Service_Group__c = 'USF_Order_Support';
    sfdcCase.RecordTypeId = recordTypeId;
    sfdcCase.Origin = 'Web';
    sfdcCase.Subject = `${accountName}/${priority}/Sanitation/Amendment/${createCaseDto.orderName}`;
    sfdcCase.Priority = priority;
    sfdcCase.MyUSS_Case_Type__c = createCaseDto.myussCaseType;
    return sfdcCase;
  }

  public static getSfdcMyUssServiceCaseFromRequest(
    createCaseDto: CreateCaseDto,
    recordTypeId: string,
    accountName: string,
  ): SFDC_Case {
    const sfdcCase = new SFDC_Case();
    sfdcCase.Access_Notes__c = createCaseDto.accessNotes;
    sfdcCase.AccountId = createCaseDto.accountId;
    sfdcCase.Case_Region__c = createCaseDto.caseRegion;
    sfdcCase.Case_Sub_type__c = createCaseDto.caseSubType;
    sfdcCase.ContactId = createCaseDto.contactId;
    sfdcCase.Description = createCaseDto.description;
    sfdcCase.Site_Address__c = createCaseDto.siteAddress;
    sfdcCase.Site_City__c = createCaseDto.siteCityName;
    sfdcCase.Site_Contact_Name__c = createCaseDto.siteContactName;
    sfdcCase.Site_Contact_Phone__c = createCaseDto.siteContactPhone;
    sfdcCase.Site_State__c = createCaseDto.siteStateName;
    sfdcCase.USF_Order_Text__c = createCaseDto.orderName;
    sfdcCase.Zip__c = createCaseDto.zipcode;
    sfdcCase.Status = 'New';
    sfdcCase.Systems_to_Update__c = 'Salesforce';
    sfdcCase.RecordTypeId = recordTypeId;
    sfdcCase.Origin = 'Web';
    sfdcCase.Subject = createCaseDto.subject;
    sfdcCase.Priority = 'White Glove';
    return sfdcCase;
  }
  public static getProrityTimeZoneFromCaseRegion(caseRegion: string): string {
    switch (caseRegion) {
      case 'East':
        return 'ET';
      case 'Central':
        return 'CT';
      case 'Pacific':
        return 'PT';
      case 'Mountain':
        return 'MT';
      default:
        return '';
    }
  }
  public static isJsonString(str) {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  }
}

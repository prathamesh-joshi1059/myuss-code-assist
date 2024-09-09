import { MyUSS_Case_Comment as SFDC_MyUSS_Case_Comment } from "../../../backend/sfdc/model/CaseComment";
import { CaseComment } from "../../models/case-comment";
import { AddCommentReqDto } from "../../controllers/case/dto/add-comment-req.dto";
import { SFDC_ContactMapper } from "./contact.mapper";
import { SFDC_UserMapper } from "./user.mapper";
export class SFDC_MyUSSCaseCommentMapper {
    static getMyUSSCaseCommentFromSFDCMyUSSCaseComment(sfdcMyUSSCaseComment: SFDC_MyUSS_Case_Comment): CaseComment {
        const myUSSCaseComment = new CaseComment();
        let ownerName = SFDC_UserMapper.getMyUSSUserFromSFDCUser(sfdcMyUSSCaseComment.Owner).name
        myUSSCaseComment.id = sfdcMyUSSCaseComment.Id;
        myUSSCaseComment.name = sfdcMyUSSCaseComment.Name;
        myUSSCaseComment.ownerId = sfdcMyUSSCaseComment.OwnerId;
        myUSSCaseComment.commentType = sfdcMyUSSCaseComment.Comment_Type__c;
        myUSSCaseComment.createdById = sfdcMyUSSCaseComment.CreatedById;
        myUSSCaseComment.lastModifiedDate = sfdcMyUSSCaseComment.LastModifiedDate;
        myUSSCaseComment.commentBody = sfdcMyUSSCaseComment.Comment__c;
        myUSSCaseComment.contactId = sfdcMyUSSCaseComment.Commented_By__c;
        myUSSCaseComment.commentedByContact = sfdcMyUSSCaseComment.Commented_By__c ? SFDC_ContactMapper.getMyUSSContactFromSFDCContact(sfdcMyUSSCaseComment.Commented_By__r) : null;
        myUSSCaseComment.commentedByMyUSSUser = sfdcMyUSSCaseComment.Commented_By_MyUSS_User__c;
        myUSSCaseComment.commentedByName = myUSSCaseComment.commentedByMyUSSUser ?
                                           myUSSCaseComment.commentedByContact?.fullName :
                                           ownerName;
        myUSSCaseComment.attachments = sfdcMyUSSCaseComment.ContentDocumentLinks ? 
        sfdcMyUSSCaseComment.ContentDocumentLinks['records'].map((attachment) => {
            return {
                docId: attachment['ContentDocument']['LatestPublishedVersionId'],
                title: attachment['ContentDocument'].Title
            }
        }) : [];
                
        return myUSSCaseComment;
    }
    static getSFDCMyUSSCaseCommentFromMyUSSCaseComment(myUSSCaseComment: CaseComment): SFDC_MyUSS_Case_Comment {
        const sfdcMyUSSCaseComment = new SFDC_MyUSS_Case_Comment();
        sfdcMyUSSCaseComment.Name = myUSSCaseComment.name;
        sfdcMyUSSCaseComment.OwnerId = myUSSCaseComment.ownerId;
        sfdcMyUSSCaseComment.Case__c = myUSSCaseComment.case.id;
        sfdcMyUSSCaseComment.Comment_Type__c = myUSSCaseComment.commentType;
        sfdcMyUSSCaseComment.CreatedById = myUSSCaseComment.createdById;
        sfdcMyUSSCaseComment.LastModifiedDate = myUSSCaseComment.lastModifiedDate;
        sfdcMyUSSCaseComment.Comment__c = myUSSCaseComment.commentBody;
        sfdcMyUSSCaseComment.Commented_By__c = myUSSCaseComment.contactId;
        return sfdcMyUSSCaseComment;
    }
    static getSFDCMyUSSCaseCommentFromRequest(addCommentReqDto: AddCommentReqDto): SFDC_MyUSS_Case_Comment {
        const myUSSCaseComment = new SFDC_MyUSS_Case_Comment();
        
        myUSSCaseComment.Case__c = addCommentReqDto.caseId;
        myUSSCaseComment.Comment_Type__c = addCommentReqDto.type;
        myUSSCaseComment.Commented_By__c = addCommentReqDto.contactId;
        myUSSCaseComment.Comment__c = addCommentReqDto.comment;
        myUSSCaseComment.Commented_By_MyUSS_User__c = true
        return myUSSCaseComment;
    }

}
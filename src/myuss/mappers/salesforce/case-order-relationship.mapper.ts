import { CaseOrderRelationship } from "../../../myuss/models/case-order-relationship.model";
import { Case_Order_Relationship__c as SFDCCaseOrderRelationship } from "../../../backend/sfdc/model/Case_Order_Relationship__c"

export class SFDC_CaseOrderRelationship {
    static getMyUSSCaseOrderRelationshipFromSFDCCaseOrderRelationship(sfdcCaseOrderRelationship: SFDCCaseOrderRelationship) {
        const caseOrderRelationship = new CaseOrderRelationship();
        caseOrderRelationship.id = sfdcCaseOrderRelationship.Id;
        caseOrderRelationship.caseId = sfdcCaseOrderRelationship.Case__c;
        caseOrderRelationship.contractId = sfdcCaseOrderRelationship.USS_Order__c;
        return caseOrderRelationship;
    }
    static getSFDCCaseOrderRelationshipFromMyUSSCaseOrderRelationship(caseOrderRelationship: CaseOrderRelationship) {
        const sfdcCaseOrderRelationship = new SFDCCaseOrderRelationship();
        sfdcCaseOrderRelationship.Id = caseOrderRelationship.id;
        sfdcCaseOrderRelationship.Case__c = caseOrderRelationship.caseId;
        sfdcCaseOrderRelationship.USS_Order__c = caseOrderRelationship.contractId;
        return sfdcCaseOrderRelationship;
    }
    
}
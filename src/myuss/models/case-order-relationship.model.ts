export class CaseOrderRelationship {
    id?: string;
    caseId?: string;
    contractId?: string;
    totalSize?: number;
    
    constructor() {
        this.id = '';
        this.caseId = '';
        this.contractId = '';
    }
}
// export class Case_Order_Relationship__c {
  
//     expr0:number;
//     MyUSS_Case_Type__c: string;
//     USS_Order__c: string;
//     Case__c: string;
//   }
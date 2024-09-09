import { Event as SFDCEvent } from './Event';
import { Contact } from './Contact';
import { SFDC_Object } from './SFDC_Base';
import { Feeds } from './Feeds';
import { Tasks } from './Tasks';
import { History } from './History';
import { MyUSS_Case_Comment } from './CaseComment';
import { Case_Order_Relationship__c } from './Case_Order_Relationship__c';

export class Case extends SFDC_Object {
  Id: string;
  CaseNumber: string;
  CreatedDate: string;
  Order_Number__c: string;
  Priority: string;
  Status: string;
  Case_Region__c: string;
  Type: string;
  Site_Contact_Name__c: string;
  Site_Contact_Phone__c: string;
  Site_Address__c: string;
  LastModifiedDate: string;
  Case_Sub_type__c: string;
  AccountId: string;
  Skill_Requirement__c: string;
  ContactId: string;
  Contact: Contact;
  Access_Notes__c?: string;
  Description?: string;
  Description__c?: string;
  Due_Date__c?: string;
  Placement_Notes__c?: string;
  Site_City__c?: string;
  Site_State__c?: string;
  USF_Order_Text__c?: string;
  Zip__c?: string;
  Systems_to_Update__c?: string;
  USF_Case_Service_Group__c?: string;
  RecordTypeId?: string;
  Origin?: string;
  Subject?: string;
  MyUSS_Last_comment_from_customer__c?: boolean;
  MyUSS_Most_recent_comment__c?: string;
  MYUSS_Show_in_MyUSS__c?: boolean;
  Instructions_for_Order_Support__c?: string;
  ContentDocumentLinks: Object[];
  CaseOrderRelationships__r?: Case_Order_Relationship__c[];
  MyUSS_Case_Type__c?:string;
  //ToDo: Create a new class for ContentDocumentLinks

  constructor() {
    super();
    this.Id = '';
  }
  public setTypeAttribute(): void {
    super._setTypeAttribute('Case');
  }
}
export class SFDCCaseDetails {
  caseDetails?: Case;
  comments?: MyUSS_Case_Comment[];
  events?: SFDCEvent[];
  feeds?: Feeds[];
  tasks?: Tasks[];
  histories?: History[];
  success: boolean;
}

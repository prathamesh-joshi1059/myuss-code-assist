import { Case } from "./Case";
import { Contact } from "./Contact";
import { SFDC_Object } from "./SFDC_Base";
import { User } from "./User";

export class MyUSS_Case_Comment extends SFDC_Object {
    Id: string;
    Name: string;
    OwnerId: string;
    Owner: User;
    Case__c: string;
    Case__r: Case;
    Comment_Type__c: string;
    CreatedById: string;
    LastModifiedId: string;
    Comment__c: string;
    LastModifiedDate: string;
    Commented_By__c: string;
    Commented_By__r: Contact;
    Commented_By_MyUSS_User__c: boolean;
    ContentDocumentLinks: Object[];

    
    public setTypeAttribute(): void {
      super._setTypeAttribute('MyUSS_Case_Comment__c');
    }
  }
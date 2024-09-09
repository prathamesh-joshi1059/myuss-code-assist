import { Case } from "./case.model";
import { Contact } from "./contact.model";
import { Attachment } from "./case.model";

export class CaseComment {
    id: string;
    name: string;
    ownerId: string;
    case: Case;
    commentType: string;
    createdById: string;
    lastModifiedDate: string;
    commentBody: string
    contactId: string;
    commentedByContact: Contact;
    commentedByName: string;
    commentedByMyUSSUser: boolean;
    attachments: Attachment[]

    constructor() {
        this.id = '';
      }
  }
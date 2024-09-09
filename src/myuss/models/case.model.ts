import { Contact } from './contact.model';
import { CaseComment } from './case-comment';
import { Address } from './address.model';

export class Case {
  id: string;
  caseNumber: string;
  createdDate: string;
  lastModifiedDate: string;
  orderNumber: string;
  priority: string;
  status: string;
  caseRegion: string;
  type: string;
  contact: Contact;
  siteContactName: string;
  siteContactPhone: string;
  siteAddress: string;
  productType: string;
  caseType: string;
  cutOffTimeZone: string;
  contactName: string;
  contactEmail: string;
  myUSSLastCommentFromCustomer?: boolean;
  myUSSMostRecentComment?: string;
  caseSubType: string;
  placementNotes?: string;
  dueDate?: string;
  productInfo?: ProductInfo[];
  attachments: Attachment[];
  subject: string;
  description: string;
  orderAddress?: Address;
  myussCaseType?: string;
  constructor() {
    this.id = '';
  }
}

  
export class Activity {
  dateTime: string;
  activity: string;
}
export class CaseDetails {
  caseDetails: Case;
  comments: CaseComment[];
  activities: Activity[];
}
export class Attachment {
  docId: string;
  title: string;
}
export class ProductInfo {
  product: string;
  size: string;
  quantity: number;
  serviceFrequency: string;
  price: number;
  action: string;
  notes: string;
}

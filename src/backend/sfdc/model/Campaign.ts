export class Campaign {
  Id: string;
  Name: string;
  IsActive: boolean;
}

export class CampaignMember {
  Id: string;
  CampaignId: string;
  LeadId: string;
  ContactId: string;
}
import { MyUSSEligibilityResult } from "../../../../uss-web/models/myuss-eligibility";
import { RequestForQuote } from "../../../../uss-web/models/request-for-quote.model";

export class CreateWebRFQResponseDto {
  error: string;
  hasError: boolean;
  marketing_cloud: MarketingCloudResult;
  myuss_eligibility: MyUSSEligibilityResult;
  sfdc_rfq: SalesforceRFQResult;
  rfq_id: string;
  jwt: string;
  rfq: RequestForQuote;
  constructor() {
    this.marketing_cloud = new MarketingCloudResult();
    this.myuss_eligibility = new MyUSSEligibilityResult();
    this.sfdc_rfq = new SalesforceRFQResult();
  }
}

class MarketingCloudResult {
  status: string;
  error: string;
}

class SalesforceRFQResult {
  status?: string;
  id?: string;
  error?: string;
  result?: string;
}
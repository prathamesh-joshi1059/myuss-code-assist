import { Account } from "../../backend/sfdc/model/Account";
import { Contact } from "../../backend/sfdc/model/Contact";
import { Serviceable_Zip_Code__c } from "../../backend/sfdc/model/Serviceable_Zip_Code__c";

export class MyUSSEligibilityResult {
  eligible: boolean;
  rule_results: EligibilityRuleResult[];
  existing_myuss_user: boolean;
  error: string;

  constructor() {
    this.existing_myuss_user = false;
    this.eligible = true;
  }

  public setErrorAndFail(error: string) {
    this.error = error;
    this.eligible = false;
  }
}

export class EligibilityRuleResult {
  public readonly rule: string;
  public passed: boolean;
  public details: string;

  constructor(rule: string, passed?: boolean, details?: string) {
    this.rule = rule;
    this.passed = passed;
    this.details = details;
  }

  public setFailed(details: string) {
    // if the rule passed state is not changing set the details, concatenate if already set and state is not changing
    if (this.passed === false) {
      this.details = this.details ? `${this.details}; ${details}` : details;
    } else {
      this.details = details;
    }
    // set to failed
    this.passed = false;
  }   
}

export class SalesforceEligibilityData {
  contacts: Contact[];
  accounts: Account[];
  serviceable_zip_codes: Serviceable_Zip_Code__c[];
  has_error: boolean;
  error_message: string;

  constructor() {
    this.contacts = [];
    this.accounts = [];
    this.serviceable_zip_codes = [];
    this.has_error = false;
    this.error_message = null;
  }
}
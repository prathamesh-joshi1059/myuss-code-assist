import { Logger } from '@nestjs/common';
import { EligibilityRuleResult, SalesforceEligibilityData } from '../../models/myuss-eligibility';
import { RequestForQuote } from '../../models/request-for-quote.model';
import { CompanyName } from './companyNameEnum';
/**
 * Helper class for evaluating eligibility rules
 *
 * Each rule should return an EligibilityRuleResult object
 * Each rule starts by assuming that it passes then evaluates data conditions for failure
 * If the rule fails then the EligibilityRuleResult object is updated with the failure details
 *
 */

export class EligibilityRulesHelper {
  private static readonly _logger = new Logger(EligibilityRulesHelper.name);
  private static readonly _rules = {
    localRules: ['evaluateStartDate', 'evaluatePurposeAndKindOfUse', 'evaluateProducts', 'evaluateMyUSSAcceptingRFQs'],
    salesforceRules: ['checkForExistingContacts', 'checkForExistingAccounts', 'checkForServiceableZipCodes'],
  };
  private static readonly minNumberOfDaysForStartDate = 2;
  private static readonly maxNumberOfProducts = 5;
  private static readonly eligibleProducts = [
    'Standard Restroom',
    'Deluxe Restroom',
    'ADA Portable Toilet',
    'Hand Washing Stations',
    'Hand Washing',
    'Portable Sink Rental',
  ];

  public static getEligbilityForLocalRules(rfq: RequestForQuote): EligibilityRuleResult[] {
    const results: EligibilityRuleResult[] = [];
    this._rules.localRules.forEach((rule) => {
      results.push(this[rule](rfq));
    });
    return results;
  }

  public static getEligbilityForSalesforceRules(
    rfq: RequestForQuote,
    salesforceEligibilityData: SalesforceEligibilityData,
  ): EligibilityRuleResult[] {
    const results: EligibilityRuleResult[] = [];
    this._rules.salesforceRules.forEach((rule) => {
      results.push(this[rule](rfq, salesforceEligibilityData));
    });
    return results;
  }

  // #region LOCAL RULES
  // global flag to turn off all RFQ redirects to MyUSS
  private static evaluateMyUSSAcceptingRFQs(rfq: RequestForQuote): EligibilityRuleResult {
    const acceptingRFQs = process.env.MYUSS_ACCEPTING_RFQS === 'true';
    const result = new EligibilityRuleResult('evaluateMyUSSAcceptingRFQs', true, 'MyUSS is accepting RFQs');
    if (!acceptingRFQs) {
      result.setFailed('MyUSS is not accepting RFQs');
    }
    return result;
  }

  private static evaluateProducts(rfq: RequestForQuote): EligibilityRuleResult {
    // set the rule to passed by default
    const result = new EligibilityRuleResult('evaluateProducts', true, 'Passed products eligibility');
    // •	Only eligible Products are selected
    // o	Standard Restroom
    // o	Hand Washing Stations
    // •	Total number of products is less than or equal to 3
    const standardProducts = rfq.products.filter((product) => product.productType === 'standard'); // RFQHelper.parseProducts(rfq.crm_standardproducts);
    const specialtyProducts = rfq.products.filter((product) => product.productType === 'specialty'); // RFQHelper.parseProducts(rfq.crm_specialtyproducts);
    this._logger.verbose('Standard Products: ', standardProducts);
    this._logger.verbose('Specialty Products: ', specialtyProducts);
    // can't have any specialty products
    if (specialtyProducts.length > 0) {
      result.setFailed('Specialty products are not supported in MyUSS');
    }
    // can't have more than 3 products
    if (standardProducts.reduce((acc, product) => acc + product.quantity, 0) > this.maxNumberOfProducts) {
      result.setFailed('Cannot have more than 5 products');
    }
    // can't have any ineligible products
    if (standardProducts.some((product) => !this.eligibleProducts.includes(product.name))) {
      result.setFailed('RFQ has ineligible products');
    }
    return result;
  }

  private static evaluateStartDate(rfq: RequestForQuote): EligibilityRuleResult {
    // set the rule to passed by default
    const result = new EligibilityRuleResult('evaluateStartDate', true, 'Passed start date');
    // •	Start Date is at least 2 days out and not on a weekend.  Start time and End time cannot be same.
    const startDate = new Date(rfq.startDate);
    this._logger.verbose('Start Date: ', startDate);
    const today = new Date();
    const minEligibleStartDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + this.minNumberOfDaysForStartDate,
    );
    this._logger.verbose('Min Eligible Start Date: ', minEligibleStartDate);
    if (startDate < minEligibleStartDate) {
      result.setFailed('Start date must be at least 2 days from today');
    }
    if (startDate.getDay() === 0 || startDate.getDay() === 6) {
      result.setFailed('Start date cannot be on a weekend');
    }
    return result;
  }

  private static evaluatePurposeAndKindOfUse(rfq: RequestForQuote): EligibilityRuleResult {
    // set the rule to passed by default
    const result = new EligibilityRuleResult('evaluatePurposeAndKindOfUse', true, 'Passed purpose and kind of use');
    // •	Purpose of Rental is Business or Personal (i.e. not Government).  Allow blanks
    if (rfq.purposeOfRental && rfq.purposeOfRental === 'Government') {
      result.setFailed('Rental purpose must be business or personal');
    }
    // •	If Business then Use Type is Construction or Other
    // •	If Consumer (personal) then any Use Type is acceptable
    // allow blanks
    if (rfq.purposeOfRental === 'Business' && rfq.useType && rfq.useType !== 'Construction' && rfq.useType !== 'Other') {
      result.setFailed('Business rental purpose requires construction or other kind of use');
    }
    return result;
  }
  //#endregion LOCAL RULES

  // #region SALESFORCE RULES
  private static checkForExistingContacts(
    rfq: RequestForQuote,
    salesforceEligibilityData: SalesforceEligibilityData,
  ): EligibilityRuleResult {
    const result = new EligibilityRuleResult('checkForExistingContacts', true, 'No existing contacts');
    // if there are contacts but at least one is a MyUSS user then also pass, set the details to existing user
    if (salesforceEligibilityData.contacts && salesforceEligibilityData.contacts.length > 0) {
      if (salesforceEligibilityData.contacts.some((contact) => contact.USS_Portal_User__r)) {
        result.details = 'Existing MyUSS user';
        // if there are contacts but none are MyUSS users then fail
      } else {
        result.setFailed('Email address already exists for a Contact in Salesforce but no MyUSS user exists');
      }
    }
    // if there are contacts but none are MyUSS users then fail
    return result;
  }

  private static checkForExistingAccounts(
    rfq: RequestForQuote,
    salesforceEligibilityData: SalesforceEligibilityData,
  ): EligibilityRuleResult {
   
    const result = new EligibilityRuleResult('checkForExistingAccounts', true, 'No existing accounts');
    let filteredAccounts = [];
    let companyName = [ 'na',  'n/a', 'none'];
    // filter out dummy account names and closed accounts
    if (salesforceEligibilityData.accounts && salesforceEligibilityData.accounts.length > 0) {
      filteredAccounts = salesforceEligibilityData.accounts.filter((account) => {
      

         // Convert account name to lowercase and trim it for case-insensitive comparison
    const lowercaseName = account.Name.toLowerCase().trim();
    this._logger.log('Lowercase Name: ', lowercaseName);
    // Check if the lowercase name is not included in the companyName array
    return !(companyName.includes(lowercaseName) || account.Account_Payment_Status__c === 'CLOSED');
      });
    }
    // if there are still accounts then check for MyUSS users
    if (filteredAccounts.length > 0 && salesforceEligibilityData.contacts.length > 0) {
      // if this an existing MyUSS User then they're ok
      if (salesforceEligibilityData.contacts.some((contact) => contact.USS_Portal_User__r)) {
        result.details = 'Account found for existing MyUSS user';
      }
      // if no MyUSS user then the check fails
      else {
        result.setFailed('Account exists in Salesforce but no MyUSS user exists for this email address');
      }
    }
    return result;
  }

  private static checkForServiceableZipCodes(
    rfq: RequestForQuote,
    salesforceEligibilityData: SalesforceEligibilityData,
  ): EligibilityRuleResult {
    const result = new EligibilityRuleResult('checkForServiceableZipCodes', true, 'Serviceable zip codes found');
    // if there are no serviceable zip codes then fail
    if (salesforceEligibilityData.serviceable_zip_codes.length === 0) {
      result.setFailed('ZIP Code is not eligible for MyUSS');
    }
    return result;
  }
  // #endregion SALESFORCE RULES
}

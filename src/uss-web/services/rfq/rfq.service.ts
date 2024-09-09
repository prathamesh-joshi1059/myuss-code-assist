import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { CreateWebRFQResponseDto } from '../../controllers/rfq/dto/create-web-rfq-response.dto';
import { SfdcRFQService } from '../../../backend/sfdc/services/sfdc-rfq/sfdc-rfq.service';
import { SfmcRequestForQuoteService } from '../../../backend/marketing-cloud/services/sfmc-request-for-quote/sfmc-request-for-quote.service';
import { SfmcRequestForQuote } from '../../../backend/marketing-cloud/models/sfmc-request-for-quote';
import { LoggerService } from '../../../core/logger/logger.service';
import { MyUSSEligibilityResult, SalesforceEligibilityData } from '../../../uss-web/models/myuss-eligibility';
import { SfdcContactService } from '../../../backend/sfdc/services/sfdc-contact/sfdc-contact.service';
import { SfdcAccountService } from '../../../backend/sfdc/services/sfdc-account/sfdc-account.service';
import { SfdcServiceableZipCodeService } from '../../../backend/sfdc/services/sfdc-serviceable-zip-code/sfdc-serviceable-zip-code.service';
import { EligibilityRulesHelper } from './eligilibity-rules.helper';
import { RequestForQuote } from '../../models/request-for-quote.model';
import { SFDC_RFQMapper } from '../../mappers/salesforce/request-for-quote.mapper';
import { ErrorResponse } from '../../models/error-response.model';
import { AuthService } from '../../../auth/auth/auth.service';
import { SFMC_RFQJourneyMapper } from '../../mappers/marketing-cloud/sfmc-rfq-journey.mapper';
import { FirestoreService } from '../../../backend/google/firestore/firestore.service';
import { BranchService } from '../branch/branch.service';
import { ConfigService } from '@nestjs/config';
import { ApiRespDTO } from '../../../common/dto/api-resp.dto';

@Injectable()
export class RFQService {
  private rfqBranchFilter: boolean = true;
  private irrelevantProductCodes: string[] = [
    '93064', // Restroom Trailer Rental Cost
    '93053', // Porta Potty Rental Cost
    '93058', // Temporary Fence Rental Cost
  ]

  constructor(
    private sfdcRFQService: SfdcRFQService,
    private logger: LoggerService,
    private marketingCloudService: SfmcRequestForQuoteService,
    private sfdcContactService: SfdcContactService,
    private sfdcAccountService: SfdcAccountService,
    private sfdcServiceableZipCodeService: SfdcServiceableZipCodeService,
    private authService: AuthService,
    private firestoreService: FirestoreService,
    private branchService: BranchService,
    private configService: ConfigService,
    ) {
      this.rfqBranchFilter = this.configService.get<boolean>('RFQ_BRANCH_FILTER');
    }

  async getRFQbyId(id: string): Promise<ApiRespDTO<RequestForQuote>> {
    const sfdcRFQ = await this.sfdcRFQService.getRFQbyGUID(id);
    if (!sfdcRFQ) {
      throw {
        status: HttpStatus.NOT_FOUND,
        message: `RFQ with id ${id} not found`,
        data: null,
        success: false
      };
    }
    return {
      success: true,
      status: 1000,
      message : "Success",
      data : SFDC_RFQMapper.mapFromSalesforceRequestForQuote(sfdcRFQ)
    }
  }

  async storeRawRFQData(rfq: RequestForQuote): Promise<void> {
    await this.firestoreService.upsertDocument('rfq', rfq.id, 
        {...rfq, lastModified: new Date()}
      );
  }

  async createOrUpdateWebRFQ(rfq: RequestForQuote, eligibility: MyUSSEligibilityResult, action: 'create' | 'update'): Promise<CreateWebRFQResponseDto | ErrorResponse> {
    let response = new CreateWebRFQResponseDto();
    const promises = [];
    // add the eligibility to the response
    response.myuss_eligibility = eligibility;
    response.rfq_id = rfq.id;
    response.rfq = rfq;
    if (rfq.formStatus && rfq.formStatus === 'complete') {
      // send the RFQ to Marketing Cloud async
      const marketingCloudResp = this.sendRFQToMarketingCloud(rfq)
      .then((resp) => {
        this.logger.info('Marketing Cloud response: ', JSON.stringify(resp));
        response.marketing_cloud.status = 'success';
        return resp.eventInstanceId;
      }).catch((error) => {
        this.logger.error('Marketing Cloud error: ' + JSON.stringify(error.message, error.data));
        response.marketing_cloud.status = error.statusText;
        response.marketing_cloud.error = error.message;      
        return error;
      });
      rfq.sentToMarketingCloud = true;
      promises.push(marketingCloudResp);
    }
    // send to Salesforce async
    const salesforceResp = this.sendRFQToSalesforce(rfq, eligibility, action)
    .then((resp) => {
      this.logger.info('Salesforce response: ', JSON.stringify(resp));
      response.sfdc_rfq = {...resp};
    }).catch((error) => {
      response.sfdc_rfq.status = error.statusText;
      response.sfdc_rfq.error = error.message;
    });
    promises.push(salesforceResp);

    // create the SFMC and SFDC requests in parallel
    await Promise.all(promises);
    // create and add the JWT to the response
    response.jwt = await this.createJWT(rfq.id);
    return response;
  }

  async createJWT(id: string): Promise<string> {
    const jwt = await this.authService.generateRFQToken(id);
    this.logger.info('JWT: ', jwt);
    return jwt;
  }

  public async getEligibilityWrapper(rfq: RequestForQuote): Promise<MyUSSEligibilityResult> {
    let eligibility = new MyUSSEligibilityResult();
    // if complete then get eligibility
    if (rfq.formStatus && rfq.formStatus === 'complete') {
      try {
        eligibility = await this.getEligibility(rfq);
      } catch (error) {
        Logger.error(error);
        eligibility.setErrorAndFail(error.message);
      }
    } else {
      eligibility.setErrorAndFail('Form is not complete');
    }
    return eligibility;
  }

  public async getEligibility(rfq: RequestForQuote): Promise<MyUSSEligibilityResult> {
    const result = new MyUSSEligibilityResult();
    // evaluate for myUSS qualification
    const localRulesEligibility = EligibilityRulesHelper.getEligbilityForLocalRules(rfq);
    this.logger.info('Local rules eligibility: ', localRulesEligibility);
    // TODO: do something with local eligibility and then check salesforce eligibility
    // if the local eligibility rules failed then return the response, no need to check salesforce
    if (localRulesEligibility.some((rule) => rule.passed === false)) {
      result.eligible = false;
      result.rule_results = localRulesEligibility;
      return result;
    }
    // if the local eligibility rules passed then check salesforce
    const salesforceEligibilityData = await this.getSalesforceEligibilityData(rfq);
    // if there was an error retrieving the data then eligibility fails and return the response
    if (salesforceEligibilityData.has_error) {
      result.eligible = false;
      result.rule_results = localRulesEligibility;
      result.error = salesforceEligibilityData.error_message;
      return result;
    }
    const salesforceRulesEligibility = EligibilityRulesHelper.getEligbilityForSalesforceRules(rfq, salesforceEligibilityData);
    // if there is a MyUSS user then set the flag
    result.existing_myuss_user = salesforceEligibilityData.contacts.filter(contact => contact.USS_Portal_User__r).length > 0;
    this.logger.info('Salesforce rules eligibility: ', salesforceRulesEligibility);
    // combine local and Salesforce eligibility results
    const combinedEligibility = localRulesEligibility.concat(salesforceRulesEligibility);
    // if any rules don't pass then it's ineligible
    if (combinedEligibility.some((rule) => !rule.passed)) {
      result.eligible = false;
    }
    result.rule_results = combinedEligibility;
    return result;
  }

  async sendRFQToSalesforce(rfq: RequestForQuote, eligibility: MyUSSEligibilityResult, action: 'create' | 'update'): Promise<any> {
    const salesforceRFQ = SFDC_RFQMapper.mapWebRFQToSalesforceRFQ(rfq, eligibility);
    if (action === 'create') {
      return await this.sfdcRFQService.createRFQ(salesforceRFQ);
    } else {
      return await this.sfdcRFQService.updateRFQByGUID(rfq.id, salesforceRFQ);
    }
  }

  async sendRFQToMarketingCloud(rfq: RequestForQuote): Promise<any> {
    this.logger.info('Sending RFQ to Marketing Cloud');
    const sfmcRFQ = SFMC_RFQJourneyMapper.mapRFQtoJourneyEntryDTO(rfq);
    this.logger.info('SFMC RFQ DTO: ', sfmcRFQ);
    return this.marketingCloudService.postRFQtToSFMC(sfmcRFQ);
  }

  mapWebRFQtoMarketingCloudRFQ(rfq: RequestForQuote): SfmcRequestForQuote {
    const sfmcRFQ = Object.assign(new SfmcRequestForQuote(), rfq);
    return sfmcRFQ;
  }

  // Some products that can be added to RFQs in the web form are not relevant to the Salesforce RFQ
  filterIrrelevantProducts(rfq: RequestForQuote): RequestForQuote {
    if (!rfq.products || rfq.products.length === 0) {
      return rfq;
    }
    // filter out irrelevant products
    rfq.products = rfq.products.filter((product) => !this.irrelevantProductCodes.includes(product.code));
    return rfq;
  }

  async getSalesforceEligibilityData(rfq: RequestForQuote): Promise<SalesforceEligibilityData> {
    // TODO: convert to a compound query potentially
    const result = new SalesforceEligibilityData();
    // •	Email address does not exist on any Contact in Salesforce that is not yet established as a MyUSS portal user
    // first get all the data
    const getContacts = this.sfdcContactService.getContactByEmail(rfq.emailAddress)
    .then((resp) => {
      this.logger.info('Contacts: ', resp);
      result.contacts = resp.records;
    })
    .catch((error) => {
      this.logger.error('Contacts error: ' + JSON.stringify(error));
      result.error_message = `${result.error_message ? result.error_message = '; ' : ''}Error retrieving contacts: ${error.message}`;
      result.has_error = true;
    });
    // •	check to ensure the Company Name does not exist in Salesforce on any Account UNLESS the Account is already established as a MyUSS portal user
    // if this is a consumer or the company name field is somehow blank then use the first and last name
    let companyName = '';
    if (!rfq.companyName || rfq.purposeOfRental === 'Personal') {
      companyName = (rfq.firstName + ' ' + rfq.lastName).trim();
    } else {
      companyName = rfq.companyName;
    }
    const getAccounts = this.sfdcAccountService.getAccountByName(companyName)
    .then((resp) => {
      this.logger.info('Accounts: ', JSON.stringify(resp));
      result.accounts = resp.records;
    })
    .catch((error) => {
      this.logger.error('Accounts error: ' + JSON.stringify(error));
      result.error_message = `${result.error_message ? result.error_message = '; ' : ''}Error retrieving accounts: ${error.message}`;
      result.has_error = true;
    });
    // Get branches that are elgibile for the RFQ from Firebase
    const eligibleBranchIds = (await this.branchService.getEligibleBranches()).map((branch) => branch.id);
    // •	Delivery ZIP Code is serviced by Salesforce
    const getServiceableZipCodes = this.sfdcServiceableZipCodeService.getServiceableZipCodeByZIP(rfq.deliveryZipCode)
    .then((serviceableZipCode) => {
      let zips = [];
      if (serviceableZipCode && serviceableZipCode.location_code__c) {
        zips.push(serviceableZipCode);
      }
      // Branch is eligible for RFQ if the flag is on 
      if (this.rfqBranchFilter && zips.length > 0) {
        zips = zips.filter((zip) => eligibleBranchIds.includes(zip.location_code__c));
      }
      result.serviceable_zip_codes = zips;
    })
    .catch((error) => {
      this.logger.error('Serviceable Zip Codes error', error);
      result.error_message = `${result.error_message ? result.error_message = '; ' : ''}Error retrieving serviceable zip codes: ${error.message}`;
      result.has_error = true;
    });
    await Promise.all([getContacts, getAccounts, getServiceableZipCodes]);
    this.logger.info('SFDC Data Result: ', result);
    return result;
  }  

}

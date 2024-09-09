import { Test, TestingModule } from '@nestjs/testing';
import { RFQController } from './rfq.controller';
import { RFQService } from '../../services/rfq/rfq.service';
import { RequestForQuote } from '../../../uss-web/models/request-for-quote.model';
import { SfdcRFQService } from '../../../backend/sfdc/services/sfdc-rfq/sfdc-rfq.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../../../auth/auth/auth.service';
import { FirestoreService } from '../../../backend/google/firestore/firestore.service';
import { RecaptchaService } from '../../../backend/google/recaptcha/recaptcha.service';
import { SfmcBaseService } from '../../../backend/marketing-cloud/services/sfmc-base/sfmc-base.service';
import { SfmcRequestForQuoteService } from '../../../backend/marketing-cloud/services/sfmc-request-for-quote/sfmc-request-for-quote.service';
import { SfdcAccountService } from '../../../backend/sfdc/services/sfdc-account/sfdc-account.service';
import { SfdcBaseService } from '../../../backend/sfdc/services/sfdc-base/sfdc-base.service';
import { SfdcContactService } from '../../../backend/sfdc/services/sfdc-contact/sfdc-contact.service';
import { SfdcServiceableZipCodeService } from '../../../backend/sfdc/services/sfdc-serviceable-zip-code/sfdc-serviceable-zip-code.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { CreateWebRFQResponseDto } from './dto/create-web-rfq-response.dto';
import { LeadsService } from '../../services/leads/leads.service';
import { SfdcLeadService } from '../../../backend/sfdc/services/sfdc-lead/sfdc-lead.service';
import { LeadScoringService } from '../../services/lead-scoring/lead-scoring.service';
import { SfdcCampaignService } from '../../../backend/sfdc/services/sfdc-campaign/sfdc-campaign.service';
import { Auth0MyUSSAPIService } from '../../../backend/auth0/services/auth0-myuss-api/auth0-myuss-api.service';
import { UserService } from '../../../myuss/services/user/user.service';
import { SfdcUssPortalUserService } from '../../../backend/sfdc/services/sfdc-uss-portal-user/sfdc-uss-portal-user.service';
import { HttpService } from '@nestjs/axios';
import { SfdcQuoteService } from '../../../backend/sfdc/services/sfdc-quote/sfdc-quote.service';
import { ContractService } from '../../../myuss/services/contract/contract.service';
import { PaymentMethodsService } from '../../../myuss/services/payment/payment-methods.service';
import { StripeService } from '../../../backend/stripe/services/stripe/stripe.service';
import { SfdcDocumentService } from '../../../backend/sfdc/services/sfdc-document/sfdc-document.service';
import { SfdcContractService } from '../../../backend/sfdc/services/sfdc-contract/sfdc-contract.service';
import { BranchService } from '../../services/branch/branch.service';
import { SfdcServiceTerritoryService } from '../../../backend/sfdc/services/sfdc-service-territory/sfdc-service-territory.service';
import { GoogleMapsService } from '../../../backend/google/google-maps/google-maps.service';
import {Auth0ManagementAPIService} from "../../../backend/auth0/services/auth0-management-api/auth0-management-api.service";
import {Auth0UserService} from "../../../backend/auth0/services/auth0-user/auth0-user.service";
import { CacheService } from '../../../core/cache/cache.service';
// mocks
jest.mock('../../../core/cache/cache.service');

describe('RFQController', () => {
  let controller: RFQController;
  let service: RFQService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RFQController],
      providers: [
        SfdcRFQService,
        LoggerService,
        SfmcRequestForQuoteService,
        SfdcBaseService,
        SfdcContactService,
        SfdcAccountService,
        SfdcLeadService,
        SfdcServiceableZipCodeService,
        SfdcServiceTerritoryService,
        AuthService,
        RecaptchaService,
        FirestoreService,
        ConfigService,
        JwtService,
        SfmcBaseService,
        BranchService,
        RFQService,
        LeadsService,
        SfdcLeadService,
        LeadScoringService,
        SfdcCampaignService,
        Auth0MyUSSAPIService,
        HttpService,
        UserService,
        SfdcUssPortalUserService,
        SfdcQuoteService,
        ContractService,
        PaymentMethodsService,
        StripeService,
        SfdcDocumentService,
        SfdcContractService,
        GoogleMapsService,
        Auth0ManagementAPIService,
        Auth0UserService,
        CacheService,
         {provide: 'AXIOS_INSTANCE_TOKEN', useValue: {} },
         {provide: GoogleMapsService, useValue: {} },
      
      ],
    }).compile();

    controller = module.get<RFQController>(RFQController);
    service = module.get<RFQService>(RFQService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

});
import { Test, TestingModule } from '@nestjs/testing';
import { RFQService } from './rfq.service';
import { CoreModule } from '../../../core/core.module';
import { SfdcRFQService } from '../../../backend/sfdc/services/sfdc-rfq/sfdc-rfq.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { SfmcRequestForQuoteService } from '../../../backend/marketing-cloud/services/sfmc-request-for-quote/sfmc-request-for-quote.service';
import { SfdcContactService } from '../../../backend/sfdc/services/sfdc-contact/sfdc-contact.service';
import { SfdcAccountService } from '../../../backend/sfdc/services/sfdc-account/sfdc-account.service';
import { SfdcServiceableZipCodeService } from '../../../backend/sfdc/services/sfdc-serviceable-zip-code/sfdc-serviceable-zip-code.service';
import { AuthService } from '../../../auth/auth/auth.service';
import { FirestoreService } from '../../../backend/google/firestore/firestore.service';
import { RecaptchaService } from '../../../backend/google/recaptcha/recaptcha.service';
import { SfdcCpqModule } from '../../../backend/sfdc/sfdc-cpq.module';
import { ConfigService } from '@nestjs/config';
import { SfmcBaseService } from '../../../backend/marketing-cloud/services/sfmc-base/sfmc-base.service';
import { JwtService } from '@nestjs/jwt';
import { SfdcBaseService } from '../../../backend/sfdc/services/sfdc-base/sfdc-base.service';
import { RecaptchaResponse } from '../../../backend/google/models/recaptcha-result.model';
import { BranchService } from '../branch/branch.service';
import { SfdcServiceTerritoryService } from '../../../backend/sfdc/services/sfdc-service-territory/sfdc-service-territory.service';
// import { HttpService } from '@nestjs/axios';

describe('RFQService', () => {
  let service: RFQService;
  let recaptchaService: RecaptchaService;

  beforeEach(async () => {
    const configService = new ConfigService();
    recaptchaService = new RecaptchaService(configService, new LoggerService(configService));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RFQService,
        SfdcRFQService,
        LoggerService,
        SfmcRequestForQuoteService,
        SfdcBaseService,
        SfdcContactService,
        SfdcAccountService,
        SfdcServiceableZipCodeService,
        SfdcServiceTerritoryService,
        AuthService,
        RecaptchaService,
        FirestoreService,
        ConfigService,
        JwtService,
        SfmcBaseService,
        BranchService,
      ],
    }).compile();

    service = module.get<RFQService>(RFQService);
  });

  it('should be defined', () => {
    const pass = new RecaptchaResponse();
    pass.success = true;
    pass.failureReason = '';
    pass.message = 'bypassRecaptcha is true';

    jest.spyOn(recaptchaService, 'verifyRecaptcha').mockImplementation(() => Promise.resolve(pass));
    expect(service).toBeDefined();
  });

});

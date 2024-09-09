import { Test, TestingModule } from '@nestjs/testing';
import { PaymentInfoService } from './payment-info.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { SfdcQuoteService } from '../../../backend/sfdc/services/sfdc-quote/sfdc-quote.service';
import { StripeService } from '../../../backend/stripe/services/stripe/stripe.service';
import { ConfigService } from '@nestjs/config';
import { SfdcBaseService } from '../../../backend/sfdc/services/sfdc-base/sfdc-base.service';
import { SfdcDocumentService } from '../../../backend/sfdc/services/sfdc-document/sfdc-document.service';
import { SfdcAccountService } from '../../../backend/sfdc/services/sfdc-account/sfdc-account.service';

jest.mock('../../../backend/sfdc/services/sfdc-account/sfdc-account.service');

describe('PaymentInfoService', () => {
  let service: PaymentInfoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentInfoService,
        LoggerService,
        SfdcQuoteService,
        SfdcAccountService,
        StripeService,
        ConfigService,
        SfdcBaseService,
        SfdcDocumentService,
      ],
    }).compile();

    service = module.get<PaymentInfoService>(PaymentInfoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

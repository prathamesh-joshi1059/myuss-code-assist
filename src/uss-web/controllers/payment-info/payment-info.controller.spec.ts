import { Test, TestingModule } from '@nestjs/testing';
import { PaymentInfoController } from './payment-info.controller';
import { PaymentMethodAuthGuard } from '../../../auth/auth/payment-method/payment-method.guard';
import { LoggerService } from '../../../core/logger/logger.service';
import { PaymentInfoService } from '../../services/payment-info/payment-info.service';
import { AuthService } from '../../../auth/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SfdcQuoteService } from '../../../backend/sfdc/services/sfdc-quote/sfdc-quote.service';
import { SfdcBaseService } from '../../../backend/sfdc/services/sfdc-base/sfdc-base.service';
import { SfdcDocumentService } from '../../../backend/sfdc/services/sfdc-document/sfdc-document.service';
import { StripeService } from '../../../backend/stripe/services/stripe/stripe.service';
import { RecaptchaService } from '../../../backend/google/recaptcha/recaptcha.service';
import { SfdcAccountService } from '../../../backend/sfdc/services/sfdc-account/sfdc-account.service';
// mocks
jest.mock('../../../backend/sfdc/services/sfdc-account/sfdc-account.service');

describe('PaymentInfoController', () => {
  let controller: PaymentInfoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentInfoController],
      providers: [
        PaymentMethodAuthGuard,
        LoggerService,
        PaymentInfoService,
        AuthService,
        JwtService,
        ConfigService,
        SfdcQuoteService,
        SfdcBaseService,
        SfdcDocumentService,
        SfdcAccountService,
        StripeService,
        RecaptchaService
        
      ],
    }).compile();

    controller = module.get<PaymentInfoController>(PaymentInfoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

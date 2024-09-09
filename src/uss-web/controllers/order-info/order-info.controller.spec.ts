import { Test, TestingModule } from '@nestjs/testing';
import { OrderInfoController } from './order-info.controller';
import { CoreModule } from '../../../core/core.module';
import { OrderInfoService } from '../../services/order-info/order-info.service';
import { GoogleModule } from '../../../backend/google/google.module';
import { LoggerService } from '../../../core/logger/logger.service';
import { CacheService } from '../../../core/cache/cache.service';
jest.mock('../../../core/cache/cache.service');
import { RecaptchaService } from '../../../backend/google/recaptcha/recaptcha.service';
import { SfdcContractService } from '../../../backend/sfdc/services/sfdc-contract/sfdc-contract.service';
import { PaymentMethodsService } from '../../../myuss/services/payment/payment-methods.service';
import { StripeService } from '../../../backend/stripe/services/stripe/stripe.service';
import { SfdcBaseService } from '../../../backend/sfdc/services/sfdc-base/sfdc-base.service';
import { ConfigService } from '@nestjs/config';
import { SfdcAccountService } from '../../../backend/sfdc/services/sfdc-account/sfdc-account.service';
import { TrackUserActionService } from '../../../core/track-user-action/track-user-action-service';

describe('OrderInfoController', () => {
  let controller: OrderInfoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [GoogleModule],
      controllers: [OrderInfoController],
      providers: [
        OrderInfoService,
        LoggerService,
        RecaptchaService,
        SfdcContractService,
        PaymentMethodsService,
        StripeService,
        SfdcBaseService,
        ConfigService,
        SfdcAccountService,
        CacheService,
        TrackUserActionService
      ],
    }).compile();

    controller = module.get<OrderInfoController>(OrderInfoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

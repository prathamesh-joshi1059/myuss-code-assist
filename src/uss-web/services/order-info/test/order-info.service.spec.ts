import { Test, TestingModule } from '@nestjs/testing';
import { OrderInfoService } from '../order-info.service';
import { SfdcContractService } from '../../../../backend/sfdc/services/sfdc-contract/sfdc-contract.service';
import { SfdcBaseService } from '../../../../backend/sfdc/services/sfdc-base/sfdc-base.service';
import { PaymentMethodsService } from '../../../../myuss/services/payment/payment-methods.service';
import { LoggerService } from '../../../../core/logger/logger.service';
import { StripeService } from '../../../../backend/stripe/services/stripe/stripe.service';
import { ConfigService } from '@nestjs/config';
import { SfdcAccountService } from '../../../../backend/sfdc/services/sfdc-account/sfdc-account.service';

describe('OrderInfoService', () => {
  let service: OrderInfoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderInfoService,
        SfdcContractService,
        SfdcBaseService,
        PaymentMethodsService,
        LoggerService,
        StripeService,
        ConfigService,
        SfdcAccountService,
      ],
    }).compile();

    service = module.get<OrderInfoService>(OrderInfoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

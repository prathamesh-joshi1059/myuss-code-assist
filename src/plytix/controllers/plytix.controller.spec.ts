import { Test, TestingModule } from '@nestjs/testing';
import { PlytixController } from './plytix.controller';
import { PlytixService } from '../services/plytix.service';
import { LoggerService } from '../../core/logger/logger.service';
import { PlytixWebhookCallReqDTO } from '../models/plytix-webhook-call-req.dto';

describe('PlytixController', () => {
  let controller: PlytixController;
  let plytixService: PlytixService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlytixController],
      providers: [
        {
          provide: PlytixService,
          useValue: {
            plytixWebhookCall: jest.fn(),
            processPubsubMessage: jest.fn(),
          },
        },
        {
          provide: LoggerService,
          useValue: {
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PlytixController>(PlytixController);
    plytixService = module.get<PlytixService>(PlytixService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('plytixWebhookCall', () => {
    it('should call plytixService.plytixWebhookCall with correct parameters', async () => {
      const dto: PlytixWebhookCallReqDTO = {
        processed_products: 10,
        feed_url: 'http://example.com',
        channel_processing_status: 'success',
      };

      await controller.plytixWebhookCall(dto);

      expect(plytixService.plytixWebhookCall).toHaveBeenCalledWith(dto);
    });
  });
});

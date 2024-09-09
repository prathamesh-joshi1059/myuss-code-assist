import { Test, TestingModule } from '@nestjs/testing';
import { RecaptchaService } from './recaptcha.service';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../../core/logger/logger.service';

describe('RecaptchaService', () => {
  let service: RecaptchaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RecaptchaService, ConfigService,LoggerService],
    }).compile();

    service = module.get<RecaptchaService>(RecaptchaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

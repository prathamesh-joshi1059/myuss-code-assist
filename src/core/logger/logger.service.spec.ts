import { Test, TestingModule } from '@nestjs/testing';
import { LoggerService } from './logger.service';
import { ConfigService } from '@nestjs/config';

describe('LoggerService', () => {
  let service: LoggerService;

  let mockConfigService = { 
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LoggerService, { provide: ConfigService, useValue: mockConfigService }],
    }).compile();

    service = module.get<LoggerService>(LoggerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

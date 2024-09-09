import { Test, TestingModule } from '@nestjs/testing';
import { AvalaraCalculateTaxService } from './calculate-tax.service';
import { LoggerService } from '../../../../core/logger/logger.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

describe('CalculateTaxService', () => {
  let service: AvalaraCalculateTaxService;

  let mockConfigService = {
    get: jest.fn((key: string) => {
      const configMap = {
        AVALARA_USERNAME: 'test',
        AVALARA_PASSWORD: 'test',
        ENVIRONMENT: 'test',
      };
      if (configMap[key]) {
        return configMap[key];
      }
      return null;
    }),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvalaraCalculateTaxService,
        LoggerService,
        HttpService,
        {provide: ConfigService, useValue: mockConfigService},
        { provide: 'AXIOS_INSTANCE_TOKEN', useValue: {} },
      ],
    }).compile();

    service = module.get<AvalaraCalculateTaxService>(
      AvalaraCalculateTaxService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

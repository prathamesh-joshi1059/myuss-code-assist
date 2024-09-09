import { Test, TestingModule } from '@nestjs/testing';
import { Auth0ManagementAPIService } from './auth0-management-api.service';
import { HttpService } from '@nestjs/axios';
import { LoggerService } from '../../../../core/logger/logger.service';
import { ConfigService } from '@nestjs/config';

describe('Auth0ManagementBaseService', () => {
  let service: Auth0ManagementAPIService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Auth0ManagementAPIService,
        HttpService,
        LoggerService,
        ConfigService,
        { provide: 'AXIOS_INSTANCE_TOKEN', useValue: {} },
      ],
    }).compile();

    service = module.get<Auth0ManagementAPIService>(Auth0ManagementAPIService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

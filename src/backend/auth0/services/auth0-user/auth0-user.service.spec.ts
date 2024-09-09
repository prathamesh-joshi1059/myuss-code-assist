import { Test, TestingModule } from '@nestjs/testing';
import { Auth0UserService } from './auth0-user.service';
import { HttpService } from '@nestjs/axios';
import { LoggerService } from '../../../../core/logger/logger.service';
import { Auth0ManagementAPIService } from '../auth0-management-api/auth0-management-api.service';
import { ConfigService } from '@nestjs/config';
import {Auth0MyUSSAPIService} from '../auth0-myuss-api/auth0-myuss-api.service';
describe('UserMigrationService', () => {
  let service: Auth0UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Auth0UserService,
        HttpService,
        LoggerService,
        Auth0ManagementAPIService,
        ConfigService,
        Auth0MyUSSAPIService,
        { provide: 'AXIOS_INSTANCE_TOKEN', useValue: {} },
      ],
    }).compile();

    service = module.get<Auth0UserService>(Auth0UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

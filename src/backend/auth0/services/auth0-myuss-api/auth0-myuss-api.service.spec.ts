import { Test, TestingModule } from '@nestjs/testing';
import { Auth0MyUSSAPIService } from './auth0-myuss-api.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../../../core/logger/logger.service';
import { mock } from 'node:test';
import { AccessTokenResponse } from '../../model/accessTokenResponse.model';
import {Auth0ManagementAPIService} from '../auth0-management-api/auth0-management-api.service';

describe('Auth0MyUSSAPIService', () => {
  let service: Auth0MyUSSAPIService;
 
  let mockConfigServvice = {
    get: jest.fn(),

  }
 
  // Mock Logger Service
  let mockLoggerService = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  }

  // Mock HTTP Service

  let mockHttpService = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
    head: jest.fn(),
    request: jest.fn(),
    getUri: jest.fn(),
  }

  // Mock the dependencies and functions





  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [],
      providers: [
        Auth0MyUSSAPIService,
        Auth0ManagementAPIService,
       
        { provide: 'AXIOS_INSTANCE_TOKEN', useValue: {} },
        {provide: HttpService , useValue: mockHttpService},
        {provide: ConfigService, useValue: mockConfigServvice},
        {provide: LoggerService, useValue: mockLoggerService}
      ],
    }).compile();

    service = module.get<Auth0MyUSSAPIService>(
      Auth0MyUSSAPIService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });







  

  


 
});
















import { Test, TestingModule } from '@nestjs/testing';
import { SfdcUssPortalUserService } from './sfdc-uss-portal-user.service';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../../../core/logger/logger.service';
import { CacheService} from '../../../../core/cache/cache.service';
jest.mock('../../../../core/cache/cache.service');
import { SfdcBaseService } from '../sfdc-base/sfdc-base.service';
import { SfdcAccountService } from '../sfdc-account/sfdc-account.service';

describe('UssPortalUserService', () => {
  let service: SfdcUssPortalUserService;

  // Mock the SfdcBaseService
  let mockSfdcService = {
    login: jest.fn(),
    getQuery: jest.fn(),
    updateSObject: jest.fn(),
    getMetadata: jest.fn(),
    createSObject: jest.fn(),
    updateSObjectByExternalId: jest.fn(),
    getSObjectById: jest.fn(),
    getSObjectRecordsByField: jest.fn(),
    getSObjectByIds: jest.fn(),
    getApex: jest.fn(),
    patchApex: jest.fn(),
    getDocumentBodyJSF: jest.fn(),
    postApex: jest.fn(),
    getDocumentBody: jest.fn(),
  };

  // Mock the SfdcAccountService
  let mockSfdcAccountService = {
    getAccountByName: jest.fn(),
    getAccountNumberByUSSAccountId: jest.fn(),
  };

  //Mock Config Service
  let mockConfigService = {
    get: jest.fn(),
  };

 
// This bolck run before every test
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SfdcUssPortalUserService,
        LoggerService,
        { provide: SfdcBaseService, useValue: mockSfdcService },
        CacheService,
        {provide: ConfigService, useValue: mockConfigService},
        { provide: SfdcAccountService, useValue: mockSfdcAccountService },
      ],
    }).compile();

    service = module.get<SfdcUssPortalUserService>(SfdcUssPortalUserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

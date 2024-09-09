import { Test, TestingModule } from '@nestjs/testing';
import { SfdcCpqService } from './sfdc-cpq.service';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../../../core/logger/logger.service';
import { SfdcBaseService } from '../sfdc-base/sfdc-base.service';
import { SfdcUssPortalUserService } from '../sfdc-uss-portal-user/sfdc-uss-portal-user.service';
import { SfdcDocumentService } from '../sfdc-document/sfdc-document.service';
import { CacheService } from '../../../../core/cache/cache.service';
import { CPQPriceRulesEngineService } from './cpq-price-rules-engine/cpq-price-rules-engine.service';
// mocks
jest.mock('../sfdc-base/sfdc-base.service');
jest.mock('../sfdc-uss-portal-user/sfdc-uss-portal-user.service');
jest.mock('../sfdc-document/sfdc-document.service');
jest.mock('../../../../core/logger/logger.service');
jest.mock('../../../../core/cache/cache.service');
jest.mock('./cpq-price-rules-engine/cpq-price-rules-engine.service');

describe('SfdcCpqService', () => {
  let service: SfdcCpqService;

  // Mock Config Service
  let mockConfigService = {
    get: jest.fn(),
  };
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

  // Mock Logger Service
  let mockLoggerService = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),

  }

  // Mock SfdcUssPortalUserService

  let mockSfdcUssPortalUserService = {
    getUssPortalUser: jest.fn(),
  }

  //Mock SfdcDocument Service

  let mockSfdcDocumentService = {
    getDocumentBody: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SfdcCpqService,
        CacheService,
        CPQPriceRulesEngineService,
        { provide: SfdcBaseService, useValue: mockSfdcService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: LoggerService, useValue: mockLoggerService },
        {provide: SfdcUssPortalUserService, useValue: mockSfdcUssPortalUserService},
        {provide: SfdcDocumentService, useValue: mockSfdcDocumentService},
      ],
    }).compile();

    service = module.get<SfdcCpqService>(SfdcCpqService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

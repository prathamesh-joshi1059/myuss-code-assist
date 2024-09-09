import { Test, TestingModule } from '@nestjs/testing';
import { SfdcAddressService } from './sfdc-address.service';
import { SfdcBaseService } from '../sfdc-base/sfdc-base.service';
import { LoggerService } from '../../../../core/logger/logger.service';

describe('SfdcAddressService', () => {
  let service: SfdcAddressService;
  let mockLoggerService = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    info: jest.fn(),
  };
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SfdcAddressService,
    { provide: SfdcBaseService, useValue: mockSfdcService },
    { provide: LoggerService, useValue: mockLoggerService }],
    }).compile();

    service = module.get<SfdcAddressService>(SfdcAddressService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

});

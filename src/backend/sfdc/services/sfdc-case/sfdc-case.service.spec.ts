import { Test, TestingModule } from '@nestjs/testing';
import { SfdcCaseService } from './sfdc-case.service';
import { SfdcBaseService } from '../sfdc-base/sfdc-base.service';
import { LoggerService } from '../../../../core/logger/logger.service';

describe('SfdcCaseService', () => {
  let service: SfdcCaseService;
  let mockSfdcBaseService = {
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
  let mockLoggerService = {
    log: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SfdcCaseService,
        { provide: SfdcBaseService, useValue: mockSfdcBaseService },
        { provide: LoggerService, useValue: mockLoggerService },
      ],
    }).compile();

    service = module.get<SfdcCaseService>(SfdcCaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

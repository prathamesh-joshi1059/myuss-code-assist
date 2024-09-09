import { Test, TestingModule } from "@nestjs/testing";
import { LoggerService } from "src/core/logger/logger.service";
import { SfdcBaseService } from "../sfdc-base/sfdc-base.service";
import { SfdcProjectService } from "./sfdc-project.service";



jest.mock('../sfdc-base/sfdc-base.service');
jest.mock('@nestjs/config');

describe('SfdcProjectService', () => {
  let service: SfdcProjectService;
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
      providers: [SfdcProjectService,
        { provide: SfdcBaseService, useValue: mockSfdcBaseService },
        { provide: LoggerService, useValue: mockLoggerService },
      ],
    }).compile();

    service = module.get<SfdcProjectService>(SfdcProjectService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

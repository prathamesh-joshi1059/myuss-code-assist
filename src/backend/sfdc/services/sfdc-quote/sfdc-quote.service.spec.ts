import { Test, TestingModule } from '@nestjs/testing';
import { SfdcQuoteService } from './sfdc-quote.service';
import { SfdcBaseService } from '../sfdc-base/sfdc-base.service';
import { ConfigService } from '@nestjs/config';
import { SfdcDocumentService } from '../sfdc-document/sfdc-document.service';
import { LoggerService } from '../../../../core/logger/logger.service';
import { SfdcAccountService } from '../sfdc-account/sfdc-account.service';

// Mock SFDCAccountService
jest.mock('../sfdc-account/sfdc-account.service');
jest.mock('../sfdc-base/sfdc-base.service');
jest.mock('@nestjs/config');

describe('SfdcQuoteService', () => {
  let service: SfdcQuoteService;
  let accountService: SfdcAccountService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SfdcQuoteService,
        SfdcDocumentService,
        LoggerService,
        SfdcAccountService,
        SfdcBaseService,
        ConfigService,
      ],
    }).compile();

    accountService = module.get<SfdcAccountService>(SfdcAccountService);
    service = module.get<SfdcQuoteService>(SfdcQuoteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return test account', async () => {
    const mockAccountList = await accountService.getAccounts();
    const firstAccount = mockAccountList[0];
    expect(firstAccount.Name).toEqual('account1');
  });

  it('should be account1', async () => {
    const account = await accountService.getAccountByName('account1');
    expect(account.Name).toEqual('account1');
  });

});

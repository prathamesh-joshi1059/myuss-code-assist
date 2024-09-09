import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from '../../../sidetrade/services/user/user.service';
import { SfdcUssPortalUserService } from '../../../backend/sfdc/services/sfdc-uss-portal-user/sfdc-uss-portal-user.service';
import { SfdcQuoteService } from '../../../backend/sfdc/services/sfdc-quote/sfdc-quote.service';
import { SfdcContractService } from '../../../backend/sfdc/services/sfdc-contract/sfdc-contract.service';
import { SfdcBaseService } from '../../../backend/sfdc/services/sfdc-base/sfdc-base.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { Auth0UserService } from '../../../backend/auth0/services/auth0-user/auth0-user.service';
import { CacheService } from '../../../core/cache/cache.service';

// mocks
jest.mock('../../../backend/sfdc/services/sfdc-base/sfdc-base.service');
jest.mock('../../../backend/sfdc/services/sfdc-uss-portal-user/sfdc-uss-portal-user.service');
jest.mock('../../../backend/sfdc/services/sfdc-quote/sfdc-quote.service');
jest.mock('../../../backend/sfdc/services/sfdc-contract/sfdc-contract.service');
jest.mock('../../../backend/auth0/services/auth0-user/auth0-user.service');
jest.mock('../../../sidetrade/services/user/user.service');
jest.mock('../../../core/logger/logger.service');
jest.mock('../../../core/cache/cache.service');

describe('UserController', () => {
  let controller: UserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        UserService,
        SfdcBaseService,
        SfdcUssPortalUserService,
        SfdcQuoteService,
        SfdcContractService,
        LoggerService,
        Auth0UserService,
        CacheService,
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

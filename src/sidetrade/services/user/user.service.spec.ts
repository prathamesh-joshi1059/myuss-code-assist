import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { Auth0UserService } from '../../../backend/auth0/services/auth0-user/auth0-user.service';
import { Auth0MyUSSAPIService } from '../../../backend/auth0/services/auth0-myuss-api/auth0-myuss-api.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { Auth0ManagementAPIService } from '../../../backend/auth0/services/auth0-management-api/auth0-management-api.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { FirestoreService } from '../../../backend/google/firestore/firestore.service';
import {SfdcUssPortalUserService} from '../../../backend/sfdc/services/sfdc-uss-portal-user/sfdc-uss-portal-user.service';
import {SfdcAccountService} from '../../../backend/sfdc/services/sfdc-account/sfdc-account.service';
import {SfdcContactService} from '../../../backend/sfdc/services/sfdc-contact/sfdc-contact.service';
import {SFMC_SidetradeUserMigrationService} from "../../../backend/marketing-cloud/services/sfmc-sidetrade-user-migration/sfmc-sidetrade-user-migration.service";
import { CacheService } from '../../../core/cache/cache.service';
import { SfmcBaseService } from '../../../backend/marketing-cloud/services/sfmc-base/sfmc-base.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        Auth0UserService,
        Auth0MyUSSAPIService,
        LoggerService,
        Auth0ManagementAPIService,
        HttpService,
        ConfigService,
        FirestoreService,
        SfdcUssPortalUserService,
        SfdcAccountService,
        SfdcContactService,
        SFMC_SidetradeUserMigrationService,
        CacheService,
        SfmcBaseService,
        { provide: CACHE_MANAGER, useValue: {} },
        { provide: 'AXIOS_INSTANCE_TOKEN', useValue: {} },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

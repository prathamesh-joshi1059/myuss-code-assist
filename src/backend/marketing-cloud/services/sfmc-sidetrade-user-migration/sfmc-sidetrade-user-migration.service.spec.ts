import { Test, TestingModule } from '@nestjs/testing';
import { SFMC_SidetradeUserMigrationService } from './sfmc-sidetrade-user-migration.service';
import {LoggerService} from '../../../../core/logger/logger.service';
import {ConfigService} from '@nestjs/config';
import {SfmcBaseService} from '../sfmc-base/sfmc-base.service';

describe('SFMC_SidetradeUserMigrationService', () => {
  let service: SFMC_SidetradeUserMigrationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SFMC_SidetradeUserMigrationService,LoggerService, ConfigService,SfmcBaseService],
    }).compile();

    service = module.get<SFMC_SidetradeUserMigrationService>(SFMC_SidetradeUserMigrationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

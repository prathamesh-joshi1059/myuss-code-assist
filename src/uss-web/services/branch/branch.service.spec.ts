import { Test, TestingModule } from '@nestjs/testing';
import { BranchService } from './branch.service';
import { FirestoreService } from '../../../backend/google/firestore/firestore.service';
import { AdminGuard } from '../../../auth/admin/admin.guard';
import { SfdcServiceTerritoryService } from '../../../backend/sfdc/services/sfdc-service-territory/sfdc-service-territory.service';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../../core/logger/logger.service';
import { SfdcBaseService } from '../../../backend/sfdc/services/sfdc-base/sfdc-base.service';

describe('BranchService', () => {
  let service: BranchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BranchService,
        FirestoreService,
        AdminGuard,
        SfdcServiceTerritoryService,
        SfdcBaseService,
        ConfigService,
        LoggerService,
      ],
    }).compile();

    service = module.get<BranchService>(BranchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

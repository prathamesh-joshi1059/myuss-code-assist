import { Test, TestingModule } from '@nestjs/testing';
import { BranchesController } from './branches.controller';
import { LoggerService } from '../../../core/logger/logger.service';
import { ConfigService } from '@nestjs/config';
import { BranchService } from '../../services/branch/branch.service';
import { FirestoreService } from '../../../backend/google/firestore/firestore.service';
import { SfdcServiceTerritoryService } from '../../../backend/sfdc/services/sfdc-service-territory/sfdc-service-territory.service';

describe('BranchesController', () => {
  let controller: BranchesController;

  const mockFirestoreService = {
    getBranches: jest.fn(),
    getBranch: jest.fn(),
  };

  const mockSfdcServiceTerritoryService = {
    getTerritory: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BranchesController],
      providers: [
        ConfigService,
        LoggerService,
        BranchService,
        { provide: SfdcServiceTerritoryService, useValue: mockSfdcServiceTerritoryService},
        { provide: FirestoreService, useValue: mockFirestoreService },
      ],
    }).compile();

    controller = module.get<BranchesController>(BranchesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

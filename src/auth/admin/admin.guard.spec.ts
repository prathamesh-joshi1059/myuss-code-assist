import { ConfigService } from '@nestjs/config';
import { AdminGuard } from './admin.guard';
import { Test, TestingModule } from '@nestjs/testing';
import { LoggerService } from '../../core/logger/logger.service';

describe('AdminGuard', () => {
  let adminGuard: AdminGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConfigService, AdminGuard, LoggerService]
    }).compile();

    adminGuard = module.get<AdminGuard>(AdminGuard);
  });

  it('should be defined', () => {
    expect(adminGuard).toBeDefined();
  });

});

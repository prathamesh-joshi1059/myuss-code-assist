import { Test, TestingModule } from '@nestjs/testing';
import { FirestoreService } from './firestore.service';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../../core/logger/logger.service';

describe('FirestoreService', () => {
  let service: FirestoreService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FirestoreService, ConfigService,LoggerService],
    }).compile();

    service = module.get<FirestoreService>(FirestoreService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

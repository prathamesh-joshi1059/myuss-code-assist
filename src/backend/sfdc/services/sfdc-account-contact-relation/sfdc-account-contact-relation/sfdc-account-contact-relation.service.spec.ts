import { Test, TestingModule } from '@nestjs/testing';
import { SfdcAccountContactRelationService } from './sfdc-account-contact-relation.service';

describe('SfdcAccountContactRelationService', () => {
  let service: SfdcAccountContactRelationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SfdcAccountContactRelationService],
    }).compile();

    service = module.get<SfdcAccountContactRelationService>(SfdcAccountContactRelationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

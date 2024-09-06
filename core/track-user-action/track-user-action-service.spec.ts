import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TrackUserActionService } from './track-user-action-service';

describe('TrackUserActionService', () => {
  let service: TrackUserActionService;

  let mockConfigService = { 
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TrackUserActionService, { provide: ConfigService, useValue: mockConfigService }],
    }).compile();

    service = module.get<TrackUserActionService>(TrackUserActionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

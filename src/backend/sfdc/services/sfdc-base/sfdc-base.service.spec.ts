import { Test, TestingModule } from '@nestjs/testing';
import { SfdcBaseService } from './sfdc-base.service';
import { ConfigService } from '@nestjs/config';
import {Connection} from 'jsforce';
import { LoggerService } from '../../../../core/logger/logger.service';

describe('SfdcBaseService', () => {
  let service: SfdcBaseService;

  // Mock Config Service

  let mockConfigService = {
    get: jest.fn(),
  };
 

  beforeEach(async () => {
  
    const module: TestingModule = await Test.createTestingModule({
    
      providers: [
        SfdcBaseService,
        LoggerService,
        { provide: ConfigService, useValue: mockConfigService },
       
      ],
    }).compile();

    service = module.get<SfdcBaseService>(SfdcBaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

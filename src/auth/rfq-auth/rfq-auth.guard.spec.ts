import {Test, TestingModule} from '@nestjs/testing';
import { RFQAuthGuard } from './rfq-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('RFQAuthGuard', () => {
  let jwtService: JwtService;
  let rfqAuthGuard: RFQAuthGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RFQAuthGuard, JwtService, ConfigService]
    }).compile();

    jwtService = module.get<JwtService>(JwtService);
    rfqAuthGuard = module.get<RFQAuthGuard>(RFQAuthGuard);
  });
  it('should be defined', () => {
    expect(rfqAuthGuard).toBeDefined();
  });
});

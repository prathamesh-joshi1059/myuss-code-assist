import { Test, TestingModule } from '@nestjs/testing';
import { GoogleMapsService } from './google-maps.service';
import { CoreModule } from '../../../core/core.module';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../../core/logger/logger.service';
jest.mock('../../../core/logger/logger.service');
import { CacheService } from '../../../core/cache/cache.service';
jest.mock('../../../core/cache/cache.service');

describe('GeocodingService', () => {
  let service: GoogleMapsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoggerService,
        CacheService,
        GoogleMapsService,
        { provide: ConfigService, useValue: { get: jest.fn((reutrn) => 'AIzaSyBGrlr5WM3-W9XhRENythtloV6_2kq7_Tc') } },
      ],
    }).compile();

    service = module.get<GoogleMapsService>(GoogleMapsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should be MA', async () => {
    const state = await service.getStateCodeByZip('02446');
    expect(state).toBe('MA');
  });

  it('should be Massachusetts', async () => {
    const state = await service.getStateNameByZip('02446');
    expect(state).toBe('Massachusetts');
  });

  it('should be null', async () => {
    const state = await service.getStateNameByZip('99999');
    expect(state).toBeUndefined();
  });

  it('non-US ZIP code should be null', async () => {
    const state = await service.getStateNameByZip('07210');
    expect(state).toBeUndefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { PlytixService } from './plytix.service';
import { FirestoreService } from '../../backend/google/firestore/firestore.service';
import { ConfigService } from '@nestjs/config';
import { PlytixWebhookCallReqDTO } from '../models/plytix-webhook-call-req.dto';
import { Storage } from '@google-cloud/storage';
import { PubSub } from '@google-cloud/pubsub';
import axios from 'axios';

jest.mock('@google-cloud/storage');
jest.mock('@google-cloud/pubsub');

describe('PlytixService', () => {
  let service: PlytixService;
  let firestoreService: FirestoreService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlytixService,
        {
          provide: FirestoreService,
          useValue: {
            upsertDocument: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key) => {
              const config = {
                GCS_BUCKET: 'test-bucket',
                FIRESTORE_COLLECTION: 'test-collection',
                WHITELIST_FEED_URL: 'example.com',
                PUB_SUB_SUBSCRIPTION: 'test-subscription',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<PlytixService>(PlytixService);
    firestoreService = module.get<FirestoreService>(FirestoreService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('plytixWebhookCall', () => {
    it('should handle rate-limited requests', async () => {
      const dto: PlytixWebhookCallReqDTO = {
        processed_products: 10,
        feed_url: 'https://example.com/feed.csv',
        channel_processing_status: 'success',
      };

      jest.spyOn(Object.getPrototypeOf(service), 'isDomainWhitelisted').mockReturnValue(true);
      jest.spyOn(Object.getPrototypeOf(service), 'isRateLimited').mockReturnValue(true);

      const result = await service.plytixWebhookCall(dto);

      expect(result).toBeUndefined();
    });
    it('should handle invalid domain', async () => {
      const dto: PlytixWebhookCallReqDTO = {
        processed_products: 10,
        feed_url: 'https://invalid-domain.com/feed.csv',
        channel_processing_status: 'success',
      };

      jest.spyOn(Object.getPrototypeOf(service), 'isDomainWhitelisted').mockReturnValue(false);

      const result = await service.plytixWebhookCall(dto);

      expect(result).toBeUndefined();
    });
    it('should handle unsuccessful channel processing status', async () => {
      const dto: PlytixWebhookCallReqDTO = {
        processed_products: 10,
        feed_url: 'https://example.com/feed.csv',
        channel_processing_status: 'failed',
      };

      jest.spyOn(Object.getPrototypeOf(service), 'isDomainWhitelisted').mockReturnValue(true);
      jest.spyOn(Object.getPrototypeOf(service), 'isRateLimited').mockReturnValue(false);

      const result = await service.plytixWebhookCall(dto);

      expect(result).toBeUndefined();
    });
    it('should handle zero processed products', async () => {
      const dto: PlytixWebhookCallReqDTO = {
        processed_products: 0,
        feed_url: 'https://example.com/feed.csv',
        channel_processing_status: 'success',
      };

      jest.spyOn(Object.getPrototypeOf(service), 'isDomainWhitelisted').mockReturnValue(true);
      jest.spyOn(Object.getPrototypeOf(service), 'isRateLimited').mockReturnValue(false);

      const result = await service.plytixWebhookCall(dto);

      expect(result).toBeUndefined();
    });
    it('should handle failed data validation', async () => {
      const dto: PlytixWebhookCallReqDTO = {
        processed_products: 10,
        feed_url: 'https://example.com/feed.csv',
        channel_processing_status: 'success',
      };

      jest.spyOn(Object.getPrototypeOf(service), 'isDomainWhitelisted').mockReturnValue(true);
      jest.spyOn(Object.getPrototypeOf(service), 'isRateLimited').mockReturnValue(false);
      jest.spyOn(axios, 'get').mockResolvedValue({ data: 'mock,csv,data' });
      jest.spyOn(service, 'validateFeedData').mockResolvedValue(false);

      const result = await service.plytixWebhookCall(dto);

      expect(result).toBeUndefined();
    });
    it('should handle network errors when fetching CSV data', async () => {
      const dto: PlytixWebhookCallReqDTO = {
        processed_products: 10,
        feed_url: 'https://example.com/feed.csv',
        channel_processing_status: 'success',
      };

      jest.spyOn(Object.getPrototypeOf(service), 'isDomainWhitelisted').mockReturnValue(true);
      jest.spyOn(Object.getPrototypeOf(service), 'isRateLimited').mockReturnValue(false);
      jest.spyOn(axios, 'get').mockRejectedValue(new Error('Network error'));

      await expect(service.plytixWebhookCall(dto)).rejects.toThrow('Network error');
    });
  });

  describe('isDomainWhitelisted', () => {
    it('should return true for whitelisted domain', () => {
      const whitelistedDomain = 'example.com';
      const result = service['isDomainWhitelisted'](whitelistedDomain);
      expect(result).toBe(true);
    });
  });

  describe('isRateLimited', () => {
    it('should return false for first request', () => {
      const feedUrl = 'https://example.com/feed.csv';
      const result = service['isRateLimited'](feedUrl);
      expect(result).toBe(false);
    });

    it('should return false for requests under the limit', () => {
      const feedUrl = 'https://example.com/feed.csv';
      for (let i = 0; i < 4; i++) {
        expect(service['isRateLimited'](feedUrl)).toBe(false);
      }
    });
  });
});

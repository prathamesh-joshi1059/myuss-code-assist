// app.e2e-spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ConfigService } from '@nestjs/config';

describe('Rate Limiting', () => {
  let app;
  // Mock Config Service
  let mockConfigService = {
    get: jest.fn((key: string) => {
      const configMap = {
        AVALARA_USERNAME: 'test',
        AVALARA_PASSWORD: 'test',
        ENVIRONMENT: 'test',
      };
      if (configMap[key]) {
        return configMap[key];
      }
      return null;
    }),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [
        { provide: 'AXIOS_INSTANCE_TOKEN', useValue: {} },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('should enforce rate limiting', async () => {
    // Perform 500 requests within 60 seconds
    for (let i = 0; i < 500; i++) {
      await request(app.getHttpServer()).get('/').expect(200).expect('Welcome to MyUSS!');
    }

    // The 500st request should be rate-limited (429 Too Many Requests)
    await request(app.getHttpServer()).get('/').expect(429);
  });

  afterEach(async () => {
    await app.close();
  });
});

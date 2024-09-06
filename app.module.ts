import { Module, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { LoggerMiddleware } from './common/logger.middleware';
import { CacheModule } from '@nestjs/cache-manager';
import { MyUSSModule } from './myuss/myuss.module';
import type { RedisClientOptions } from 'redis';
import { redisStore } from 'cache-manager-redis-yet';
import { ConfigModule } from '@nestjs/config';
import { StripeService } from './backend/stripe/services/stripe/stripe.service';
import { StripeModule } from './backend/stripe/stripe.module';
import { USSWebModule } from './uss-web/uss-web.module';
import { SidetradeModule } from './sidetrade/sidetrade.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { SfdcModule } from './sfdc/sfdc.module';
import { PlytixModule } from './plytix/plytix.module';

@Module({
  imports: [
    AuthModule,
    MyUSSModule,
    StripeModule,
    USSWebModule,
    PlytixModule,
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 500,
      },
    ]),
    CacheModule.register<RedisClientOptions>({
      isGlobal: true,
      store: redisStore,
      socket: {
        host: process.env.REDISHOST || '127.0.0.1', //default host
        port: Number.parseInt(process.env.REDISPORT) || 6379, //default port
        connectTimeout: 10000,
      },
    }),
    SidetradeModule,
    SfdcModule,
  ],

  controllers: [AppController],
  providers: [
    AppService,
    StripeService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes();
  }
}

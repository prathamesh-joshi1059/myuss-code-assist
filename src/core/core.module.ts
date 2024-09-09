import { Module } from '@nestjs/common';
import { LoggerService } from './logger/logger.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { CacheService } from './cache/cache.service';
import { TrackUserActionService } from './track-user-action/track-user-action-service';
import { SfdcPortalActionService } from '../backend/sfdc/services/sfdc-portal-action/sfdc-portal-action.service';
import { SfdcBaseService } from '../backend/sfdc/services/sfdc-base/sfdc-base.service';
import {ThrottlerExceptionFilter} from './utils/rate-limiting-exception/throttler-exception-filter';

@Module({
  imports: [
    HttpModule
  ],
  providers: [
    LoggerService,
    ConfigService,
    CacheService,
    TrackUserActionService,
    SfdcPortalActionService,
    SfdcBaseService,
    ThrottlerExceptionFilter
  ],
  exports: [
    LoggerService,
    HttpModule,
    ConfigService,
    CacheService,
    TrackUserActionService,
    SfdcPortalActionService,
    SfdcBaseService,
    ThrottlerExceptionFilter
    ],
})
export class CoreModule {}

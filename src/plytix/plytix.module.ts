import { Module } from '@nestjs/common';
import { PlytixController } from './controllers/plytix.controller';
import { PlytixService } from './services/plytix.service';
import { CoreModule } from '../core/core.module';
import { GoogleModule } from '../backend/google/google.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [CoreModule, GoogleModule, ConfigModule],
  controllers: [PlytixController],
  providers: [PlytixService],
})
export class PlytixModule {}
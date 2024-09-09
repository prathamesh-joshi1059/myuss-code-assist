import { Module } from '@nestjs/common';
import { UserController } from './controllers/user/user.controller';
import { Auth0Module } from '../backend/auth0/auth0.module';
import { CoreModule } from '../core/core.module';

@Module({
  imports: [Auth0Module, CoreModule],
  controllers: [UserController],
  providers: [],
})
export class SfdcModule {}
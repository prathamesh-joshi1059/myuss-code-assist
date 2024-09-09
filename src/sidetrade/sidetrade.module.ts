import { Module } from '@nestjs/common';
import { UserController } from './controllers/user/user.controller';
import { UserService } from './services/user/user.service';
import { CoreModule } from '../core/core.module';
import { Auth0Module } from '../backend/auth0/auth0.module';
import { GoogleModule } from '../backend/google/google.module';
import { SfdcCpqModule } from '../backend/sfdc/sfdc-cpq.module';
import { MarketingCloudModule } from '../backend/marketing-cloud/marketing-cloud.module';

@Module({
  imports: [
    CoreModule,
    Auth0Module,
    GoogleModule,
    SfdcCpqModule,
    MarketingCloudModule,
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class SidetradeModule {}
import { Module } from '@nestjs/common';
import { CoreModule } from '../../core/core.module';
import { ConfigService } from '@nestjs/config';
import { Auth0MyUSSAPIService } from './services/auth0-myuss-api/auth0-myuss-api.service';
import { HttpModule } from '@nestjs/axios';
import { Auth0ManagementAPIService } from './services/auth0-management-api/auth0-management-api.service';
import { Auth0UserService } from './services/auth0-user/auth0-user.service';

@Module({
  imports: [HttpModule, CoreModule],
  providers: [
    ConfigService,
    Auth0ManagementAPIService,
    Auth0MyUSSAPIService,
    Auth0UserService,
  ],
  exports: [
    Auth0ManagementAPIService,
    Auth0MyUSSAPIService,
    Auth0UserService,
  ],
})
export class Auth0Module {}
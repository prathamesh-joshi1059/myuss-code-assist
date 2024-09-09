import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GoogleModule } from '../backend/google/google.module';
import { MarketingCloudModule } from '../backend/marketing-cloud/marketing-cloud.module';
import { SfdcCpqModule } from '../backend/sfdc/sfdc-cpq.module';
import { StripeModule } from '../backend/stripe/stripe.module';
import { CoreModule } from '../core/core.module';
import { RFQController } from '../uss-web/controllers/rfq/rfq.controller';
import { RFQService } from '../uss-web/services/rfq/rfq.service';
import { LeadsService } from './services/leads/leads.service';
import { LeadScoringService } from './services/lead-scoring/lead-scoring.service';
import { OrderInfoController } from './controllers/order-info/order-info.controller';
import { OrderInfoService } from './services/order-info/order-info.service';
import { PaymentInfoService } from './services/payment-info/payment-info.service';
import { PaymentInfoController } from './controllers/payment-info/payment-info.controller';
import { Auth0MyUSSAPIService } from '../backend/auth0/services/auth0-myuss-api/auth0-myuss-api.service';
import { UserService } from '../myuss/services/user/user.service';
import { MyUSSModule } from '../myuss/myuss.module';
import { BranchesController } from './controllers/branches/branches.controller';
import { BranchService } from './services/branch/branch.service';
import { Auth0Module } from '../backend/auth0/auth0.module';

@Module({
  imports: [
    CoreModule,
    SfdcCpqModule,
    MarketingCloudModule,
    StripeModule,
    GoogleModule,
    AuthModule,
    Auth0Module,
    MyUSSModule,
  ],
  providers: [
    RFQService,
    LeadsService,
    LeadScoringService,
    OrderInfoService,
    PaymentInfoService,
    UserService,
    BranchService,
  ],
  controllers: [
    RFQController,
    OrderInfoController,
    PaymentInfoController,
    BranchesController,
  ],
})
export class USSWebModule {}
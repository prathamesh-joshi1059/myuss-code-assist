import { Module } from '@nestjs/common';
import { UserController } from './controllers/user/user.controller';
import { AccountsController } from './controllers/accounts/accounts.controller';
import { CoreModule } from '../core/core.module';
import { Auth0Module } from '../backend/auth0/auth0.module';
import { ZipCodeController } from './controllers/zipcode/zipcode.controller';
import { NotificationController } from './controllers/notification/notification.controller';
import { QuoteController } from './controllers/quote/quote.controller';
import { UserService } from './services/user/user.service';
import { SfdcCpqModule } from '../backend/sfdc/sfdc-cpq.module';
import { QuoteService } from './services/quote/quote.service';
import { NotificationService } from './services/notification/notification.service';
import { ZipcodeService } from './services/zipcode/zipcode.service';
import { ContractController } from './controllers/contract/contract.controller';
import { ContractService } from './services/contract/contract.service';
import { PaymentMethodsController } from './controllers/payment/payment.controller';
import { PaymentMethodsService } from './services/payment/payment-methods.service';
import { StripeModule } from '../backend/stripe/stripe.module';
import { ProductsService } from './services/products/products.service';
import { ProductsController } from './controllers/products/products.controller';
import { AvalaraModule } from '../backend/avalara/avalara.module';
import { PurchaseOrderService } from './services/purchase-order/purchase-order.service';
import { AccountsService } from './services/accounts/accounts.service';
import { GoogleModule } from '../backend/google/google.module';
import { AddressService } from './services/address/address.service';
import { AddressController } from './controllers/address/address.controller';
import { CaseService } from './services/case/case.service';
import { CaseController } from './controllers/case/case.controller';
import { Auth0Controller } from './controllers/auth0/auth0.controller';
import { ProjectController } from './controllers/project/project.controller';
import { ProjectService } from './services/project/project.service';
import { AccountsServiceV2 } from './v2/services/accounts/accounts.service';
import { AccountsControllerV2 } from './v2/controllers/accounts/accounts.controller';
import { ProductsServiceV2 } from './v2/services/product/product.service';
import { QuoteServiceV2 } from './v2/services/quote/quote.service';
import { QuoteV2Controller } from './v2/controllers/quote/quote.controller';
import { ProductsControllerV2 } from './v2/controllers/product/product.controller';

@Module({
  imports: [
    CoreModule,
    Auth0Module,
    SfdcCpqModule,
    StripeModule,
    AvalaraModule,
    GoogleModule,
  ],
  providers: [
    UserService,
    AccountsService,
    AddressService,
    QuoteService,
    NotificationService,
    ZipcodeService,
    ContractService,
    PaymentMethodsService,
    ProductsService,
    PurchaseOrderService,
    CaseService,
    ProjectService,
    AccountsServiceV2,
    ProductsServiceV2,
    QuoteServiceV2,
  ],
  controllers: [
    UserController,
    AccountsController,
    AddressController,
    ZipCodeController,
    NotificationController,
    QuoteController,
    ContractController,
    PaymentMethodsController,
    ProductsController,
    CaseController,
    Auth0Controller,
    ProjectController,
    AccountsControllerV2,
    ProductsControllerV2,
    QuoteV2Controller,
  ],
  exports: [UserService, ContractService],
})
export class MyUSSModule {}
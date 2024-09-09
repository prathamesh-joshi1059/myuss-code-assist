import { Module } from '@nestjs/common';
import { CoreModule } from '../../core/core.module';
import { CacheModule } from '@nestjs/cache-manager';

import { SfdcCpqService } from './services/cpq/sfdc-cpq.service';
import { SfdcMetadataService } from './services/sfdc-metadata/sfdc-metadata.service';
import { SfdcUssPortalUserService } from './services/sfdc-uss-portal-user/sfdc-uss-portal-user.service';
import { SfdcAccountService } from './services/sfdc-account/sfdc-account.service';
import { SfdcDocumentService } from './services/sfdc-document/sfdc-document.service';
import { SfdcExampleQuoteToOrderService } from './services/sfdc-example-quote-to-order/sfdc-example-quote-to-order.service';
import { SfdcRFQService } from './services/sfdc-rfq/sfdc-rfq.service';
import { SfdcContactService } from './services/sfdc-contact/sfdc-contact.service';
import { SfdcServiceableZipCodeService } from './services/sfdc-serviceable-zip-code/sfdc-serviceable-zip-code.service';
import { SfdcQuoteService } from './services/sfdc-quote/sfdc-quote.service';
import { SfdcContractService } from './services/sfdc-contract/sfdc-contract.service';
import { SfdcProductService } from './services/sfdc-product/sfdc-product.service';
import { SfdcCampaignService } from './services/sfdc-campaign/sfdc-campaign.service';
import { SfdcLeadService } from './services/sfdc-lead/sfdc-lead.service';
import { PaymentMethodsService } from '../../myuss/services/payment/payment-methods.service';
import { StripeService } from '../stripe/services/stripe/stripe.service';
import { SfdcServiceTerritoryService } from './services/sfdc-service-territory/sfdc-service-territory.service';
import { SfdcPurchaseOrderService } from './services/sfdc-purchase-order/sfdc-purchase-order.service';
import { CPQPriceRulesEngineService } from './services/cpq/cpq-price-rules-engine/cpq-price-rules-engine.service';
import { SfdcAddressService } from './services/sfdc-address/sfdc-address.service';
import { SfdcCaseService } from './services/sfdc-case/sfdc-case.service';
import { SfdcProjectService } from './services/sfdc-project/sfdc-project.service';
import { SfdcAccountContactRelationService } from './services/sfdc-account-contact-relation/sfdc-account-contact-relation.service';

@Module({
  imports: [CoreModule, CacheModule.register()],
  providers: [
    SfdcCpqService,
    SfdcMetadataService,
    SfdcUssPortalUserService,
    SfdcAccountService,
    SfdcAddressService,
    SfdcDocumentService,
    SfdcExampleQuoteToOrderService,
    SfdcRFQService,
    SfdcContactService,
    SfdcServiceableZipCodeService,
    SfdcQuoteService,
    SfdcContractService,
    SfdcProductService,
    SfdcLeadService,
    SfdcCampaignService,
    SfdcServiceTerritoryService,
    PaymentMethodsService,
    StripeService,
    SfdcPurchaseOrderService,
    CPQPriceRulesEngineService,
    SfdcCaseService,
    SfdcProjectService,
    SfdcAccountContactRelationService,
  ],
  exports: [
    SfdcCpqService,
    SfdcMetadataService,
    SfdcUssPortalUserService,
    SfdcAccountService,
    SfdcAddressService,
    SfdcDocumentService,
    SfdcExampleQuoteToOrderService,
    SfdcRFQService,
    SfdcContactService,
    SfdcServiceableZipCodeService,
    SfdcQuoteService,
    SfdcContractService,
    SfdcProductService,
    SfdcLeadService,
    SfdcCampaignService,
    SfdcServiceTerritoryService,
    SfdcPurchaseOrderService,
    SfdcCaseService,
    SfdcProjectService,
    SfdcAccountContactRelationService,
  ],
  controllers: [],
})
export class SfdcCpqModule {}
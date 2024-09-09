import { Module } from '@nestjs/common';
import { CoreModule } from '../../core/core.module';
import { SfmcRequestForQuoteService } from './services/sfmc-request-for-quote/sfmc-request-for-quote.service';
import { SfmcBaseService } from './services/sfmc-base/sfmc-base.service';
import { SFMC_SidetradeUserMigrationService } from './services/sfmc-sidetrade-user-migration/sfmc-sidetrade-user-migration.service';

@Module({
  imports: [CoreModule],
  providers: [
    SfmcRequestForQuoteService,
    SfmcBaseService,
    SFMC_SidetradeUserMigrationService,
  ],
  exports: [
    SfmcRequestForQuoteService,
    SFMC_SidetradeUserMigrationService,
  ],
})
export class MarketingCloudModule {}
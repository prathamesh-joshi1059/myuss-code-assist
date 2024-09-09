import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../../../core/logger/logger.service';
import { SfmcBaseService } from '../sfmc-base/sfmc-base.service';
import { RFQJourneyEntryDTO } from '../../models/rfq-journey-entry.dto';

@Injectable()
export class SfmcRequestForQuoteService {
  private sfmcRFQEventDefinitionKey: string;

  constructor(
    private logger: LoggerService,
    private configService: ConfigService,
    private sfmcBaseService: SfmcBaseService,
  ) {
    this.sfmcRFQEventDefinitionKey = this.configService.get<string>('SFMC_RFQ_EVENT_DEFINITION_KEY');
  }

  async postRFQtToSFMC(rfq: RFQJourneyEntryDTO) {
    return await this.sfmcBaseService.postEntryEvent(rfq.Email, this.sfmcRFQEventDefinitionKey, rfq);
  }
}

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../../../core/logger/logger.service';
import { SfmcBaseService } from '../sfmc-base/sfmc-base.service';
import { RFQJourneyEntryDTO } from '../../models/rfq-journey-entry.dto';

@Injectable()
export class SfmcRequestForQuoteService {
  private readonly sfmcRFQEventDefinitionKey: string;

  constructor(
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
    private readonly sfmcBaseService: SfmcBaseService,
  ) {
    this.sfmcRFQEventDefinitionKey = this.configService.get<string>('SFMC_RFQ_EVENT_DEFINITION_KEY');
  }

  async postRFQtToSFMC(rfq: RFQJourneyEntryDTO): Promise<void> {
    await this.sfmcBaseService.postEntryEvent(rfq.Email, this.sfmcRFQEventDefinitionKey, rfq);
  }
}
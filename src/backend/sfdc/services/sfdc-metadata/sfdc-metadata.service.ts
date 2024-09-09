import { Injectable } from '@nestjs/common';
import { SfdcBaseService } from '../sfdc-base/sfdc-base.service';
import { LoggerService } from '../../../../core/logger/logger.service';

@Injectable()
export class SfdcMetadataService {
  constructor(private sfdcBaseService: SfdcBaseService, private logger: LoggerService) {}

  public async getMetadata(sObjects: string[]): Promise<void> {
    try {
      const metadata = await this.sfdcBaseService.getMetadata(sObjects);
      for (const meta of metadata) {
        this.logger.info('Full Name: ' + meta.fullName);
        this.logger.info('Fields count: ' + meta.fields.length);
        this.logger.info('Sharing Model: ' + meta.sharingModel);
      }
    } catch (err) {
      this.logger.error(err);
    }
  }
}
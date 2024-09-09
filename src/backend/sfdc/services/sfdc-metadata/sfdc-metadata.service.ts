import { Injectable } from '@nestjs/common';
import { SfdcBaseService } from '../sfdc-base/sfdc-base.service';
import { LoggerService } from '../../../../core/logger/logger.service';

@Injectable()
export class SfdcMetadataService {
  constructor(private sfdcBaseService: SfdcBaseService, private logger: LoggerService) {}

  public async getMetadata(sObjects: string[]): Promise<any> {
    return await this.sfdcBaseService
      .getMetadata(sObjects)
      .then((metadata) => {
        for (let i = 0; i < metadata.length; i++) {
          const meta = metadata[i];
          this.logger.info('Full Name: ' + meta.fullName);
          this.logger.info('Fields count: ' + meta.fields.length);
          this.logger.info('Sharing Model: ' + meta.sharingModel);
        }
      })
      .catch((err) => {
        this.logger.error(err);
      });
  }
}

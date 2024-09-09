import { Injectable } from '@nestjs/common';
import { SfdcBaseService } from '../sfdc-base/sfdc-base.service';
import { LoggerService } from '../../../../core/logger/logger.service';

@Injectable()
export class SfdcDocumentService {
  constructor(
    private sfdcBaseService: SfdcBaseService,
    private logger: LoggerService,
  ) {}

  async getDocument(id: string): Promise<any> {
    const doc = await this.sfdcBaseService.getSObjectById('Document', id);
    this.logger.info(doc);
    return doc;
  }

  async getDocumentBody(documentId: string): Promise<Blob> {
    const blob = await this.sfdcBaseService.getDocumentBody(documentId);
    return blob;
  }
}
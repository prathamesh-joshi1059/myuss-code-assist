import { SBQQ__QuoteDocument__c } from '../../../backend/sfdc/model/SBQQ__QuoteDocument__c';
import { QuoteDocument } from '../../../myuss/models/quote.model';

export class SFDC__QuoteDocumentMapper {
  static getMyUSSQuoteDocumentFromSFDCQuoteDocument(sfdcQuoteDocument: SBQQ__QuoteDocument__c) {
    const quoteDocument = new QuoteDocument();
    quoteDocument.documentId = sfdcQuoteDocument.SBQQ__DocumentId__c;
    quoteDocument.documentName = sfdcQuoteDocument.Name;
    quoteDocument.version = sfdcQuoteDocument.SBQQ__Version__c;
    return quoteDocument;
  }
}

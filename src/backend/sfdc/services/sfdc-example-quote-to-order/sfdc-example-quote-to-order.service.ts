import { Injectable } from '@nestjs/common';
import { Connection } from 'jsforce';
import { LoggerService } from '../../../../core/logger/logger.service';
import { SfdcBaseService } from '../sfdc-base/sfdc-base.service';
import { CreateQuoteDataSample } from './data/create-quote-data';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SfdcExampleQuoteToOrderService {

  private data: CreateQuoteDataSample = new CreateQuoteDataSample();

  constructor(
    private configService: ConfigService,
    private logger: LoggerService,
    private salesforceBaseService: SfdcBaseService,
  ) {}

  async createExampleQuoteToOrder(): Promise<any> {
    console.log('Creating example quote to order...');
    const compositeQuoteLineEndpoint =
      '/services/data/v58.0/composite/tree/SBQQ__QuoteLine__c';
    console.log(`starting at: ${new Date()}`);
    let oppId;
    let poId;
    let addressId;
    const opp = this.salesforceBaseService.conn.create(
      'Opportunity',
      this.data.opportunity,
      function (err, ret) {
        if (err || !ret.success) {
          return console.error(err, ret);
        }
        oppId = ret.id;
        console.log(`oppId: ${oppId}`);
      },
    );
    const po = this.salesforceBaseService.conn.create(
      'Purchase_Order__c',
      this.data.purchaseOrder,
      function (err, ret) {
        if (err || !ret.success) {
          return console.error(err, ret);
        }
        poId = ret.id;
        console.log(`poId: ${poId}`);
      },
    );
    const address = this.salesforceBaseService.conn.create(
      'USF_Address__c',
      this.data.address,
      function (err, ret) {
        if (err || !ret.success) {
          return console.error(err, ret);
        }
        addressId = ret.id;
        console.log(`addressId: ${addressId}`);
      },
    );
    await Promise.all([opp, po, address]);
    console.log(`opp created at ${new Date()}:`, oppId);
    console.log(`po created at ${new Date()}: ${poId}`);
    console.log(`address created at ${new Date()}: ${addressId}`);
    // set quote fields
    this.data.quote.SBQQ__Opportunity2__c = oppId;
    this.data.quote.Purchase_Order__c = poId;
    this.data.quote.Shipping_Address__c = addressId;
    // create quote
    const q = await this.salesforceBaseService.conn.create('SBQQ__Quote__c', this.data.quote);
    const quoteId = q.id;
    console.log(`quote created at ${new Date()}: ${q}`);
    const compositeQuoteLineRequest = this.createCompositeRequest(quoteId);
    console.log(`compositeQuoteLineRequest: ${compositeQuoteLineRequest}`);
    const compositeQuoteLineResponse = await this.salesforceBaseService.conn.requestPost(
      compositeQuoteLineEndpoint,
      compositeQuoteLineRequest,
    );
    console.log(
      `quote lines created at ${new Date()}`,
      compositeQuoteLineResponse,
    );
    // read the quote
    console.log('Reading quote and lines');
    const quoteFromSFDC = await this.salesforceBaseService.conn.apex.get(
      '/SBQQ/ServiceRouter?reader=SBQQ.QuoteAPI.QuoteReader&uid=' + quoteId,
    );
    let quoteObj = JSON.parse(quoteFromSFDC);
    // cacluate the quote with the added product
    console.log(`Calculating quote`);
    const calculatedQuote = await this.salesforceBaseService.conn.apex.patch(
      '/SBQQ/ServiceRouter?loader=SBQQ.QuoteAPI.QuoteCalculator',
      {
        context: JSON.stringify({
          quote: quoteObj,
        }),
      },
    );
    console.log(`calculatedQuote at ${new Date()}: ${calculatedQuote}`);
    // calculate tax for the quote
    console.log(`starting tax calc at ${new Date()}`);
    this.salesforceBaseService.updateSObject('SBQQ__Quote__c', {
      Id: quoteId,
      AVA_SFCPQ__Quote_AutomateTaxCalculation__c: true,
    });
    // wait for 2 seconds for the async tax calculation
    await this.timeout(2000);
    let taxStatusResults = await this.salesforceBaseService.conn.query(
      `SELECT AVA_SFCPQ__AvaTaxMessage__c FROM SBQQ__Quote__c WHERE Id = '${quoteId}'`,
    );
    let taxStatus = taxStatusResults.records[0].AVA_SFCPQ__AvaTaxMessage__c;
    while (
      !taxStatus ||
      taxStatus ===
        'Automated Tax Calculation Triggered, Please Refresh Your Browser'
    ) {
      // wait for 2 seconds for the async tax calculation
      console.log('tax not yet updated, trying again in 2 seconds');
      await this.timeout(2000);
      taxStatusResults = await this.salesforceBaseService.conn.query(
        `SELECT AVA_SFCPQ__AvaTaxMessage__c FROM SBQQ__Quote__c WHERE Id = '${quoteId}'`,
      );
      taxStatus = taxStatusResults.records[0].AVA_SFCPQ__AvaTaxMessage__c;
    }
    console.log(`tax updated, moving on at ${new Date()}`);
    // create the quote proposal
    console.log('Creating quote proposal');
    
    const proposal = await this.salesforceBaseService.conn.apex.post('/generateQuoteDocument', {
      quoteId: quoteId,
    });
    // wait 5 seconds for the quote to generate
    await this.timeout(5000);
    let proposalStatusResults = await this.salesforceBaseService.conn.query(
      `SELECT Status FROM AsyncApexJob WHERE Id = '${proposal.asyncJobId}'`,
    );
    let proposalStatus = proposalStatusResults.records[0].Status;
    while (proposalStatus !== 'Completed') {
      // wait for 2 seconds for the proposal to generate
      console.log('proposal not yet created, trying again in 2 seconds');
      await this.timeout(2000);
      proposalStatusResults = await this.salesforceBaseService.conn.query(
        `SELECT Status FROM AsyncApexJob WHERE Id = '${proposal.asyncJobId}'`,
      );
      proposalStatus = proposalStatusResults.records[0].Status;
    }
    console.log(
      `Quote proposal finished processing at ${new Date()}: ${JSON.stringify(
        proposal,
      )}`,
    );
    // TODO: get the status of the Async job until it's done

    console.log(`Updating status to Approved at ${new Date()}`);
    await this.salesforceBaseService.updateSObject('SBQQ__Quote__c', {
      Id: quoteId,
      SBQQ__Status__c: 'Approved',
      PreOrder_Flow_Complete__c: true,
      Billing_Complete__c: true,
    }); 
    // SBQQ__Ordered__c to true
    console.log(`Setting Ordered to true at ${new Date()}`);
    await this.salesforceBaseService.updateSObject('SBQQ__Quote__c', {
      Id: quoteId,
      SBQQ__Ordered__c: true,
    });
    await this.timeout(5000);
    // then set status to Ordered
    console.log(`Setting status to Ordered at ${new Date()}`);
    await this.salesforceBaseService.updateSObject('SBQQ__Quote__c', {
      Id: quoteId,
      SBQQ__Status__c: 'Ordered',
    });
    // then set status of FSL Order to Activated
    let fslOrderId = null;
    while (!fslOrderId) {
      const fslOrders = await this.salesforceBaseService.conn.query(
        `SELECT Id FROM Order WHERE SBQQ__Quote__c = '${quoteId}'`,
      );
      if (fslOrders && fslOrders.records.length > 0) {
        const fslOrder = fslOrders.records[0];
        fslOrderId = fslOrder.Id;
      } else {
        await this.timeout(2000);
      }
    }

    await this.salesforceBaseService.updateSObject('Order', { Id: fslOrderId, Status: 'Activated' });
    return {success: true, quoteId: quoteId};
  }

  private createCompositeRequest(quoteId): any {
    // add quote id to quote lines
    //Bundle
    this.data.quoteLineBundle.SBQQ__Quote__c = quoteId;
    this.data.quoteLineBundle.USF_Address__c =
      this.data.quote.Shipping_Address__c;
    // Asset
    this.data.quoteLineAsset.SBQQ__Quote__c = quoteId;
    this.data.quoteLineAsset.USF_Address__c =
      this.data.quote.Shipping_Address__c;
    // Service
    this.data.quoteLineService.SBQQ__Quote__c = quoteId;
    this.data.quoteLineService.USF_Address__c =
      this.data.quote.Shipping_Address__c;
    // Hand Sanitizer
    this.data.quoteLineHandSani.SBQQ__Quote__c = quoteId;
    this.data.quoteLineHandSani.USF_Address__c =
      this.data.quote.Shipping_Address__c;
    // Delivery
    this.data.quoteLineDelivery.SBQQ__Quote__c = quoteId;
    this.data.quoteLineDelivery.USF_Address__c =
      this.data.quote.Shipping_Address__c;
    // Pickup
    this.data.quoteLinePickup.SBQQ__Quote__c = quoteId;
    this.data.quoteLinePickup.USF_Address__c =
      this.data.quote.Shipping_Address__c;
    // Delivery Cart
    this.data.quoteLineDeliveryCart.SBQQ__Quote__c = quoteId;
    this.data.quoteLineDeliveryCart.USF_Address__c =
      this.data.quote.Shipping_Address__c;
    // Pickup Cart
    this.data.quoteLinePickupCart.SBQQ__Quote__c = quoteId;
    this.data.quoteLinePickupCart.USF_Address__c =
      this.data.quote.Shipping_Address__c;
    // Quoted Jobsite
    this.data.quotedJobsite.NF_Quote__c = quoteId;
    this.data.quotedJobsite.NF_USF_Address__c =
      this.data.quote.Shipping_Address__c;
    // create the composite request
    let compositeQuoteLineRequest = {
      records: [
        {
          attributes: { type: 'SBQQ__QuoteLine__c', referenceId: 'bundle1' },
          ...this.data.quoteLineBundle,
          SBQQ__Quote_Lines__r: {
            records: [
              {
                attributes: {
                  type: 'SBQQ__QuoteLine__c',
                  referenceId: 'asset1',
                },
                ...this.data.quoteLineAsset,
              },
              {
                attributes: {
                  type: 'SBQQ__QuoteLine__c',
                  referenceId: 'service1',
                },
                ...this.data.quoteLineService,
              },
              {
                attributes: {
                  type: 'SBQQ__QuoteLine__c',
                  referenceId: 'handSani1',
                },
                ...this.data.quoteLineHandSani,
              },
              {
                attributes: {
                  type: 'SBQQ__QuoteLine__c',
                  referenceId: 'delivery1',
                },
                ...this.data.quoteLineDelivery,
              },
              {
                attributes: {
                  type: 'SBQQ__QuoteLine__c',
                  referenceId: 'pickup1',
                },
                ...this.data.quoteLinePickup,
              },
            ],
          },
          Quoted_Jobsites__r: {
            records: [
              {
                attributes: {
                  type: 'NF_Quoted_Jobsite__c',
                  referenceId: 'quotedJobsite1',
                },
                ...this.data.quotedJobsite,
              },
            ],
          },
        },
        {
          attributes: {
            type: 'SBQQ__QuoteLine__c',
            referenceId: 'deliveryCart1',
          },
          ...this.data.quoteLineDeliveryCart,
        },
        {
          attributes: {
            type: 'SBQQ__QuoteLine__c',
            referenceId: 'pickupCart1',
          },
          ...this.data.quoteLinePickupCart,
        },
      ],
    };
    return compositeQuoteLineRequest;
  }

  private timeout(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

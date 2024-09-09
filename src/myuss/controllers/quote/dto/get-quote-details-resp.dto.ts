import { IsNumber, IsString } from 'class-validator';
import { BillingAddress, SiteDetails } from '../../../models/address.model';
import { BundleDetails, QuoteModel } from '../../../models';
export class GetQuoteDetailsRespDTO {
  @IsString()
  quoteId: string;
  @IsString()
  quoteName: string;
  @IsNumber()
  bundleQty: number;
  @IsNumber()
  currentStatus: number;
  @IsString()
  startDate: string;
  @IsString()
  endDate: string;
  lineItems: BundleDetails[];
  documentId: string;
  documentName: string;
  siteAddress: SiteDetails;
  siteContact: {};
  billingAddress: BillingAddress;
  billingContact: {};
  emailToCC: string[];
  poNumber: string;
  duration?: string;
  isAutoPay?: boolean;
  paymentMethodId?: string;
  quoteModel?: QuoteModel;
  estimatedEndDate?: string;
  createdDate?:string;
  expiryDate?:string;
}
export class ProductDTO {
  bundleId: string;
  type: string;
  name: string;
  service: ServiceDetails[];
  asset: AssetDetails[];
  ancillaryService: AncillaryServiceDetails[];
  pAndD: PAndDServiceDetails[];
}
export class ServiceDetails {
  id: string;
  serviceName: string;
  serviceProductCode: string;
  serviceOptionalId: string;
  serviceTaxCode: string;
  numberOfServices?: number;
}
export class AssetDetails {
  id: string;
  assetName: string;
  assetProductCode: string;
  assetOptionalId: string;
  assetTaxCode: string;
}
export class AncillaryServiceDetails {
  id: string;
  ancillaryServiceName: string;
  ancillaryServiceProductCode: string;
  ancillaryServiceOptionalId: string;
}
export class PAndDServiceDetails {
  id: string;
  pAndDServiceName: string;
  pAndDServiceProductCode: string;
  pAndDServiceOptionalId: string;
}

export class MockResponseJSON {
  'success': true;
  'message': 'Success';
  'status': 1000;
  'data': {
    quoteId: 'a6O8I000000HDw3UAG';
    quoteName: 'Q-514151';
    currentStatus: 6;
    startDate: '2023-11-27';
    endDate: '2023-11-28';
    lineItems: [
      {
        bundleId: '01t3m00000PPH5MAAX';
        type: 'Bundle';
        name: 'Restroom Bundle';
        service: [
          {
            id: '01t3m00000NTivwAAD';
            serviceName: '1 Svc 1 Day Wk';
            serviceProductCode: '112-2001';
            servideOptionalId: 'a6D8I0000008aRVUAY';
            quantity: 1;
          },
        ];
        asset: [
          {
            id: '01t3m00000NTiw6AAD';
            assetName: 'Std Rest';
            assetProductCode: '111-1001';
            assetOptionalId: 'a6D8I0000008aKcUAI';
            quantity: 1;
          },
        ];
        ancillaryService: [
          {
            id: '01t6O000006aeezQAA';
            ancillaryServiceName: 'Toilet Seat Cover Refill';
            ancillaryServiceProductCode: '112-2209';
            ancillaryServiceOptionalId: 'a6D8I0000008aSfUAI';
            quantity: 1;
          },
        ];
        pAndD: [
          {
            id: '01t3m00000POgxNAAT';
            pAndDServiceName: 'Pick Rest per Unit';
            pAndDServiceNameProductCode: '113-3010';
            quantity: 1;
          },
          {
            id: '01t3m00000POgxIAAT';
            pAndDServiceName: 'Del Rest per Unit';
            pAndDServiceNameProductCode: '113-3009';
            quantity: 1;
          },
        ];
      },
    ];
    documentId: '0158I000000lU6LQAU';
    siteAddress: {
      addressId: 'a8x8I000000CpqUQAS';
      name: '135 Pleasant Street, Broo - Brookline - MA';
      country: 'US';
      city: 'Brookline';
      zipcode: '02446';
      state: 'MA';
      siteStartTime: '01:30:00.125Z';
      siteEndTime: '13:30:00.125Z';
      gateCode: 'Gate 1';
      instructions: 'Near Security cabin';
      information: null;
      latitude: 42.34715;
      longitude: -71.11782;
      clearanceRequired: true;
      idRequired: true;
    };
    siteContact: {
      contactId: '0038I00000fqNgwQAE';
      firstName: 'Maria2';
      lastName: 'Jackson2';
      phone: '9202232000';
      email: 'gaurav.narvekar+86@zingworks.in';
    };
    billingAddress: {
      address: 'San Diego, CA 92116, USA - San Diego - CA';
      city: 'San Diego';
      state: 'CA';
      zipcode: '92116';
    };
    billingContact: {
      contactId: '0038I00000fqEukQAE';
      firstName: 'Maria';
      lastName: 'Jackson';
      phone: '9202232000';
      email: 'gaurav.narvekar+86@zingworks.in';
    };
    emailToCC: ['test1@gmail.com', null, null, null, null, null];
    poNumber: 'PO-1234';
  };
}

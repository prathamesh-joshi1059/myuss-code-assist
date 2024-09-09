export class TaxCalculationRequest {
  public type: string;
  public description: string;
  public code: string;
  public referenceCode: string;
  public commit: boolean;
  public currencyCode: string;
  public date: string;
  public companyCode: string;
  public isSellerImporterOfRecord: boolean;
  public customerUsageType: string;
  public businessIdentificationNo: string;
  public exemptionNo: string;
  public customerCode: string;
  public addresses: {
    shipFrom: TaxCalculationAddress;
  }
  public lines: TaxCalculationLine[];

  constructor() {
    // SalesOrder will not be stored in the Avalara database
    this.type = 'SalesOrder';
    this.commit = true;
    this.currencyCode = 'USD';
    this.description = 'Tax calculation for quote from MyUSS';
  }
}

export class TaxCalculationAddress {
  public locationCode: string;
  public line1: string;
  public city: string;
  public region: string;
  public postalCode: string;
  public country: string;
}

export class TaxCalculationLine {
  public lineNumber: string;
  public ref1: string;
  public quantity: number;
  public itemCode: string;
  public amount: number;
  public taxCode: string;
  public addresses: {
    shipTo: TaxCalculationAddress;
    shipFrom: TaxCalculationAddress;
  }
}
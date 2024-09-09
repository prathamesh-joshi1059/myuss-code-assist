export class TaxCalculationResponse {
  public id: number;
  public referenceCode: string;
  public totalTax: number;
  public lines: TaxCalculationResponseLine[];
}

export class TaxCalculationResponseLine {
  public id: number;
  public lineNumber: string;
  public ref1: string;
  public tax: number;
  public taxable: boolean;
}

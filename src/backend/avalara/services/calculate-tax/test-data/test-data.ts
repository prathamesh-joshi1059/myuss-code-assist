export const test = {
  code: 'test',
  businessIdentificationNo: 'test',
  isSellerImporterOfRecord: true,
  exemptionNo: '',
  customerUsageType: 'test',
  addresses: {
    shipFrom: {
      line1: 'test',
      city: 'test',
      region: 'test',
      postalCode: 'test',
    }
  },
  customerCode: 'test',
  companyCode: 'test',
  lines: [
    {
      quantity: 1,
      itemCode: 'test',
      amount: 5,
      taxCode: 'SANIRENT',
      addresses: {
        shipFrom: {
          line1: 'test',
          city: 'test',
          region: 'test',
          postalCode: 'test',
        },
        shipTo: {
          line1: 'test',
          city: 'test',
          region: 'test',
          postalCode: 'test',
          country: 'test',
        },
      }
    }
  ]
}
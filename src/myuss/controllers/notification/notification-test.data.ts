export class NotificationSuccessResponseTestData {
  public data;

  constructor() {
    this.data = [
      {
        quoteId: '0WO8I000000gV40WAE',
        status: 'Pickup',
        date: '2049-12-31T05:01:01.000+0000',
        siteAddress: {
          attributes: {
            type: 'USF_Address__c',
            url: '/services/data/v58.0/sobjects/USF_Address__c/a8x8I000000CmyOQAS'
          },
          USF_Street__c: '118 Flanders Road',
          USF_City__c: 'Westborough',
          USF_State__c: 'MA',
          USF_Zip_Code__c: '01581',
          Address_Latitude_Longitude__c: {
            latitude: 42.27896,
            longitude: -71.57328,
          },
        },
      },
      {
        quoteId: '0WO8I000000gV41WAE',
        status: 'Delivery',
        date: '2023-09-01T04:01:01.000+0000',
        siteAddress: {
          attributes: {
            type: 'USF_Address__c',
            url: '/services/data/v58.0/sobjects/USF_Address__c/a8x8I000000CmyOQAS',
          },
          USF_Street__c: '118 Flanders Road',
          USF_City__c: 'Westborough',
          USF_State__c: 'MA',
          USF_Zip_Code__c: '01581',
          Address_Latitude_Longitude__c: {
            latitude: 42.27896,
            longitude: -71.57328,
          },
        },
      },
      {
        quoteId: '0WO8I000000gV3oWAE',
        status: 'Pickup',
        date: '2049-12-31T05:01:01.000+0000',
        siteAddress: {
          attributes: {
            type: 'USF_Address__c',
            url: '/services/data/v58.0/sobjects/USF_Address__c/a8x8I000000CmyOQAS',
          },
          USF_Street__c: '118 Flanders Road',
          USF_City__c: 'Westborough',
          USF_State__c: 'MA',
          USF_Zip_Code__c: '01581',
          Address_Latitude_Longitude__c: {
            latitude: 42.27896,
            longitude: -71.57328,
          }
        }
      },
    ];
  }
}
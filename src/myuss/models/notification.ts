import { Position } from './user.model';
import { ApiProperty } from '@nestjs/swagger';
export class siteAddress {
  @ApiProperty({
    description: 'Street',
    example: 'test street 1',
    format: 'string',
  })
  street: string;
  @ApiProperty({
    description: 'City',
    example: 'WESTBOROUGH',
    format: 'string',
  })
  city: string;
  @ApiProperty({ description: 'State', example: 'MA', format: 'string' })
  state: string;
  @ApiProperty({ description: 'Zip Code', example: '01581', format: 'string' })
  zipcode: string;
  @ApiProperty({ description: 'GeoLocation', example: '', format: 'number' })
  position: Position;
}

export class NotificationResponse {
  @ApiProperty({
    description: 'Quote No',
    example: 'O-513893',
    format: 'string',
  })
  quoteNo: string;
  @ApiProperty({
    description: 'Quote Id',
    example: '0WO8I000000gkypWAA',
    format: 'string',
  })
  quoteId: string;
  @ApiProperty({ description: 'Status', example: '200', format: 'string' })
  status: string;
  @ApiProperty({
    description: 'Date',
    example: '2023-09-01T04:01:01.000+0000',
    format: 'string',
  })
  date: Date;
  @ApiProperty({ description: 'Site Address', example: '', format: 'string' })
  siteAddress: siteAddress;
}
export class NotificationRequest {
  @ApiProperty({ description: 'Account Id', example: '0018I00000jJnLkQAK' })
  id: string;
}

export class NotificationObject {
  Product_Information__c :string;
  attributes: {
    type: string;
    url: string;
  };
  Id: string;
  WorkType: {
    attributes: {
      type: string;
      url: string;
    };
    Name: string;
  };
  Status: string;
  Contract__r: {
    attributes: {
      type: string;
      url: string;
    };
    Reference_Number__c: string;
  };
  StartDate: Date;
  Schedule_Start__c: Date;
  Site_Address__r: {
    attributes: {
      type: string;
      url: string;
    };
    USF_Street__c: string;
    USF_City__c: string;
    USF_State__c: string;
    USF_Zip_Code__c: string;
    Address_Latitude_Longitude__c: {
      latitude: number;
      longitude: number;
    };
  };
}
export class NotificationResObj{
  quoteNo:string;
  quoteId:string;
  status:string;
  date:Date;
  siteAddress:siteAddress;
}

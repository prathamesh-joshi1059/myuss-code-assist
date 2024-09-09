import { ApiProperty } from '@nestjs/swagger';
import {IsBoolean, IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { AddressReqResDTO } from '../../../../common/dto/address.req_res_dto'
export class CreateInitialQuoteReqDTO {
    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    accountId: string;
    @ApiProperty()
    address: AddressReqResDTO
    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    contactId: string;
    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    orderType: string;
    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    zipcode: string;
    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    billTiming: string;
    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    billingPeriod: string;
    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    customerType: string;
    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    businessType: string;
    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    prodSubType: string;
    @IsNotEmpty()
    @IsBoolean()
    @ApiProperty()
    addressExist: boolean;
    @IsString()
    @ApiProperty()
    addressId: string;
    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    requestId: string;
    @IsString()
    @ApiProperty()
    @IsOptional()
    projectId: string;
}
export class MockInputJSONStep0 {
    "accountId": "0018I00000jKcrEQAS"
    "address": {}
    "contactId": "0038I00000fotGnQAI"
    "orderType": "Recurring without End Date"
    "zipcode": "02446"
    "billTiming": "Bill in Advance"
    "billingPeriod": "28 Day Bill Period"
    "customerType": "Business"
    "businessType": "Other Business"
    "prodSubType":"Renewable"
    "addressExist": true
    "addressId": "a8x8I000000CozVQAS"
}
export class MockOutputJSONStep0 {
    "status": 1000
    "message": "Success"
    "data": {
        "quoteId": "a6O8I000000HDlUUAW",
        "addressId": "a8x8I000000CozVQAS"
    }
}
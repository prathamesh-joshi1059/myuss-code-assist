import { ApiProperty } from '@nestjs/swagger';
import {IsBoolean, IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';
import { AddressReqResDTO, ContactDTO } from '../../../../../common/dto/address.req_res_dto';
export class CreateInitialQuoteReqDTO {
    @IsString()
    @ApiProperty()
    id: string;
    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    accountId: string;
    @ApiProperty()
    address: AddressReqResDTO
    @IsString()
    @ApiProperty()
    contactId: string;
    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    orderType: string;
    @IsString()
    @ApiProperty()
    zipcode: string;
    @IsString()
    @ApiProperty()
    quoteName: string;
    @IsString()
    @ApiProperty()
    customerType: string;
    @IsString()
    @ApiProperty()
    businessType: string;
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
    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    startDate: string;
    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    endDate: string;
    @IsObject()
    @ApiProperty()
    contact: ContactDTO;
    @IsBoolean()
    @ApiProperty()
    contactExist: boolean;
    @IsString()
    duration: string;
    @IsString()
    estimatedEndDate:string;
}

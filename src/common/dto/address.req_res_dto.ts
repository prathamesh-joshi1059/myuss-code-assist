import { ApiProperty } from '@nestjs/swagger';
import {IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
export class AddressReqResDTO {
    @IsString()
    @ApiProperty()
    accountId: string;
    @IsString()
    @ApiProperty()
    city: string;
    @IsString()
    @ApiProperty()
    state: string;
    @IsString()
    @ApiProperty()
    country: string;
    @IsString()
    @ApiProperty()
    street: string;
    @IsString()
    @ApiProperty()
    zipcode: string;
    @IsBoolean()
    @ApiProperty()
    shipToAddress: boolean;
    @IsBoolean()
    @ApiProperty()
    billToAddress: boolean;
    @IsString()
    @ApiProperty()
    siteName: string;
    @IsNumber()
    @ApiProperty()
    @IsOptional()
    latitude?: number;
    @IsNumber()
    @ApiProperty()
    @IsOptional()
    longitude?: number;
    @IsString()
    @ApiProperty()
    startTime?: string;
    @IsString()
    @ApiProperty()
    endTime?: string;
}

export class AddressDTO{
  @IsOptional()
  @IsString()
  @ApiProperty()
  addressId?: string;  
  @IsString()
  @ApiProperty()
  accountId: string;
  @IsOptional()
  @IsString()
  @ApiProperty()
  name?: string;
  @IsString()
  @ApiProperty()
  city: string;
  @IsString()
  @ApiProperty()
  state: string;
  @IsString()
  @ApiProperty()
  zipcode: string;
  @IsString()
  @ApiProperty()
  country: string;
  @IsOptional()
  @IsNumber()
  @ApiProperty()
  latitude?: number;
  @IsOptional()
  @IsNumber()
  @ApiProperty()
  longitude?: number;
  @IsOptional()
  @IsString()
  @ApiProperty()
  parentRefId?: string;
  @IsOptional()
  @IsString()
  @ApiProperty()
  startTime?: string;
  @IsOptional()
  @IsString()
  @ApiProperty()
  endTime?: string;
  @IsOptional()
  @IsString()
  @ApiProperty()
  siteName?: string;
  @IsOptional()
  @IsString()
  @ApiProperty()
  instructions?: string;
  @IsOptional()
  @IsString()
  @ApiProperty()
  street?: string;
  @IsOptional()
  @IsString()
  @ApiProperty()
  isParent? : boolean;
  @IsOptional()
  @IsString()
  @ApiProperty()
  gateCode?: string;
  @IsOptional()
  @IsString()
  @ApiProperty()
  information?: string;
  @IsOptional()
  @IsBoolean()
  @ApiProperty()
  clearanceRequired?: boolean;
  @IsOptional()
  @IsBoolean()
  @ApiProperty()
  idRequired?: boolean;
  @IsOptional()
  @IsBoolean()
  @ApiProperty()
  contactId?: string;
  @IsOptional()
  @IsBoolean()
  @ApiProperty()
  shipToContactRefId?: string;
  @IsOptional()
  @IsBoolean()
  @ApiProperty()
  siteContactRefId?: string;
  @IsOptional()
  @IsBoolean()
  @ApiProperty()
  id?: string;
  @IsOptional()
  @IsBoolean()
  @ApiProperty()
  shipToAddress?: boolean;
  @IsOptional()
  @IsBoolean()
  @ApiProperty()
  billToAddress?: boolean;
}
export class ContactDTO {
  @IsString()
  @ApiProperty()
  firstName: string;
  @IsString()
  @ApiProperty()
  lastName: string;
  @IsString()
  @ApiProperty()
  phone: string;
  @IsString()
  @ApiProperty()
  email: string;
  @IsOptional()
  @IsString()
  @ApiProperty()
  accountId?: string;
  @IsOptional()
  @IsString()
  @ApiProperty()
  contactId?: string;
  @IsOptional()
  @IsString()
  @ApiProperty()
  title?: string;
  @IsOptional()
  @IsString()
  @ApiProperty()
  fullName?: string;
}
export class CreateAddressReqDTO {
  @ApiProperty()
  address: AddressDTO
  @ApiProperty()
  contact: ContactDTO
  @IsBoolean()
  @ApiProperty()
  contactExist: boolean
}



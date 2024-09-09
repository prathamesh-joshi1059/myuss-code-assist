
import {IsBoolean, IsOptional, IsString } from 'class-validator';
export class GetAddressesRespDTO {
    @IsString()
    addressId: string;
    @IsString()
    account: string;
    @IsString()
    street: string;
    @IsString()
    city: string;
    @IsString()
    state: string;
    @IsString()
    zipcode: string;
    @IsString()
    latitude: number|0;
    @IsString()
    longitude: number|0;
    @IsBoolean()
    serviceable: boolean;
    @IsBoolean()
    isBillingAddress: boolean;
    @IsBoolean()
    isParentAddress: boolean;
    @IsOptional()
    @IsString()
    siteName?: string;
  }
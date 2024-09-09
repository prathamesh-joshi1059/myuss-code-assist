import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';
import { ContactDTO } from '../../../../common/dto/address.req_res_dto';

export class AddressDetailsDTO {
  @IsString()
  @ApiProperty()
  street: string;
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
  zipcode: string;
}

export class BillingDetailsReqDTO {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  requestId: string;
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  quoteId: string;
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  accountId: string;
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  contactRefId: string;
  @IsString()
  @ApiProperty()
  addressRefId?: string;
  @IsNotEmpty()
  @IsBoolean()
  @ApiProperty()
  addressExist: boolean;
  @IsNotEmpty()
  @IsBoolean()
  @ApiProperty()
  newBillingAddressForAccount: boolean;
  @ApiProperty()
  address: AddressDetailsDTO;
  @IsString()
  @ApiProperty()
  poNumber: string;
  @IsNotEmpty()
  @IsArray()
  @ApiProperty()
  emailIds: string[];
  @IsString()
  @ApiProperty()
  paymentMethodId: string;
  @IsBoolean()
  @ApiProperty()
  isAutoPay: boolean;
  @IsOptional()
  @IsObject()
  @ApiProperty()
  secondaryContactData: ContactDTO;
  @IsBoolean()
  @ApiProperty()
  secondaryContactExist: boolean;
  @IsString()
  @ApiProperty()
  secondaryContactId: string;
}
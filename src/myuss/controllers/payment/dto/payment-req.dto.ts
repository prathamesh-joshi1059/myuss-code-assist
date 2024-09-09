import { ApiProperty } from "@nestjs/swagger";
import {IsNotEmpty, IsOptional, IsString, Length, Min } from 'class-validator';

export class StripeCreateCustomerReqDTO {
    @ApiProperty({description: 'User email id', example:"gaurav.narvekar+43@zingworks.in"})
    @IsString()
    @IsOptional()
    email: string;
    @ApiProperty({description: 'Account name', example: "Niagara Bottling, LLC"})
    @IsString()
    @IsNotEmpty()
    accountName: string;
    @ApiProperty({description: 'Account Id', example: "ACT-01640759"})
    @IsString()
    @IsNotEmpty()
    accountNumber: string;
  }
   
   

  export class StripeGetPaymentMethodsReqDTO {
    @ApiProperty({description:'stripe_customer_id - Pass as an number (not a string) to get all payment method list', example:"stripe_customer_id = cus_Oqz9HmcZ4fbWqR"})
    @IsString()
    @IsNotEmpty()
    stripe_customer_id:string;
  }

  export class StripeSetupIntentReqDTO {
    @ApiProperty({description:'Stripe Customer Id - Pass in body', example:"cus_P7rOXZc7gmUJ93"})
    @IsString()
    @IsNotEmpty()
    customer_id: string;
  }

  export class StripeGetPaymentDetailsReqDTO{
    @ApiProperty({description:'Customer payment method Id', example:"pm_1OJuZRKX1Bgoxru0YaVzNtNM"})
    @IsString()
    @IsNotEmpty()
    id: string;
   
  }

    
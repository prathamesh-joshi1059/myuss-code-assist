import {IsString } from 'class-validator';

export class GetOrderInfoDTO {
  @IsString()
  orderNo: string;
  @IsString()
  zip: string;
  @IsString()
  reCaptchaToken: string;
}
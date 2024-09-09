import {IsString } from 'class-validator';

export class SetupIntentReqDTO {
  @IsString()
  accountNo: string;
  @IsString()
  orderNo: string;
  @IsString()
  reCaptchaToken: string;
}
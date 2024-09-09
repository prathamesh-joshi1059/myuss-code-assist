import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ConfirmQuoteReqDTO {
  @IsNotEmpty()
  @IsString()
  requestId: string;
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  quoteId: string;
  @IsOptional()
  @IsString()
  @ApiProperty()
  paymentMethodId: string;
  @IsNotEmpty()
  @IsBoolean()
  @ApiProperty()
  isAutoPay: boolean;
  @IsOptional()
  @ApiProperty()
  @IsString()
  projectId:string;
  @IsOptional()
  @ApiProperty()
  @IsString()
  projectStatus:string;
}
// export class MOCKReq{
//   "quoteId":"a6O8I000000HE7qUAG",
//   "isAutoPay":true,
//   "paymentMethodId":"pm_1OFxNZKX1Bgoxru0qTEJGaa7"
// }
// export class MOCKResp {
//   "status": 1000,
//   "message": "Success",
//   "data": {
//       "quoteId": "8018I0000020jOCQAY"
//   }
// }

import { IsNotEmpty, IsString } from 'class-validator';
export class UpdatePaymentMethodReqDTO {
  @IsString()
  accountNo: string;
  @IsString()
  orderNo: string;
  @IsString()
  paymentMethodId: string;
  @IsString()
  orderUpdateJWT: string;
}

export class UpdatePaymentMethodRespDTO {
  status_code: 'OK' | 'ERR_OTHER';
  default_message: string;
}
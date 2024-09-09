import { IsNumber, IsOptional, IsString } from 'class-validator';
import isBoolean from 'validator/lib/isBoolean';
export class ChangePasswordRespDto {
  @IsString()
  ticket: string;

  @IsString()
  message: string;

  @IsNumber()
  status:number;

  @IsOptional()
  success?:boolean;
}

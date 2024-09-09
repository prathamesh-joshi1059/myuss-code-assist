import { IsString, IsNumber, IsDate } from 'class-validator';
export class CreatePurchaseOrderDto {
  @IsString()
  name: string;
  @IsString()
  accountId: string;
  @IsNumber()
  amount: number;
  @IsDate()
  expirationDate?: Date;
}
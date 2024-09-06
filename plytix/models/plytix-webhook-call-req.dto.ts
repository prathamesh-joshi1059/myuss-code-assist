import { IsString, IsOptional, IsNumber } from 'class-validator';

export class PlytixWebhookCallReqDTO {
  @IsNumber()
  @IsOptional()
  processed_products?: number;

  @IsString()
  @IsOptional()
  feed_url?: string;

  @IsString()
  @IsOptional()
  channel_processing_status?: string;
}
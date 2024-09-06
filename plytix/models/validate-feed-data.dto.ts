import { IsString, IsDefined } from 'class-validator';

export class ValidateFeedDataDto {
  @IsString()
  @IsDefined()
  Family: string;

  @IsString()
  @IsDefined()
  GTIN: string;

  @IsString()
  @IsDefined()
  Status: string;

  @IsString()
  @IsDefined()
  Created: string;

  @IsString()
  @IsDefined()
  'Last modified': string;

  @IsString()
  @IsDefined()
  Thumbnail: string;

  @IsString()
  @IsDefined()
  Assets: string;

  @IsString()
  @IsDefined()
  Categories: string;

  @IsString()
  @IsDefined()
  Variations: string;

  @IsString()
  @IsDefined()
  'Variation of': string;

  @IsString()
  @IsDefined()
  Label: string;

  @IsString()
  @IsDefined()
  SKU: string;

  @IsString()
  @IsDefined()
  'Product ID': string;

  @IsString()
  @IsDefined()
  'Product Type': string;

  @IsString()
  @IsDefined()
  'Test Completeness': string;

  @IsString()
  @IsDefined()
  'Optional features': string;

  @IsString()
  @IsDefined()
  'Meta Description': string;

  @IsString()
  @IsDefined()
  'Image Gallery': string;

  @IsString()
  @IsDefined()
  Features: string;

  @IsString()
  @IsDefined()
  Excerpt: string;

  @IsString()
  @IsDefined()
  Description: string;

  @IsString()
  @IsDefined()
  'delivery_pickup_desc': string;

  @IsString()
  @IsDefined()
  'Custom Description': string;

  @IsString()
  @IsDefined()
  'clean_sanitary_desc': string;
}

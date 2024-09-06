import { IsString, IsDefined } from 'class-validator';

export class ValidateFeedDataDto {
  @IsString()
  @IsDefined()
  family: string;

  @IsString()
  @IsDefined()
  gtin: string;

  @IsString()
  @IsDefined()
  status: string;

  @IsString()
  @IsDefined()
  created: string;

  @IsString()
  @IsDefined()
  lastModified: string;

  @IsString()
  @IsDefined()
  thumbnail: string;

  @IsString()
  @IsDefined()
  assets: string;

  @IsString()
  @IsDefined()
  categories: string;

  @IsString()
  @IsDefined()
  variations: string;

  @IsString()
  @IsDefined()
  variationOf: string;

  @IsString()
  @IsDefined()
  label: string;

  @IsString()
  @IsDefined()
  sku: string;

  @IsString()
  @IsDefined()
  productId: string;

  @IsString()
  @IsDefined()
  productType: string;

  @IsString()
  @IsDefined()
  testCompleteness: string;

  @IsString()
  @IsDefined()
  optionalFeatures: string;

  @IsString()
  @IsDefined()
  metaDescription: string;

  @IsString()
  @IsDefined()
  imageGallery: string;

  @IsString()
  @IsDefined()
  features: string;

  @IsString()
  @IsDefined()
  excerpt: string;

  @IsString()
  @IsDefined()
  description: string;

  @IsString()
  @IsDefined()
  deliveryPickupDesc: string;

  @IsString()
  @IsDefined()
  customDescription: string;

  @IsString()
  @IsDefined()
  cleanSanitaryDesc: string;
}
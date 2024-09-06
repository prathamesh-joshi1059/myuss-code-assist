export class PlytixProductModel {
  family: string;
  gtin: string;
  status: string;
  created: string;
  lastModified: string;
  thumbnail: string[];
  assets: string[];
  categories: string;
  variations: string;
  variationOf: string;
  label: string;
  sku: string;
  productId: string;
  productType: string;
  testCompleteness: string;
  optionalFeatures: string;
  metaDescription: string;
  imageGallery: string[];
  features: string;
  excerpt: string;
  description: string;
  deliveryPickupDesc: string;
  customDescription: string;
  cleanSanitaryDesc: string;

  constructor(init?: Partial<PlytixProductModel>) {
    Object.assign(this, init);
  }

  toJSON() {
    return {
      family: this.family,
      gtin: this.gtin,
      status: this.status,
      created: this.created,
      lastModified: this.lastModified,
      thumbnail: this.thumbnail,
      assets: this.assets,
      categories: this.categories,
      variations: this.variations,
      variationOf: this.variationOf,
      label: this.label,
      sku: this.sku,
      productId: this.productId,
      productType: this.productType,
      testCompleteness: this.testCompleteness,
      optionalFeatures: this.optionalFeatures,
      metaDescription: this.metaDescription,
      imageGallery: this.imageGallery,
      features: this.features,
      excerpt: this.excerpt,
      description: this.description,
      deliveryPickupDesc: this.deliveryPickupDesc,
      cleanSanitaryDesc: this.cleanSanitaryDesc,
    };
  }
}

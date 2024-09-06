import { PlytixProductModel } from '../models/plytix.model';

export class PlytixProductMapper {
  static mapToPlytixProduct(data): PlytixProductModel {
    const product = new PlytixProductModel();

    product.family = data.Family;
    product.gtin = data.GTIN;
    product.lastModified = data.Lastmodified;
    product.status = data.Status;
    product.created = data.Created;
    product.thumbnail = this.splitToArray(data.Thumbnail);
    product.assets = this.splitToArray(data.Assets);
    product.imageGallery = this.splitToArray(data.ImageGallery);
    product.categories = data.Categories;
    product.label = data.Label;
    product.sku = data.SKU;
    product.features = data.Features;
    product.excerpt = data.Excerpt;
    product.description = data.Description;
    product.deliveryPickupDesc = data.delivery_pickup_desc;
    product.cleanSanitaryDesc = data.clean_sanitary_desc;
    product.variations = data.Variations;
    product.variationOf = data.Variationof;
    product.productId = data.ProductID;
    product.productType = data.ProductType;
    product.testCompleteness = data.TestCompleteness;
    product.optionalFeatures = data.Optionalfeatures;
    product.metaDescription = data.MetaDescription;
    product.customDescription = data.CustomDescription;

    return product;
  }

  private static splitToArray(value: string | undefined): string[] {
    return value ? value.split(',') : [];
  }
}
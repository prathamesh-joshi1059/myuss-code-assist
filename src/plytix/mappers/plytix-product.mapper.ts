import { PlytixProductModel } from '../models/plytix.model';

export class PlytixProductMapper {
  static mapToPlytixProduct(data): PlytixProductModel {
    const product = new PlytixProductModel();

    product.family = data.Family;
    product.gtin = data.GTIN;
    product.lastModified = data.Lastmodified;
    product.status = data.Status;
    product.created = data.Created;

    let thumbnailArray = [];
    if (data.Thumbnail != undefined && data.Thumbnail != '') {
      data.Thumbnail.split(',').map((thumbnail) => {
        thumbnailArray.push(thumbnail);
      });
    }
    product.thumbnail = thumbnailArray;
    let assetArray = [];
    if (data.Assets != undefined && data.Assets != '') {
      data.Assets.split(',').map((asset) => {
        assetArray.push(asset);
      });
    }
    product.assets = assetArray;

    let imageGalleryArr = [];
    if (data.ImageGallery != undefined && data.ImageGallery != '') {
      data.ImageGallery.split(',').map((imageGallery) => {
        imageGalleryArr.push(imageGallery);
      });
    }
    product.imageGallery = imageGalleryArr;
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
}

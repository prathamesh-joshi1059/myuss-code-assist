export class Product {
    id: string;
    name: string;
    description: string;
    price: number;
  }

  export class PlytixProduct {
    gtin: string;
    thumbnail: string[];
    created: Date;
    plytixDescription: string;
    label: string;
    deliveryPickupDesc: string;
    cleanSanitaryDesc: string;
    features: string;
    assets: string[];
    categories: string;
    family: string;
    sku: string;
    excerpt: string;
    status: string;
    imageGallery: string[];
  }
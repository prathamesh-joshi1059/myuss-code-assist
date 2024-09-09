import { CreateRFQDto, Product } from "../../controllers/rfq/dto/create-web-rfq.dto";
import { RequestForQuote, RFQProduct } from "../../models/request-for-quote.model";

export class RFQHelper {
  static mapCreateRFQDtoToRequestForQuote(rfq: CreateRFQDto): RequestForQuote {
    // TODO implement this if we need to support v1
    return new RequestForQuote();
  }

  static calculateDurationFromDates(start: Date, end: Date): "Under 7 Days" | "0 to 2 Months" | "3 to 5 Months" | "6+ Months" {
    const startDate = new Date(start);
    const endDate = new Date(end); 
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    let duration: "Under 7 Days" | "0 to 2 Months" | "3 to 5 Months" | "6+ Months" = "Under 7 Days";
    if (diffDays >= 8 && diffDays <= 60) {
      duration = "0 to 2 Months";
    } else if (diffDays >= 61 && diffDays <= 150) {
      duration = "3 to 5 Months";
    } else if (diffDays >= 151) {
      duration = "6+ Months";
    }
    return duration;
  }

  public static getStandardProductsString(products: RFQProduct[]): string {
    let standardProductsString = '';
    if (!products || products.length === 0) {
      return standardProductsString;
    }
    const standardProducts = products.filter(product => product.productType === 'standard');
    standardProductsString = this.getProductsString(standardProducts);
    return standardProductsString;
  }

  public static getSpecialtyProductsString(products: RFQProduct[]): string {
    let specialtyProductsString = '';
    if (!products || products.length === 0) {
      return specialtyProductsString;
    }
    // if there's no product type, assume it's a specialty product
    const specialtyProducts = products.filter(product => !product.productType || product.productType !== 'standard');
    specialtyProductsString = this.getProductsString(specialtyProducts);
    return specialtyProductsString;
  }

  public static getProductsString(products: RFQProduct[]): string {
    if (!products || products.length === 0) {
      return '';
    }
    const simplifiedProducts = products.map(product => {
      let productResult = {};
      if (product.category && product.code !== product.category?.code) {
        productResult['category'] = product.category.name;
      }
      productResult['name'] = product.name;
      productResult['quantity'] = product.quantity;
      return productResult;
    });
    let productsString = '';
    simplifiedProducts.forEach((product, index) => {
      let thisString = '';
      if (product['category']) {
        thisString = `${product['category']} - ${product['name']} (${product['quantity']}); `;
      } else {
        thisString = `${product['name']} (${product['quantity']}); `;
      }
      productsString += thisString;
    });
    // trim off the last semicolon and space
    productsString = productsString.length > 2 ? productsString.substring(0, productsString.length - 2) : productsString;
    return productsString;
  }
  
  public static parseProducts(products: string): Product[] {
    // "crm_standardproducts": "{Hand Washing,2;Portable Restrooms, Standard Restroom,3;Portable Restrooms, Restroom with Crane Hook,1}",
    // "crm_specialtyproducts": "{Temporary Power,1;Other Services,1}",
    // first trim off the curly braces
    const trimmedProducts = products.substring(1, products.length - 1);
    if (!trimmedProducts) {
      return [];
    }
    // split on the semi-colon
    const entries = trimmedProducts.split(';');
    // split each entry on the comma
    const parsedProducts = entries.map((entry) => {
      // not always 3 parts, if there are only 2 then the category is missing
      const parts = entry.split(',');
      if (parts.length === 3) {
        return new Product(parts[0].trim(), parts[1].trim(), parseInt(parts[2]));
      } else {
        return new Product(null, parts[0].trim(), parseInt(parts[1]));
      }
    });
    return parsedProducts;
  }

  public static getProductsCategoryString(products: RFQProduct[],productCategoriesMap: object): string {
    let productsCategoryString = '';
    if (!products || products.length === 0) {
      return productsCategoryString;
    }
    
    products.map(product => {
      if (product.category) {
        const productCategory = productCategoriesMap[product.category.code];
        if (!productsCategoryString.includes(productCategory)) {
        productsCategoryString += `${productCategory}; `;
        }
      }
      return productsCategoryString;
    });

    productsCategoryString = productsCategoryString.length > 2 ? productsCategoryString.substring(0, productsCategoryString.length - 2) : productsCategoryString;
    return productsCategoryString;
  }
}
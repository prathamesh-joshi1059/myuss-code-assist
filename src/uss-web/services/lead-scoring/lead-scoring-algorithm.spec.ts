import { Product } from "../../../myuss/models/product";
import { RequestForQuote, RFQProduct} from "../../models/request-for-quote.model";
import { LeadScoringAlgorithm } from "./lead-scoring-algorithm";
import { Lead } from "../../models/lead.model";

describe('LeadScoringAlgorithm', () => {
  it('should be 1', async () => {
    const priority = await LeadScoringAlgorithm.calculateProbabiltyAndPriority(test1);
    expect(priority.priority).toBe(1);
  });

  // Business, 0 to 2 Months, 1PortableRestrooms
  const test1 = new RequestForQuote();
  test1.purposeOfRental = 'Business';
  test1.rentalDuration = '0 to 2 Months';
  const restroom = new RFQProduct();
  restroom.code = '93046';
  restroom.name = 'Standard Restroom'
  restroom.quantity = 1;
  restroom.productType = 'standard';
  restroom.category = { code: 'porta-potty-rentals', name: 'Portable Restrooms' };
  test1.products.push(restroom);

});



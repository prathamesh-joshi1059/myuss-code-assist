import { Product } from "../../../myuss/models/product";
import { RequestForQuote, RFQProduct} from "../../models/request-for-quote.model";
import { RFQHelper } from "./rfq.helper";

describe('LeadScoringAlgorithm', () => {
  const testStartDate1 = new Date('2023-10-01');
  const testEndDate1 = new Date('2023-11-01');
  it('should be 0 to 2 Months', async () => {
    const duration = RFQHelper.calculateDurationFromDates(testStartDate1, testEndDate1);
    expect(duration).toBe('0 to 2 Months');
  });

  const testStartDate2 = new Date('2023-01-01');
  const testEndDate2 = new Date('2023-04-01');
  it('should be 3 to 5 Months', async () => {
    const duration = RFQHelper.calculateDurationFromDates(testStartDate2, testEndDate2);
    expect(duration).toBe('3 to 5 Months');
  });

  const testStartDate3 = new Date('2023-01-01');
  const testEndDate3 = new Date('2023-07-01');
  it('should be 6+ Months', async () => {
    const duration = RFQHelper.calculateDurationFromDates(testStartDate3, testEndDate3);
    expect(duration).toBe('6+ Months');
  });

  const testStartDate4 = new Date('2023-01-01');
  const testEndDate4 = new Date('2023-01-08');
  it('should be Under 7 Days', async () => {
    const duration = RFQHelper.calculateDurationFromDates(testStartDate4, testEndDate4);
    expect(duration).toBe('Under 7 Days');
  });

});
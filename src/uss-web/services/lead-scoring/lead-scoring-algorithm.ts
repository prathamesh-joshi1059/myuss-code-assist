import { RequestForQuote } from "../../models/request-for-quote.model";
import { RFQHelper } from "../rfq/rfq.helper";

/**
 * Lead scoring algorithm
 * Based on the scoring model stored here:
 * https://unitedsiteservices.sharepoint.com/:x:/r/sites/DigitalMarketing/Shared%20Documents/
 * General/Web%20Leads%20Prioritization%20Pilot/Web%20Leads%20Data%20Assessment%20with%20Wins_04.xlsx
 * ?d=wb97b5faa101146e08f6d1ca5d1eb0805&csf=1&web=1&e=Jb4Xdi
 */
export class LeadScoringAlgorithm {
  private static modelVersion = 'Web Lead Scoring Model v2023.10';
  private static coef = -2.72390318893504;
  private static mapCustomerTypeToMinScore = {
    'Personal': 0.5,
    'Business': 0.2,
    'Government': 0.2,
  }
  private static mapDurationToContribution = {
    'Under 7 Days': 0,
    '0 to 2 Months': 1.81146418594984,
    '3 to 5 Months': 1.63697228337632,
    '6+ Months': 1.41904648166035,
  }


  public static async calculateProbabiltyAndPriority(rfq: RequestForQuote): Promise<{priority: number, winProbability: number}> {
    // =EXP($B$6+SUMPRODUCT(C8:L8,$C$6:$L$6))/(1+EXP($B$6+SUMPRODUCT(C8:L8,$C$6:$L$6)))
    if (!rfq.rentalDuration) {
      rfq.rentalDuration = RFQHelper.calculateDurationFromDates(rfq.startDate, rfq.endDate);
    }
    const p = this.calculateScore(rfq);
    const probability = Math.exp(this.coef + p) / (1 + Math.exp(this.coef + p));
    rfq.probabilityModel = this.modelVersion;
    rfq.winProbability = probability;
    const priority = this.getPriority(rfq, probability);
    rfq.priorityGroup = priority.toString();
    const result = { priority: priority, winProbability: probability };
    return result;
  }

  static getPriority(rfq: RequestForQuote, probability: number): number {
    const customerType = rfq.purposeOfRental;;
    const minScore = this.mapCustomerTypeToMinScore[customerType];
    const priority = probability >= minScore ? 1 : 2;
    return priority;
  }

  private static calculateScore(rfq: RequestForQuote): number {
    const durationContrib = this.calculateDurationContribution(rfq);
    const productsContrib = this.calculateProductsContribution(rfq);
    const score = durationContrib + productsContrib;
    return score;
  }

  private static calculateDurationContribution(rfq: RequestForQuote): number {
    const duration = rfq.rentalDuration;
    const contrib = this.mapDurationToContribution[duration];
    return contrib ? contrib : 0;
  }

  private static calculateProductsContribution(rfq: RequestForQuote): number {
    if (!rfq.products) {
      return 0;
    }
    const products = rfq.products;
    let contrib = 0;
    // 1PortableRestrooms = 1.877
    // 2/3PortableRestrooms = 1.481
    // 4+PortableRestrooms = 0.271
    const restrooms = products.filter(p => p.category?.code === 'porta-potty-rentals');
    const restroomsCount = restrooms.reduce((acc, p) => acc + p.quantity, 0);
    if (restroomsCount === 1) {
      contrib += 1.87680054221172;
    } else if (restroomsCount === 2 || restroomsCount === 3) {
      contrib += 1.48147628967549;
    } else if (restroomsCount >= 4) {
      contrib += 0.270520161433566;
    }
    // 1HandWashing = 0.536
    // 2/3HandWashing = 0.350
    const handWashings = products.filter(p => p.category?.code === 'hand-washing');
    const handWashingCount = handWashings.reduce((acc, p) => acc + p.quantity, 0);
    if (handWashingCount === 1) {
      contrib += 0.535521282898602;
    }else if (handWashingCount === 2 || handWashingCount === 3) {
      contrib += 0.349935508791867;
    }
    // Product Q>20 (Exc Fence) -1.571
    const productCount = products
      .filter(product => product.category?.code !== 'temporary-fence-rentals')
      .reduce((acc, p) => acc + p.quantity, 0);
    if (productCount > 20) {
      contrib += -1.57138557097384;
    }
    // 3+Prods = -0.786
    if (products.length >= 3) {
      contrib += -0.786190266262554;
    }
    return contrib;
  }
}
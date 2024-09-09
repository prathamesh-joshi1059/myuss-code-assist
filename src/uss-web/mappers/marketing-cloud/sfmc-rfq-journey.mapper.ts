import { RFQHelper } from "../../services/rfq/rfq.helper";
import { RFQJourneyEntryDTO } from "../../../backend/marketing-cloud/models/rfq-journey-entry.dto";
import { RequestForQuote } from "../../models/request-for-quote.model";

export class SFMC_RFQJourneyMapper {
  public static mapRFQtoJourneyEntryDTO(rfq: RequestForQuote): RFQJourneyEntryDTO {
    const dto = new RFQJourneyEntryDTO();
    dto.Email = rfq.emailAddress;
    dto.Phone = rfq.phoneNumber;
    dto.LastName = rfq.lastName;
    dto.FirstName = rfq.firstName;
    dto.CompanyName = rfq.companyName;
    dto.DeliveryZIP = rfq.deliveryZipCode;
    dto.StartDate = this.makeSafeDate(rfq.startDate);
    // if the end date is way in the past, it's probably a placeholder date
    const endDate = this.makeSafeDate(rfq.endDate);
    dto.EndDate = endDate && endDate > new Date(2020,0,1) ? endDate : null;
    dto.KindofUse = rfq.useType;
    dto.RentalPurpose = rfq.purposeOfRental;
    dto.CustomerType = rfq.purposeOfRental; // we're already mapping to the SFDC values in the frontend
    dto.RentalDuration = rfq.rentalDuration;
    dto.StandardProducts = RFQHelper.getStandardProductsString(rfq.products);
    dto.SpecialtyProducts = RFQHelper.getSpecialtyProductsString(rfq.products);
    dto.Acq_Company = '';
    dto.crm_web_lead_privacy_policy_opt_in = true; // the form cannot be submitted without this being true
    dto.WebRFQId = rfq.id;
    dto.LastClickId = rfq.lastClickId;
    return dto;
  }

  private static makeSafeDate(date: Date | string): Date {
    let safeDate: Date;
    try {
      safeDate = new Date(date);
      if (safeDate.toString() === 'Invalid Date') {
        return null;
      }
    } catch (e) {
      return null;
    }
    return safeDate;
  }
}
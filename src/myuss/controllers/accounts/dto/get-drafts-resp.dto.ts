import { DraftModel } from "../../../../myuss/models";

export class GetAllDraftsDTO {
    unitServicesStep1 : DraftModel[];
    viewQuoteStep2 : DraftModel[];
    siteDetailsStep3 : DraftModel[];
    billingPaymentDetailsStep4 : DraftModel[];
    orderConfirmStep5 : DraftModel[];
    drafts : DraftModel[];
}
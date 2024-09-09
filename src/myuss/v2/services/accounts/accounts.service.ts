import { Injectable } from '@nestjs/common';
import { DraftModel } from '../../../../myuss/models';
import { SfdcQuoteService } from '../../../../backend/sfdc/services/sfdc-quote/sfdc-quote.service';
import { LoggerService } from '../../../../core/logger/logger.service';
import { ApiRespDTO } from '../../../../common/dto/api-resp.dto';
import { FirestoreService } from '../../../../backend/google/firestore/firestore.service';
import { SFDC_ProjectMapper } from '../../../../myuss/mappers/salesforce/project.mapper';
import { SBQQ__Quote__c } from '../../../../backend/sfdc/model/SBQQ__Quote__c';
import { GetAllDraftsDTO } from '../../../../myuss/controllers/accounts/dto/get-drafts-resp.dto';

@Injectable()
export class AccountsServiceV2 {
  constructor(
    private sfdcQuoteService: SfdcQuoteService,
    private logger: LoggerService,
    private firestoreService: FirestoreService
  ) {}


  async fetchDraftsV2(
    accountIds: string[],
    projectId: string,
    status: string,
  ): Promise<ApiRespDTO<GetAllDraftsDTO | []>> {
    try {
      // Fetching drafts records from salseforce and firestore
      const sfdcDraftsResponse = this.sfdcQuoteService.fetchDrafts(accountIds, projectId, status);
      const firestoreDraftsResponse = this.firestoreService.getCollectionDocsByFieldName(
        'quotes',
        'accountId',
        accountIds[0],
      );
      const draftsResponse = await Promise.all([sfdcDraftsResponse, firestoreDraftsResponse]);

      let finalDraftsArray = {
        quoteDetailsStep0: [],
        unitServicesStep1: [],
        viewQuoteStep2: [],
        siteDetailsStep3: [],
        billingPaymentDetailsStep4: [],
        orderConfirmStep5: [],
        rejectedStep6: [],
        archivedStep7: [],
        drafts: [],
      }; 
      // Check for error and absence of drafts
      if (!draftsResponse) {
        return { status: 1041, message: 'Error while fetching quotes', data: finalDraftsArray };
      }
      if (draftsResponse[0].length == 0) {
        return { status: 1000, message: 'Success', data: finalDraftsArray };
      }
      // Structuring firestore data
      let firestoreDraftsData = draftsResponse[1] ? draftsResponse[1].map((draft) => draft.data()) : [];

      // Iterating through drafts responses
      let draftsArray = draftsResponse[0]
        ? draftsResponse[0].map((sfdcDraft: SBQQ__Quote__c) => {
            // check for salseforce draft is already present in firestore
            let isQuotePresentInFirestore = firestoreDraftsData.find(
              (firestoreDraft) => firestoreDraft.quoteId == sfdcDraft.Id,
            );

            let draftObject: DraftModel = {
              projectDetails: sfdcDraft.SBQQ__Opportunity2__r.USF_Project__r
                ? SFDC_ProjectMapper.getMyUSSProjectFromSFDCProject(
                    sfdcDraft.SBQQ__Opportunity2__r.USF_Project__r,
                    [],
                    accountIds[0],
                  )
                : null,
              firestorePaymentMethodId: isQuotePresentInFirestore ? isQuotePresentInFirestore.paymentMethodId : '',
              isAutoPay: isQuotePresentInFirestore ? isQuotePresentInFirestore.isAutoPay : true,
              id: sfdcDraft.Id,
              lastModifiedDate: sfdcDraft.LastModifiedDate,
              name: sfdcDraft.Name,
              shippingAddress: sfdcDraft.Shipping_Address__r ? sfdcDraft.Shipping_Address__r.Name : '',
              zipcode: sfdcDraft.Serviceable_Zip_Code__r ? sfdcDraft.Serviceable_Zip_Code__r.Zip_Code__c : '',
              billAddress: {
                lat: sfdcDraft.Bill_To_Address__r
                  ? sfdcDraft.Bill_To_Address__r.Address_Latitude_Longitude__Latitude__s
                  : 0,
                lng: sfdcDraft.Bill_To_Address__r
                  ? sfdcDraft.Bill_To_Address__r.Address_Latitude_Longitude__Longitude__s
                  : 0,
              },
              shipAddress: {
                lat: sfdcDraft.Shipping_Address__r
                  ? sfdcDraft.Shipping_Address__r.Address_Latitude_Longitude__Latitude__s
                  : 0,
                lng: sfdcDraft.Shipping_Address__r
                  ? sfdcDraft.Shipping_Address__r.Address_Latitude_Longitude__Longitude__s
                  : 0,
              },
              status: sfdcDraft.SBQQ__Status__c,
              siteComplete: sfdcDraft.Site_Complete__c ? sfdcDraft.Site_Complete__c : false,
              billingComplete: sfdcDraft.Billing_Complete__c ? sfdcDraft.Billing_Complete__c : false,
              paymentMethodId: sfdcDraft.Payment_Method_Id__c ? sfdcDraft.Payment_Method_Id__c : null,
              isCheckPaymentMethod: sfdcDraft.isCheckPaymentMethod__c,
              paymentMode: sfdcDraft.Payment_Mode__c ? sfdcDraft.Payment_Mode__c : null,
              source: sfdcDraft.CreatedBy.Name == 'MyUSS System User' ? 'MyUSS' : 'Salesforce',
              createdDate: sfdcDraft.CreatedDate,
              startDate: sfdcDraft.SBQQ__StartDate__c,
              endDate: sfdcDraft.SBQQ__EndDate__c,
              expiryDate: sfdcDraft.SBQQ__ExpirationDate__c,
              quoteName: sfdcDraft.Quote_Name__c,
              currentStatus: this.getQuoteStatus(sfdcDraft, isQuotePresentInFirestore),
            };
            // For quotes created from salseforce and paymentMethodId is present at salseforce but not at firestoree
            const { source, paymentMethodId, firestorePaymentMethodId, name, currentStatus } = draftObject;
            if (source == 'Salesforce' && paymentMethodId && !firestorePaymentMethodId) {
              draftObject.firestorePaymentMethodId = draftObject.paymentMethodId;
              this.firestoreService.upsertDocument('quotes', draftObject.id, {
                paymentMethodId: draftObject.paymentMethodId,
                isAutoPay: draftObject.isAutoPay,
                quoteId: draftObject.id,
                accountId: accountIds[0],
              });
            }
            // Updating the final response
            const {
              quoteDetailsStep0,
              unitServicesStep1,
              viewQuoteStep2,
              siteDetailsStep3,
              billingPaymentDetailsStep4,
              orderConfirmStep5,
              rejectedStep6,
              archivedStep7,
              drafts,
            } = finalDraftsArray;
            let steps = {
              0: quoteDetailsStep0,
              1: unitServicesStep1,
              2: viewQuoteStep2,
              3: siteDetailsStep3,
              4: billingPaymentDetailsStep4,
              5: orderConfirmStep5,
              6: rejectedStep6,
              7: archivedStep7,
            };

            if (steps[currentStatus]) {
              steps[currentStatus].push(draftObject); // Uncomment if required, separation of objects based on current step
              drafts.push(draftObject);
            }
          })
        : [];

      return {
        status: 1000,
        message: 'success',
        data: finalDraftsArray,
      };
    } catch (error) {
      this.logger.error(error);
      return { status: 1041, message: 'Error while fetching quotes', data: [] };
    }
  }

  // This function return the current step for Draft
  public getQuoteStatus(sfdcDraft: SBQQ__Quote__c, isQuotePresentInFirestore ):number {
    if (sfdcDraft.SBQQ__Status__c == 'Draft' && sfdcDraft.SBQQ__LineItemCount__c == 0) return 0;
    else if (sfdcDraft.SBQQ__Status__c == 'Draft') return 1;
    else if (sfdcDraft.SBQQ__Status__c == 'Presented') return 2;
    else if (sfdcDraft.SBQQ__Status__c == 'Approved' && !sfdcDraft.Site_Complete__c && !sfdcDraft.Billing_Complete__c)
      return 3;
    else if (
      sfdcDraft.SBQQ__Status__c == 'Approved' &&
      ((sfdcDraft.Site_Complete__c && !sfdcDraft.Billing_Complete__c) || // Approved, site complete true, billing complete false
        (sfdcDraft.Site_Complete__c && sfdcDraft.Billing_Complete__c && !isQuotePresentInFirestore) || // site complete true, billing complete true, quote not present in firestore
        (isQuotePresentInFirestore && isQuotePresentInFirestore.isAutoPay && sfdcDraft.isCheckPaymentMethod__c) || // quote present in firestore, both the payments either true or either false
        (isQuotePresentInFirestore && !isQuotePresentInFirestore.isAutoPay && !sfdcDraft.isCheckPaymentMethod__c)) // quote present in firestore, both the payments either true or either false
    )
      return 4;
    else if (
      sfdcDraft.SBQQ__Status__c == 'Approved' &&
      ((sfdcDraft.Site_Complete__c && sfdcDraft.Billing_Complete__c) ||
        (isQuotePresentInFirestore && isQuotePresentInFirestore.paymentMethodId == sfdcDraft.Payment_Method_Id__c))
    )
      return 5;
      else if (sfdcDraft.SBQQ__Status__c == 'Ordered') return 6;
      else if (sfdcDraft.SBQQ__Status__c == 'Archived') return 7;
      else if (sfdcDraft.SBQQ__Status__c == 'Rejected') return 8;
  }
}
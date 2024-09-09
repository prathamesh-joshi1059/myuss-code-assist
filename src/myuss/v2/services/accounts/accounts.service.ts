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
    status: string
  ): Promise<ApiRespDTO<GetAllDraftsDTO | []>> {
    try {
      // Fetching drafts records from Salesforce and Firestore
      const [sfdcDraftsResponse, firestoreDraftsResponse] = await Promise.all([
        this.sfdcQuoteService.fetchDrafts(accountIds, projectId, status),
        this.firestoreService.getCollectionDocsByFieldName('quotes', 'accountId', accountIds[0]),
      ]);

      const finalDraftsArray = {
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
      if (!sfdcDraftsResponse) {
        return { status: 1041, message: 'Error while fetching quotes', data: finalDraftsArray };
      }
      if (sfdcDraftsResponse.length === 0) {
        return { status: 1000, message: 'Success', data: finalDraftsArray };
      }

      // Structuring Firestore data
      const firestoreDraftsData = firestoreDraftsResponse ? firestoreDraftsResponse.map((draft) => draft.data()) : [];

      // Iterating through drafts responses
      sfdcDraftsResponse.forEach((sfdcDraft: SBQQ__Quote__c) => {
        // Check if Salesforce draft is already present in Firestore
        const isQuotePresentInFirestore = firestoreDraftsData.find(
          (firestoreDraft) => firestoreDraft.quoteId === sfdcDraft.Id
        );

        const draftObject: DraftModel = {
          projectDetails: sfdcDraft.SBQQ__Opportunity2__r?.USF_Project__r
            ? SFDC_ProjectMapper.getMyUSSProjectFromSFDCProject(
                sfdcDraft.SBQQ__Opportunity2__r.USF_Project__r,
                [],
                accountIds[0]
              )
            : null,
          firestorePaymentMethodId: isQuotePresentInFirestore ? isQuotePresentInFirestore.paymentMethodId : '',
          isAutoPay: isQuotePresentInFirestore ? isQuotePresentInFirestore.isAutoPay : true,
          id: sfdcDraft.Id,
          lastModifiedDate: sfdcDraft.LastModifiedDate,
          name: sfdcDraft.Name,
          shippingAddress: sfdcDraft.Shipping_Address__r?.Name || '',
          zipcode: sfdcDraft.Serviceable_Zip_Code__r?.Zip_Code__c || '',
          billAddress: {
            lat: sfdcDraft.Bill_To_Address__r?.Address_Latitude_Longitude__Latitude__s || 0,
            lng: sfdcDraft.Bill_To_Address__r?.Address_Latitude_Longitude__Longitude__s || 0,
          },
          shipAddress: {
            lat: sfdcDraft.Shipping_Address__r?.Address_Latitude_Longitude__Latitude__s || 0,
            lng: sfdcDraft.Shipping_Address__r?.Address_Latitude_Longitude__Longitude__s || 0,
          },
          status: sfdcDraft.SBQQ__Status__c,
          siteComplete: sfdcDraft.Site_Complete__c || false,
          billingComplete: sfdcDraft.Billing_Complete__c || false,
          paymentMethodId: sfdcDraft.Payment_Method_Id__c || null,
          isCheckPaymentMethod: sfdcDraft.isCheckPaymentMethod__c,
          paymentMode: sfdcDraft.Payment_Mode__c || null,
          source: sfdcDraft.CreatedBy.Name === 'MyUSS System User' ? 'MyUSS' : 'Salesforce',
          createdDate: sfdcDraft.CreatedDate,
          startDate: sfdcDraft.SBQQ__StartDate__c,
          endDate: sfdcDraft.SBQQ__EndDate__c,
          expiryDate: sfdcDraft.SBQQ__ExpirationDate__c,
          quoteName: sfdcDraft.Quote_Name__c,
          currentStatus: this.getQuoteStatus(sfdcDraft, isQuotePresentInFirestore),
        };

        // For quotes created from Salesforce and paymentMethodId is present at Salesforce but not at Firestore
        const { source, paymentMethodId, firestorePaymentMethodId } = draftObject;
        if (source === 'Salesforce' && paymentMethodId && !firestorePaymentMethodId) {
          draftObject.firestorePaymentMethodId = draftObject.paymentMethodId;
          this.firestoreService.upsertDocument('quotes', draftObject.id, {
            paymentMethodId: draftObject.paymentMethodId,
            isAutoPay: draftObject.isAutoPay,
            quoteId: draftObject.id,
            accountId: accountIds[0],
          });
        }

        // Updating the final response
        const steps = {
          0: finalDraftsArray.quoteDetailsStep0,
          1: finalDraftsArray.unitServicesStep1,
          2: finalDraftsArray.viewQuoteStep2,
          3: finalDraftsArray.siteDetailsStep3,
          4: finalDraftsArray.billingPaymentDetailsStep4,
          5: finalDraftsArray.orderConfirmStep5,
          6: finalDraftsArray.rejectedStep6,
          7: finalDraftsArray.archivedStep7,
        };

        if (steps[draftObject.currentStatus]) {
          steps[draftObject.currentStatus].push(draftObject);
          finalDraftsArray.drafts.push(draftObject);
        }
      });

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

  // This function returns the current step for Draft
  public getQuoteStatus(sfdcDraft: SBQQ__Quote__c, isQuotePresentInFirestore: any): number {
    if (sfdcDraft.SBQQ__Status__c === 'Draft' && sfdcDraft.SBQQ__LineItemCount__c === 0) return 0;
    if (sfdcDraft.SBQQ__Status__c === 'Draft') return 1;
    if (sfdcDraft.SBQQ__Status__c === 'Presented') return 2;
    if (sfdcDraft.SBQQ__Status__c === 'Approved') {
      if (!sfdcDraft.Site_Complete__c && !sfdcDraft.Billing_Complete__c) return 3;
      if (
        (sfdcDraft.Site_Complete__c && !sfdcDraft.Billing_Complete__c) ||
        (sfdcDraft.Site_Complete__c && sfdcDraft.Billing_Complete__c && !isQuotePresentInFirestore) ||
        (isQuotePresentInFirestore?.isAutoPay && sfdcDraft.isCheckPaymentMethod__c) ||
        (!isQuotePresentInFirestore?.isAutoPay && !sfdcDraft.isCheckPaymentMethod__c)
      ) return 4;
      if (
        (sfdcDraft.Site_Complete__c && sfdcDraft.Billing_Complete__c) ||
        (isQuotePresentInFirestore?.paymentMethodId === sfdcDraft.Payment_Method_Id__c)
      ) return 5;
    }
    if (sfdcDraft.SBQQ__Status__c === 'Ordered') return 6;
    if (sfdcDraft.SBQQ__Status__c === 'Archived') return 7;
    if (sfdcDraft.SBQQ__Status__c === 'Rejected') return 8;
  }
}
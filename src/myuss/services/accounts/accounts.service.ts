import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { DraftModel } from '../../models/user.model';
import { SfdcQuoteService } from '../../../backend/sfdc/services/sfdc-quote/sfdc-quote.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { GetContactsRespDTO } from '../../controllers/accounts/dto/get-contacts-resp.dto';
import { Contact } from '../../../backend/sfdc/model/Contact';
import { ApiRespDTO } from '../../../common/dto/api-resp.dto';
import { FirestoreService } from '../../../backend/google/firestore/firestore.service';
import { Account } from '../../models/account.model';
import { SfdcAccountService } from '../../../backend/sfdc/services/sfdc-account/sfdc-account.service';
import { SFDC_AccountMapper } from '../../mappers/salesforce/account.mapper';
import { TrackActionsReqDTO } from '../../../myuss/controllers/accounts/dto/track-actions-req.dto';
import { TrackUserActionService } from '../../../core/track-user-action/track-user-action-service';
import { SfdcContactService } from '../../../backend/sfdc/services/sfdc-contact/sfdc-contact.service';
import { USF_Address__c } from '../../../backend/sfdc/model/USF_Address__c';
import { SfdcAddressService } from '../../../backend/sfdc/services/sfdc-address/sfdc-address.service';
import { SFDC_ProjectMapper } from '../../../myuss/mappers/salesforce/project.mapper';
import { SBQQ__Quote__c } from '../../../backend/sfdc/model/SBQQ__Quote__c';
import { GetAllDraftsDTO } from '../../../myuss/controllers/accounts/dto/get-drafts-resp.dto';
import { AccountsServiceV2 } from '../../../myuss/v2/services/accounts/accounts.service';

@Injectable()
export class AccountsService {
  constructor(
    private sfdcAccountService: SfdcAccountService,
    private sfdcContactService: SfdcContactService,
    private sfdcQuoteService: SfdcQuoteService,
    private sfdcAddressService: SfdcAddressService,
    private logger: LoggerService,
    private firestoreService: FirestoreService,
    private trackUserActionService: TrackUserActionService,
    private accountsServiceV2: AccountsServiceV2
  ) {}

  updateBillingAddress(id: string, body: any): void {
    throw new Error('Method not implemented.');
  }

  async getAccount(id: string): Promise<Account> {
    const sfdcAccount = await this.sfdcAccountService.getAccount(id);
    if (!sfdcAccount) {
      throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
    }
    return SFDC_AccountMapper.getMyUSSAccountFromSFDCAccount(sfdcAccount);
  }

  async getContacts(accountId: string): Promise<ApiRespDTO<GetContactsRespDTO[]>> {
    const contactsResp: Contact[] = await this.sfdcContactService.getContactsForAccount(accountId);
    let getContactsResult: ApiRespDTO<GetContactsRespDTO[]> = {
      success: true,
      status: 1000,
      message: contactsResp.length === 0 ? 'Contacts not found' : 'Success',
      data: []
    };

    if (contactsResp.length === 0) {
      return getContactsResult;
    }

    const contactList: GetContactsRespDTO[] = contactsResp.map(contact => ({
      recordId: contact.Id,
      accountId: contact.AccountId,
      contactId: contact.ContactId,
      firstName: contact['Contact'].FirstName,
      lastName: contact['Contact'].LastName,
      email: contact['Contact'].Email,
      phone: contact['Contact'].Phone,
    }));

    return { ...getContactsResult, data: contactList };
  }

  async checkDuplicateAddress(accountId: string, enteredAddress: string) {
    try {
      const existingAddresses: USF_Address__c[] = await this.sfdcAddressService.getAddressesByAddressValue(accountId, enteredAddress);
      const addressInfo = existingAddresses.length > 0 ? existingAddresses[0] : {};
      return {
        isDuplicate: existingAddresses.length > 0,
        addressInfo: {
          addressId: addressInfo.Id || '',
          street: addressInfo.USF_Street__c || '',
          account: addressInfo.USF_Account__c || '',
          city: addressInfo.USF_City__c || '',
          state: addressInfo.USF_State__c || '',
          zipcode: addressInfo.USF_Zip_Code__c || '',
          latitude: addressInfo.Address_Latitude_Longitude__Latitude__s || 0,
          longitude: addressInfo.Address_Latitude_Longitude__Longitude__s || 0,
          serviceable: addressInfo.USF_Ship_To_Address__c || false,
        },
      };
    } catch (error) {
      throw new HttpException('Error checking duplicate address', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async fetchDrafts(accountIds: string[], projectId: string, status: string): Promise<ApiRespDTO<GetAllDraftsDTO | []>> {
    try {
      const [draftsResp, quotesDocsFromFirestore] = await Promise.all([
        this.sfdcQuoteService.fetchDrafts(accountIds, projectId, status),
        this.firestoreService.getCollectionDocsByFieldName('quotes', 'accountId', accountIds[0]),
      ]);

      if (!draftsResp) {
        return { status: 1041, message: 'Error while fetching quotes', data: [] };
      }

      if (draftsResp.length === 0) {
        return { status: 1000, message: 'Success', data: [] };
      }

      const quoteDocuments = quotesDocsFromFirestore.map(doc => doc.data());
      const draftsArr: DraftModel[] = draftsResp.map(draftObj => {
        const paymentMethodDocument = quoteDocuments.find(quote => quote.quoteId === draftObj.Id);
        const draft: DraftModel = {
          projectDetails: draftObj.SBQQ__Opportunity2__r.USF_Project__r 
            ? SFDC_ProjectMapper.getMyUSSProjectFromSFDCProject(draftObj.SBQQ__Opportunity2__r.USF_Project__r, [], accountIds[0]) 
            : null,
          firestorePaymentMethodId: paymentMethodDocument?.paymentMethodId || '',
          isAutoPay: paymentMethodDocument?.isAutoPay || true,
          id: draftObj.Id,
          lastModifiedDate: draftObj.LastModifiedDate,
          name: draftObj.Name,
          shippingAddress: draftObj.Shipping_Address__r?.Name || '',
          zipcode: draftObj.Serviceable_Zip_Code__r?.Zip_Code__c || '',
          billAddress: {
            lat: draftObj.Bill_To_Address__r?.Address_Latitude_Longitude__Latitude__s || 0,
            lng: draftObj.Bill_To_Address__r?.Address_Latitude_Longitude__Longitude__s || 0,
          },
          shipAddress: {
            lat: draftObj.Shipping_Address__r?.Address_Latitude_Longitude__Latitude__s || 0,
            lng: draftObj.Shipping_Address__r?.Address_Latitude_Longitude__Longitude__s || 0,
          },
          currentStatus: 0,
          status: draftObj.SBQQ__Status__c,
          siteComplete: draftObj.Site_Complete__c || false,
          billingComplete: draftObj.Billing_Complete__c || false,
          paymentMethodId: draftObj.Payment_Method_Id__c || null,
          isCheckPaymentMethod: draftObj.isCheckPaymentMethod__c,
          paymentMode: draftObj.Payment_Mode__c || null,
          source: draftObj.CreatedBy.Name === 'MyUSS System User' ? 'MyUSS' : 'Salesforce',
          createdDate: draftObj.CreatedDate,
          startDate: draftObj.SBQQ__StartDate__c,
          endDate: draftObj.SBQQ__EndDate__c,
          expiryDate: draftObj.SBQQ__ExpirationDate__c,
          quoteName: draftObj.Quote_Name__c,
        };

        if (draft.source === 'Salesforce' && draft.paymentMethodId && !draft.firestorePaymentMethodId) {
          draft.firestorePaymentMethodId = draft.paymentMethodId;
          this.firestoreService.upsertDocument('quotes', draft.id, {
            paymentMethodId: draft.paymentMethodId,
            isAutoPay: draft.isAutoPay,
            quoteId: draft.id,
            accountId: accountIds[0],
          });
        }

        return draft;
      });

      const filteredDrafts = draftsArr.reduce((acc, draft) => {
        acc[draft.status] = acc[draft.status] || [];
        acc[draft.status].push(draft);
        return acc;
      }, {} as Record<string, DraftModel[]>);

      const draftRespObj = {
        unitServicesStep1: filteredDrafts.Draft?.map(draft => ({ ...draft, currentStatus: 1 })) || [],
        viewQuoteStep2: filteredDrafts.Presented?.map(draft => ({ ...draft, currentStatus: 2 })) || [],
        siteDetailsStep3: filteredDrafts.Approved?.filter(draft => !draft.siteComplete && !draft.billingComplete).map(draft => ({ ...draft, currentStatus: 3 })) || [],
        billingPaymentDetailsStep4: filteredDrafts.Approved?.filter(draft => 
          ((draft.paymentMethodId == null && draft.isAutoPay) ||
          (draft.paymentMethodId != null && !draft.isAutoPay)) &&
          draft.siteComplete && 
          draft.firestorePaymentMethodId === '') || 
          (draft.isAutoPay && draft.paymentMethodId != null && draft.firestorePaymentMethodId === '')
        ).map(draft => ({ ...draft, currentStatus: 4 })) || [],
        orderConfirmStep5: filteredDrafts.Approved?.filter(draft => 
          ((draft.firestorePaymentMethodId === '' && !draft.isAutoPay) ||
          (draft.firestorePaymentMethodId !== '' && draft.isAutoPay)) &&
          draft.siteComplete && 
          draft.billingComplete
        ).map(draft => ({ ...draft, currentStatus: 5 })) || [],
        drafts: [],
      };

      draftRespObj.drafts = [
        ...draftRespObj.unitServicesStep1,
        ...draftRespObj.viewQuoteStep2,
        ...draftRespObj.siteDetailsStep3,
        ...draftRespObj.billingPaymentDetailsStep4,
        ...draftRespObj.orderConfirmStep5,
      ].sort((a, b) => new Date(b.lastModifiedDate).getTime() - new Date(a.lastModifiedDate).getTime());

      return { status: 1000, message: 'Success', data: draftRespObj };
    } catch (err) {
      this.logger.error(err);
      return { status: 1041, message: 'Error while fetching quotes', data: [] };
    }
  }

  async fetchArchivedDrafts(accountIds: string[], projectId: string): Promise<object> {
    const draftsResp: Partial<SBQQ__Quote__c>[] = await this.sfdcQuoteService.fetchArchivedDrafts(accountIds, projectId);
    this.logger.info(`draftsRespInArchived: ${JSON.stringify(draftsResp)}`);
    if (!draftsResp) {
      return { status: 1014, message: 'Error in fetching archived drafts' };
    }
    if (draftsResp.length === 0) {
      return { status: 1000, message: 'Success', data: [] };
    }

    const draftsArr: DraftModel[] = await Promise.all(draftsResp.map(async draftObj => {
      const paymentMethodIdFromFirestore = await this.firestoreService.getDocument('quotes', draftObj.Id);
      return {
        projectDetails: draftObj.SBQQ__Opportunity2__r.USF_Project__r
          ? SFDC_ProjectMapper.getMyUSSProjectFromSFDCProject(draftObj.SBQQ__Opportunity2__r.USF_Project__r, [], accountIds[0])
          : null,
        firestorePaymentMethodId: paymentMethodIdFromFirestore?.paymentMethodId || '',
        isAutoPay: paymentMethodIdFromFirestore?.isAutoPay || true,
        id: draftObj.Id,
        lastModifiedDate: draftObj.LastModifiedDate,
        name: draftObj.Name,
        shippingAddress: draftObj.Shipping_Address__r?.Name || '',
        zipcode: draftObj.Serviceable_Zip_Code__r?.Zip_Code__c || '',
        billAddress: {
          lat: draftObj.Bill_To_Address__r?.Address_Latitude_Longitude__Latitude__s || 0,
          lng: draftObj.Bill_To_Address__r?.Address_Latitude_Longitude__Longitude__s || 0,
        },
        shipAddress: {
          lat: draftObj.Shipping_Address__r?.Address_Latitude_Longitude__Latitude__s || 0,
          lng: draftObj.Shipping_Address__r?.Address_Latitude_Longitude__Longitude__s || 0,
        },
        currentStatus: 0,
        status: draftObj.SBQQ__Status__c,
        siteComplete: draftObj.Site_Complete__c || false,
        billingComplete: draftObj.Billing_Complete__c || false,
        paymentMethodId: draftObj.Payment_Method_Id__c || null,
        isCheckPaymentMethod: draftObj.isCheckPaymentMethod__c,
      };
    }));
    
    return {
      status: 1000,
      message: 'Success',
      data: draftsArr,
    };
  }

  async fetchSuspendedDrafts(accountIds: string[]): Promise<object> {
    const draftsResp = await this.sfdcQuoteService.fetchSuspendedDrafts(accountIds);
    if (!draftsResp) {
      return { status: 500, message: 'Something went wrong' };
    }
    if (draftsResp['records'].length === 0) {
      return { status: HttpStatus.NOT_FOUND, message: 'Drafts not found' };
    }

    const draftsArr: DraftModel[] = await Promise.all(draftsResp['records'].map(async draftObj => {
      const paymentMethodIdFromFirestore = await this.firestoreService.getDocument('quotes', draftObj.Id);
      return {
        firestorePaymentMethodId: paymentMethodIdFromFirestore?.paymentMethodId || '',
        isAutoPay: paymentMethodIdFromFirestore?.isAutoPay || true,
        id: draftObj.Id,
        lastModifiedDate: draftObj.LastModifiedDate,
        name: draftObj.Name,
        shippingAddress: draftObj.Shipping_Address__r?.Name || '',
        zipcode: draftObj.Serviceable_Zip_Code__r?.Zip_Code__c || '',
        billAddress: {
          lat: draftObj.Bill_To_Address__r?.Address_Latitude_Longitude__Latitude__s || 0,
          lng: draftObj.Bill_To_Address__r?.Address_Latitude_Longitude__Longitude__s || 0,
        },
        shipAddress: {
          lat: draftObj.Shipping_Address__r?.Address_Latitude_Longitude__Latitude__s || 0,
          lng: draftObj.Shipping_Address__r?.Address_Latitude_Longitude__Longitude__s || 0,
        },
        currentStatus: 0,
        status: draftObj.SBQQ__Status__c,
        siteComplete: draftObj.Site_Complete__c || false,
        billingComplete: draftObj.Billing_Complete__c || false,
        paymentMethodId: draftObj.Payment_Method_Id__c || null,
        isCheckPaymentMethod: draftObj.isCheckPaymentMethod__c,
      };
    }));

    return {
      status: 200,
      message: 'Success',
      data: draftsArr,
    };
  }

  async trackUserActions(trackActionsReqDTO: TrackActionsReqDTO, accountId: string, auth0Id: string): Promise<ApiRespDTO<any[]>> {
    await this.trackUserActionService.setPortalActions(
      accountId,
      auth0Id,
      trackActionsReqDTO.screenName,
      trackActionsReqDTO.userAction,
      trackActionsReqDTO.quoteId,
      trackActionsReqDTO.contractId,
    );
    return { success: true, status: 1000, message: 'Success', data: [] };
  }

  async checkQuoteIdInAccount(accountId: string, quoteId: string): Promise<boolean> {
    return await this.sfdcQuoteService.checkQuoteIdInAccount(accountId, quoteId);
  }

  async fetchAccountNumber(accountId: string): Promise<string> {
    return await this.sfdcAccountService.getAccountNumberByUSSAccountId(accountId);
  }

  async checkContractIdInAccount(accountId: string, contractId: string): Promise<boolean> {
    return await this.sfdcAccountService.checkContractIdInAccount(accountId, contractId);
  }

  async fetchAllDashboardDetails(accountId: string): Promise<ApiRespDTO<object>> {
    const dashboardDetailsResp = await this.sfdcAccountService.fetchAllDashboardDetails(accountId);
    if (dashboardDetailsResp) {
      return {
        success: true,
        status: 1000,
        message: 'Success',
        data: dashboardDetailsResp,
      };
    } else {
      return {
        success: false,
        status: 1025,
        message: 'Fail',
        data: {},
      };
    }
  }

  async fetchProjectQuotes(accountId: string, projectId: string, status: string): Promise<ApiRespDTO<object>> {
    return await this.accountsServiceV2.fetchDraftsV2([accountId], projectId, status);
  }
}
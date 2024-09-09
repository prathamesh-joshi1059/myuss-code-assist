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

  updateBillingAddress(id: string, body: any) {
    throw new Error('Method not implemented.');
  }

  async getAccount(id: string): Promise<Account> {
    const sfdcAccount = await this.sfdcAccountService.getAccount(id);
    if (sfdcAccount == undefined) {
      throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
    }
    const account = SFDC_AccountMapper.getMyUSSAccountFromSFDCAccount(sfdcAccount);
    return account;
  }

  async getContacts(accountId: string): Promise<ApiRespDTO<GetContactsRespDTO[]>> {
    let contactsResp: Contact[] = await this.sfdcContactService.getContactsForAccount(accountId);
    let getContactsResult = new ApiRespDTO<GetContactsRespDTO[]>();
    if (contactsResp?.length == 0) {
      getContactsResult = {
        success: true,
        status: 1000,
        message: 'Contacts not found',
        data: [],
      };
      return getContactsResult;
    }
    if (contactsResp == undefined) {
      getContactsResult = {
        success: false,
        status: 1006,
        message: 'Something went wrong',
        data: [],
      };
      return getContactsResult;
    }
    let contactList: GetContactsRespDTO[] = [];
    contactsResp.map((contact: Contact) => {
      try {
        let contactObj: GetContactsRespDTO = {
          recordId: contact.Id,
          accountId: contact.AccountId,
          contactId: contact.ContactId,
          firstName: contact['Contact'].FirstName,
          lastName: contact['Contact'].LastName,
          email: contact['Contact'].Email,
          phone: contact['Contact'].Phone,
        };
        contactList.push(contactObj);
      } catch (err) {
        this.logger.error(err);
      }
    });

    getContactsResult = {
      success: true,
      status: 1000,
      message: 'Success',
      data: contactList,
    };
    return getContactsResult;
  }

  async checkDuplicateAddress(accountId: string, enteredAddress: string) {
    try {
      // Assuming you have a method to check duplicate addresses
      const existingAddresses: USF_Address__c[] = await this.sfdcAddressService.getAddressesByAddressValue(
        accountId,
        enteredAddress,
      );

      // If the array has any existing addresses, then it's a duplicate
      const existingAddressesData = {
        isDuplicate: existingAddresses.length > 0,
        addressInfo: {
          addressId: existingAddresses.length > 0 ? existingAddresses[0].Id : '',
          street: existingAddresses.length > 0 ? existingAddresses[0].USF_Street__c : '',
          account: existingAddresses.length > 0 ? existingAddresses[0].USF_Account__c : '',
          city: existingAddresses.length > 0 ? existingAddresses[0].USF_City__c : '',
          state: existingAddresses.length > 0 ? existingAddresses[0].USF_State__c : '',
          zipcode: existingAddresses.length > 0 ? existingAddresses[0].USF_Zip_Code__c : '',
          latitude: existingAddresses.length > 0 ? existingAddresses[0].Address_Latitude_Longitude__Latitude__s : 0,
          longitude: existingAddresses.length > 0 ? existingAddresses[0].Address_Latitude_Longitude__Longitude__s : 0,
          serviceable: existingAddresses.length > 0 ? existingAddresses[0].USF_Ship_To_Address__c : false,
        },
      };
      return existingAddressesData;
    } catch (error) {
      // Handle errors accordingly
      throw new HttpException('Error checking duplicate address', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  //fetch drafts for Account - all/by projectId
  async fetchDrafts(
    accountIds: string[],
    projectId: string,
    status: string,
  ): Promise<ApiRespDTO<GetAllDraftsDTO | []>> {
    try {
      const draftsResp = this.sfdcQuoteService.fetchDrafts(accountIds, projectId, status);
      const quotesDocsFromFirestore = this.firestoreService.getCollectionDocsByFieldName(
        'quotes',
        'accountId',
        accountIds[0],
      );
      const draftResp = await Promise.all([draftsResp, quotesDocsFromFirestore]);
      if (!draftResp) {
        return { status: 1041, message: 'Error while fetching quotes', data: [] };
      }
      if (draftResp[0].length == 0) {
        return { status: 1000, message: 'Success', data: [] };
      }
      let quoteDocument = [];
      if (draftResp[1].length > 0) {
        quoteDocument = draftResp[1].map((doc) => doc.data());
      }
      var firecount = 0;
      let draftsArr: DraftModel[] = [];
      draftResp[0]?.map((draftObj: SBQQ__Quote__c) => {
        const getPaymentMethodIdFromFirestore = quoteDocument.filter((quote) => quote.quoteId == draftObj.Id);
        let draft: DraftModel = {
          projectDetails: draftObj.SBQQ__Opportunity2__r.USF_Project__r
            ? SFDC_ProjectMapper.getMyUSSProjectFromSFDCProject(
                draftObj.SBQQ__Opportunity2__r.USF_Project__r,
                [],
                accountIds[0],
              )
            : null,
          firestorePaymentMethodId: getPaymentMethodIdFromFirestore[0]
            ? getPaymentMethodIdFromFirestore[0].paymentMethodId
            : '',
          isAutoPay: getPaymentMethodIdFromFirestore[0] ? getPaymentMethodIdFromFirestore[0].isAutoPay : true,
          id: draftObj.Id,
          lastModifiedDate: draftObj.LastModifiedDate,
          name: draftObj.Name,
          shippingAddress: draftObj.Shipping_Address__r ? draftObj.Shipping_Address__r.Name : '',
          zipcode: draftObj.Serviceable_Zip_Code__r ? draftObj.Serviceable_Zip_Code__r.Zip_Code__c : '',
          billAddress: {
            lat: draftObj.Bill_To_Address__r ? draftObj.Bill_To_Address__r.Address_Latitude_Longitude__Latitude__s : 0,
            lng: draftObj.Bill_To_Address__r ? draftObj.Bill_To_Address__r.Address_Latitude_Longitude__Longitude__s : 0,
          },
          shipAddress: {
            lat: draftObj.Shipping_Address__r
              ? draftObj.Shipping_Address__r.Address_Latitude_Longitude__Latitude__s
              : 0,
            lng: draftObj.Shipping_Address__r
              ? draftObj.Shipping_Address__r.Address_Latitude_Longitude__Longitude__s
              : 0,
          },
          currentStatus: 0,
          status: draftObj.SBQQ__Status__c,
          siteComplete: draftObj.Site_Complete__c ? draftObj.Site_Complete__c : false,
          billingComplete: draftObj.Billing_Complete__c ? draftObj.Billing_Complete__c : false,
          paymentMethodId: draftObj.Payment_Method_Id__c ? draftObj.Payment_Method_Id__c : null,
          isCheckPaymentMethod: draftObj.isCheckPaymentMethod__c,
          paymentMode: draftObj.Payment_Mode__c ? draftObj.Payment_Mode__c : null,
          source: draftObj.CreatedBy.Name == 'MyUSS System User' ? 'MyUSS' : 'Salesforce',
          createdDate: draftObj.CreatedDate,
          startDate: draftObj.SBQQ__StartDate__c,
          endDate: draftObj.SBQQ__EndDate__c,
          expiryDate: draftObj.SBQQ__ExpirationDate__c,
          quoteName: draftObj.Quote_Name__c
        };
        //For quotes created from saleforce and paymentMethodId is present in saleforce but not in firestore
        if (draft.source == 'Salesforce' && draft.paymentMethodId && !draft.firestorePaymentMethodId) {
          draft.firestorePaymentMethodId = draft.paymentMethodId;
          //save paymentMethodId in firestore
          this.firestoreService.upsertDocument('quotes', draft.id, {
            paymentMethodId: draft.paymentMethodId,
            isAutoPay: draft.isAutoPay,
            quoteId: draft.id,
            accountId: accountIds[0],
          });
        }
        draftsArr.push(draft);
      });

      //filter drafts based on status
      let filterdDrafts = draftsArr.reduce(function (r, a) {
        r[a.status] = r[a.status] || [];
        r[a.status].push(a);
        return r;
      }, Object.create(null));

      let draftRespObj = {
        unitServicesStep1: filterdDrafts.Draft
          ? filterdDrafts.Draft.map((draftObj: DraftModel) => ({
              ...draftObj,
              currentStatus: 1,
            }))
          : [],
        viewQuoteStep2: filterdDrafts.Presented
          ? filterdDrafts.Presented.map((draftObj: DraftModel) => ({
              ...draftObj,
              currentStatus: 2,
            }))
          : [],
        siteDetailsStep3: filterdDrafts.Approved
          ? filterdDrafts.Approved.filter(
              (draft: DraftModel) => draft.siteComplete == false && draft.billingComplete == false,
            ).map((draftObj: DraftModel) => ({ ...draftObj, currentStatus: 3 }))
          : [],
        // when quote is created from MyUSS, default value of paymentMode is creditDebit
        // and default value of createdby name is MyUSS System User.
        // When created from saleforce default value of paymentMode is null
        billingPaymentDetailsStep4: filterdDrafts.Approved
          ? filterdDrafts.Approved.filter(
              (draft: DraftModel) =>
                (((draft.paymentMethodId == null && draft.isAutoPay == true) ||
                  (draft.paymentMethodId != null && draft.isAutoPay == false)) &&
                  draft.siteComplete == true &&
                  draft.firestorePaymentMethodId == '') ||
                (draft.isAutoPay == true && draft.paymentMethodId != null && draft.firestorePaymentMethodId == ''),
            ).map((draftObj: DraftModel) => ({ ...draftObj, currentStatus: 4 }))
          : [],
        orderConfirmStep5: filterdDrafts.Approved
          ? filterdDrafts.Approved.filter(
              (draft: DraftModel) =>
                ((draft.firestorePaymentMethodId == '' && draft.isAutoPay == false) ||
                  (draft.firestorePaymentMethodId != '' && draft.isAutoPay == true)) &&
                draft.siteComplete == true &&
                draft.billingComplete == true,
            ).map((draft: DraftModel) => ({ ...draft, currentStatus: 5 }))
          : [],
        drafts: [],
      };
      draftRespObj.drafts = draftRespObj.unitServicesStep1.concat(
        draftRespObj.viewQuoteStep2,
        draftRespObj.siteDetailsStep3,
        draftRespObj.billingPaymentDetailsStep4,
        draftRespObj.orderConfirmStep5,
      );
      draftRespObj.drafts.sort(function (a, b) {
        return new Date(b.lastModifiedDate).getTime() - new Date(a.lastModifiedDate).getTime();
      });
      const draftResponse = {
        status: 1000,
        message: 'Success',
        data: draftRespObj,
      };
      return draftResponse;
    } catch (err) {
      this.logger.error(err);
      return { status: 1041, message: 'Error while fetching quotes', data: [] };
    }
  }

  async fetchArchivedDrafts(accountIds: string[], projectId: string): Promise<object> {
    const draftsResp: Partial<SBQQ__Quote__c>[] = await this.sfdcQuoteService.fetchArchivedDrafts(
      accountIds,
      projectId,
    );
    this.logger.info(`draftsRespInArchived: ${JSON.stringify(draftsResp)}`);
    if (!draftsResp) {
      return { status: 1014, message: 'Error in fetching archived drafts' };
    }
    if (draftsResp.length == 0) {
      return { status: 1000, message: 'Success', data: [] };
    }

    let draftsArr: DraftModel[] = [];
    for (let draftObj of draftsResp) {
      const getPaymentMethodIdFromFirestore = await this.firestoreService.getDocument('quotes', draftObj.Id);

      let draft: DraftModel = {
        projectDetails: draftObj.SBQQ__Opportunity2__r.USF_Project__r
          ? SFDC_ProjectMapper.getMyUSSProjectFromSFDCProject(
              draftObj.SBQQ__Opportunity2__r.USF_Project__r,
              [],
              accountIds[0],
            )
          : null,
        firestorePaymentMethodId: getPaymentMethodIdFromFirestore
          ? getPaymentMethodIdFromFirestore.paymentMethodId
          : '',
        isAutoPay: getPaymentMethodIdFromFirestore ? getPaymentMethodIdFromFirestore.isAutoPay : true,
        id: draftObj.Id,
        lastModifiedDate: draftObj.LastModifiedDate,
        name: draftObj.Name,
        shippingAddress: draftObj.Shipping_Address__r ? draftObj.Shipping_Address__r.Name : '',
        zipcode: draftObj.Serviceable_Zip_Code__r ? draftObj.Serviceable_Zip_Code__r.Zip_Code__c : '',
        billAddress: {
          lat: draftObj.Bill_To_Address__r ? draftObj.Bill_To_Address__r.Address_Latitude_Longitude__Latitude__s : 0,
          lng: draftObj.Bill_To_Address__r ? draftObj.Bill_To_Address__r.Address_Latitude_Longitude__Longitude__s : 0,
        },
        shipAddress: {
          lat: draftObj.Shipping_Address__r ? draftObj.Shipping_Address__r.Address_Latitude_Longitude__Latitude__s : 0,
          lng: draftObj.Shipping_Address__r ? draftObj.Shipping_Address__r.Address_Latitude_Longitude__Longitude__s : 0,
        },
        currentStatus: 0,
        status: draftObj.SBQQ__Status__c,
        siteComplete: draftObj.Site_Complete__c,
        billingComplete: draftObj.Billing_Complete__c,
        paymentMethodId: draftObj.Payment_Method_Id__c,
        isCheckPaymentMethod: draftObj.isCheckPaymentMethod__c,
      };
      draftsArr.push(draft);
    }
    const draftObj = {
      status: 1000,
      message: 'Success',
      data: draftsArr,
    };
    return draftObj;
  }

  async fetchSuspendedDrafts(accountIds: string[]): Promise<object> {
    const draftsResp = await this.sfdcQuoteService.fetchSuspendedDrafts(accountIds);
    if (draftsResp == undefined) {
      return { status: 500, message: 'Something went wrong' };
    }
    if (draftsResp['records'].length == 0) {
      return { status: HttpStatus.NOT_FOUND, message: 'Drafts not found' };
    }

    let draftsArr: DraftModel[] = [];
    for (const draftObj of draftsResp['records']) {
      const getPaymentMethodIdFromFirestore = await this.firestoreService.getDocument('quotes', draftObj.Id);

      let draft: DraftModel = {
        firestorePaymentMethodId: getPaymentMethodIdFromFirestore
          ? getPaymentMethodIdFromFirestore.paymentMethodId
          : '',
        isAutoPay: getPaymentMethodIdFromFirestore ? getPaymentMethodIdFromFirestore.isAutoPay : true,
        id: draftObj.Id,
        lastModifiedDate: draftObj.LastModifiedDate,
        name: draftObj.Name,
        shippingAddress: draftObj.Shipping_Address__r ? draftObj.Shipping_Address__r.Name : '',
        zipcode: draftObj.Serviceable_Zip_Code__r ? draftObj.Serviceable_Zip_Code__r.Zip_Code__c : '',
        billAddress: {
          lat: draftObj.Bill_To_Address__r ? draftObj.Bill_To_Address__r.Address_Latitude_Longitude__Latitude__s : 0,
          lng: draftObj.Bill_To_Address__r ? draftObj.Bill_To_Address__r.Address_Latitude_Longitude__Longitude__s : 0,
        },
        shipAddress: {
          lat: draftObj.Shipping_Address__r ? draftObj.Shipping_Address__r.Address_Latitude_Longitude__Latitude__s : 0,
          lng: draftObj.Shipping_Address__r ? draftObj.Shipping_Address__r.Address_Latitude_Longitude__Longitude__s : 0,
        },
        currentStatus: 0,
        status: draftObj.SBQQ__Status__c,
        siteComplete: draftObj.Site_Complete__c,
        billingComplete: draftObj.Billing_Complete__c,
        paymentMethodId: draftObj.Payment_Method_Id__c,
        isCheckPaymentMethod: draftObj.isCheckPaymentMethod__c,
      };
      draftsArr.push(draft);
    }
    const draftObj = {
      status: 200,
      message: 'Success',
      data: draftsArr,
    };
    return draftObj;
  }

  async trackUserActions(
    trackActionsReqDTO: TrackActionsReqDTO,
    accountId: string,
    auth0Id: string,
  ): Promise<ApiRespDTO<any[]>> {
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
  //check quoteId is present in account or not
  async checkQuoteIdInAccount(accountId, quoteId) {
    return await this.sfdcQuoteService.checkQuoteIdInAccount(accountId, quoteId);
  }
  async fetchAccountNumber(accountId) {
    return await this.sfdcAccountService.getAccountNumberByUSSAccountId(accountId);
  }
  async checkContractIdInAccount(accountId, contractId) {
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
    // console.log("CALLING FETCH PROJECTS...")
    return await this.accountsServiceV2.fetchDraftsV2([accountId],projectId,status)
  }

}

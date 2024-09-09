import { AccountContactRelation } from '../../../backend/sfdc/model/AccountContactRelation';
import { USS_Portal_User__c } from '../../../backend/sfdc/model/USS_Portal_User__c';
import { AccountContactRelationModel, AccountDetails, UserDetails } from '../../../myuss/models';
import { Contact } from '../../../backend/sfdc/model/Contact';
import {GeneralUtils} from '../../../core/utils/general.utils';


export class SFDC_USSPortalUserMapper {
  static ENFORCE_RBAC = process.env.ENFORCE_RBAC;
  static getMyUSSUserPortalUserFromSFDCUSSPortalUser(sfdcUssPortalUser: USS_Portal_User__c): UserDetails {
    this.ENFORCE_RBAC=process.env.ENFORCE_RBAC
    let ussPortalUser = new UserDetails();
    if (sfdcUssPortalUser?.Contacts__r == null) {
      return ussPortalUser;
    }
    ussPortalUser.ussPortalUserId = sfdcUssPortalUser?.Id;
    ussPortalUser.enforceRBAC = this.ENFORCE_RBAC === "true"?true:false;
    ussPortalUser.email = sfdcUssPortalUser?.Contacts__r[0]?.Email;
    ussPortalUser.firstName = sfdcUssPortalUser?.Contacts__r[0]?.FirstName;
    ussPortalUser.lastName = sfdcUssPortalUser?.Contacts__r[0]?.LastName;
    ussPortalUser.phone = sfdcUssPortalUser?.Contacts__r[0]?.Phone;
    ussPortalUser.id = sfdcUssPortalUser?.Contacts__r[0]?.Id;
    ussPortalUser.accountId = sfdcUssPortalUser?.Contacts__r[0]?.AccountId;
    ussPortalUser.accountName = sfdcUssPortalUser?.Contacts__r[0]?.AccountContactRelations[0]?.Account.Name;
    ussPortalUser.autoPayRequirement =
      sfdcUssPortalUser?.Contacts__r[0]?.AccountContactRelations[0]?.Account.Auto_Pay_Requirement__c;
    ussPortalUser.businessType =
      sfdcUssPortalUser?.Contacts__r[0]?.AccountContactRelations[0]?.Account?.Business_Type__c;
    ussPortalUser.customerType =
      sfdcUssPortalUser?.Contacts__r[0]?.AccountContactRelations[0]?.Account?.Customer_Segment__c;
    ussPortalUser.contactId = sfdcUssPortalUser?.Contacts__r[0]?.AccountContactRelations[0]?.ContactId;
    ussPortalUser.accountNumber =
      sfdcUssPortalUser?.Contacts__r[0]?.AccountContactRelations[0]?.Account?.USF_Account_Number__c;
    (ussPortalUser.accounts = sfdcUssPortalUser?.Contacts__r?.map((contact: Contact) => {
      return this.getMyussContactFromSFDCConatact(contact);
    })),
    ussPortalUser.poRequired = sfdcUssPortalUser?.Contacts__r[0]?.AccountContactRelations[0]?.Account?.PO_Required__c;
    ussPortalUser.accountPaymentStatus =
      sfdcUssPortalUser?.Contacts__r[0]?.AccountContactRelations[0]?.Account?.Account_Payment_Status__c;
      ussPortalUser.myussUserRole =this.ENFORCE_RBAC=="true"? sfdcUssPortalUser?.Contacts__r[0]?.AccountContactRelations[0]?.MyUSS_User_Role__c:"Account Admin";
      ussPortalUser.myussModules = this.assignMyussModules( sfdcUssPortalUser?.Contacts__r[0]?.AccountContactRelations[0]);
      ussPortalUser.myussBypassTermsAndConditions = sfdcUssPortalUser?.Contacts__r[0]?.AccountContactRelations[0]?.Account?.MyUSS_Bypass_Terms_and_Conditions__c;
    return ussPortalUser;
  }

  static getMyussContactFromSFDCConatact(sfdcContact: Contact) {
    let contact: AccountDetails = {
      contactId: sfdcContact.Id,
      firstName: sfdcContact.FirstName,
      lastName: sfdcContact.LastName,
      phone: sfdcContact.Phone,
      email: sfdcContact.Email,
      accountId: sfdcContact.AccountId,
      ...sfdcContact.AccountContactRelations?.map((accountContactRelation: AccountContactRelation) => {
        return this.getMyussAccountFromSFDCAccountContactRelation(accountContactRelation);
      })[0],
    };
    return contact;
  }

  static getMyussAccountFromSFDCAccountContactRelation(
    sfdcAccountContactRelation: AccountContactRelation,
  ): AccountDetails {
    let account = new AccountDetails();

    account.accountName = sfdcAccountContactRelation.Account.Name;
    account.accountNumber = sfdcAccountContactRelation.Account.USF_Account_Number__c;
    account.autoPayRequirement = sfdcAccountContactRelation.Account.Auto_Pay_Requirement__c;
    account.businessType = sfdcAccountContactRelation.Account.Business_Type__c;
    account.customerType = sfdcAccountContactRelation.Account.Customer_Segment__c;
    account.emailForCC = [
      sfdcAccountContactRelation.Account.Bill_to_Email_Address_1__c,
      sfdcAccountContactRelation.Account.Bill_to_Email_Address_2__c,
      sfdcAccountContactRelation.Account.Bill_to_Email_Address_3__c,
      sfdcAccountContactRelation.Account.Bill_to_Email_Address_4__c,
      sfdcAccountContactRelation.Account.Bill_to_Email_Address_5__c,
      sfdcAccountContactRelation.Account.Bill_to_Email_Address_6__c,
    ].filter((email) => email != null);
    account.myussUserRole = this.ENFORCE_RBAC=="true"? sfdcAccountContactRelation?.MyUSS_User_Role__c:"Account Admin";
    account.myussModules = this.assignMyussModules(sfdcAccountContactRelation) ;
    account.poRequired = sfdcAccountContactRelation.Account.PO_Required__c;
    account.accountPaymentStatus = sfdcAccountContactRelation.Account.Account_Payment_Status__c;
    account.myussBypassTermsAndConditions = sfdcAccountContactRelation.Account?.MyUSS_Bypass_Terms_and_Conditions__c;
    return account;
  }

  static assignMyussModules(sfdcAccountContactRelation:AccountContactRelation):Record<string, boolean>{
    if(this.ENFORCE_RBAC==='true'){
      const userModules=GeneralUtils.convertStringToObject(sfdcAccountContactRelation?.MyUSS_Modules__c)
     return GeneralUtils.getMatchingTrueFields(userModules,this.getAccountLevelModules(sfdcAccountContactRelation))
    }else{
      return this.getAccountLevelModules(sfdcAccountContactRelation)
    }

  }

 static getAccountLevelModules(sfdcAccountContactRelation:AccountContactRelation):Record<string, boolean>{
    return{
      myussEnabled : sfdcAccountContactRelation.Account.MyUSS_Enabled__c,
      myussQuotesEnabled : sfdcAccountContactRelation.Account.MyUSS_Quotes_Enabled__c,
      myussHomeEnabled : sfdcAccountContactRelation.Account.MyUSS_Home_Enabled__c,
      myussEasyPayEnabled : sfdcAccountContactRelation.Account.MyUSS_Easy_Pay_Enabled__c,
      myussBillingEnabled : sfdcAccountContactRelation.Account.MyUSS_Billing_Enabled__c,
      myussOrdersEnabled : sfdcAccountContactRelation.Account.MyUSS_Orders_Enabled__c,
      myussCasesEnabled : sfdcAccountContactRelation.Account.MyUSS_Cases_Enabled__c,
      myussProjectsEnabled : sfdcAccountContactRelation.Account.MyUSS_Projects_Enabled__c,
      myussAssetScanningEnabled : sfdcAccountContactRelation.Account.MyUSS_Asset_Scanning_Enabled__c,
    }
  }

  static getUsersContactListForAccountMapper(sfdcAccountContactRelation: AccountContactRelation,
    ){
       let accountContactRelationModel = new AccountContactRelationModel();
       accountContactRelationModel.id = sfdcAccountContactRelation.Id;
       accountContactRelationModel.contactId = sfdcAccountContactRelation.ContactId;
       accountContactRelationModel.contactName = sfdcAccountContactRelation.Contact.Name;
       accountContactRelationModel.phoneNumber = sfdcAccountContactRelation.Contact.Phone;
       accountContactRelationModel.ussPortalId = sfdcAccountContactRelation.Contact.USS_Portal_User__r.Id ? sfdcAccountContactRelation.Contact.USS_Portal_User__r.Id : ''	;
       accountContactRelationModel.email = sfdcAccountContactRelation.Contact.USS_Portal_User__r.Email_Address__c;
       accountContactRelationModel.auth0Id = sfdcAccountContactRelation.Contact.USS_Portal_User__r.Auth0_Id__c;
       accountContactRelationModel.accountId =  sfdcAccountContactRelation.AccountId;
       accountContactRelationModel.accountName = sfdcAccountContactRelation.Account.Name;
       accountContactRelationModel.myUssUserRole = sfdcAccountContactRelation.MyUSS_User_Role__c;
       accountContactRelationModel.myUssModules = sfdcAccountContactRelation.MyUSS_Modules__c;
       accountContactRelationModel.isActive = sfdcAccountContactRelation.IsActive;
       accountContactRelationModel.roles = sfdcAccountContactRelation.Roles;
       accountContactRelationModel.status = (sfdcAccountContactRelation.MyUSS_User_Role__c)? 'Active': 'Inactive';
       return accountContactRelationModel;
  }
}




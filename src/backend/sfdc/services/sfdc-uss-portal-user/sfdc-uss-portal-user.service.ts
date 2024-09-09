import { Injectable } from '@nestjs/common';
import { SfdcBaseService } from '../sfdc-base/sfdc-base.service';
import { USS_Portal_User__c } from '../../model/USS_Portal_User__c';
import { Contact } from '../../model/Contact';
import { Account } from '../../model/Account';
import { AccountDto } from '../../../../myuss/controllers/user/dto/account/account.dto';
import { AccountContactRelationUpdateDto } from '../../../../myuss/controllers/user/dto/accountcontactrelation/accountcontactrelationupdate.dto';
import { ContactDto } from '../../../../myuss/controllers/user/dto/contact/contact.dto';
import { USSPortalUserDto } from '../../../../myuss/controllers/user/dto/uss-portal-user/uss-potal-user.dto';
import { UpdateUser, UserDetails } from '../../../../myuss/models/user.model';
import { SfdcAccountService } from '../sfdc-account/sfdc-account.service';
import { LoggerService } from '../../../../core/logger/logger.service';
import { UpdateProfileReqDTO } from '../../../../myuss/controllers/user/dto/update-profile-req.dto';
import { SfdcRespModel } from '../../../../myuss/models/quote.model';
import { SignupReqDTO } from '../../../../myuss/controllers/user/dto/signup-req.dto';
import { CacheService } from '../../../../core/cache/cache.service';
import { SFDC_USSPortalUserMapper } from '../../../../myuss/mappers/salesforce/uss-portal-user.mapper';
import { ConfigService } from '@nestjs/config';
import { FetchUserContactsForAccountReqDto } from 'src/myuss/controllers/user/dto/fetch-user-contacts-for-account-req-dto';
import { AddUpdateUserContactForAccountReqDto } from 'src/myuss/controllers/user/dto/add-user-from-account-req.dto';
import { AccountContactRelation } from '../../model/AccountContactRelation';
const { SfDate } = require('jsforce');

@Injectable()
export class SfdcUssPortalUserService {
  private readonly MYUSS_DEFAULT_MODULES: string[];
  private readonly ST_DEFAULT_ROLE: string = 'Standard User';

  constructor(
    private sfdcBaseService: SfdcBaseService,
    private sfdcAccountService: SfdcAccountService,
    private logger: LoggerService,
    private cacheService: CacheService,
    private configService: ConfigService,
  ) {
    this.MYUSS_DEFAULT_MODULES = this.configService.get('MYUSS_DEFAULT_MODULES').split(',');
    if (this.configService.get('ST_DEFAULT_ROLE')) {
      this.ST_DEFAULT_ROLE = this.configService.get('ST_DEFAULT_ROLE');
    }
  }

  async getContactForUserId(userId: string) {
    const query = `SELECT Id, FirstName, LastName, Phone, MailingAddress, 
           AccountId, Account.Name FROM Contact WHERE USS_Customer_Portal_ID__c = '${userId}'`;
    const resp = await this.sfdcBaseService.getQuery(query);
    return resp;
  }

  async getAccountIdsForUser(auth0UserId: string): Promise<string[]> {
    const context = await this.getUserContext(auth0UserId);
    const accountIds: string[] = [];
    context.Contacts__r.forEach((contact: Contact) => {
      contact.AccountContactRelations.forEach((acr: AccountContactRelation) => {
        accountIds.push(acr.AccountId);
      });
    });
    return accountIds;
  }

  async getUserContext(auth0UserId: string): Promise<USS_Portal_User__c> {
    const cacheKey = `user-${auth0UserId}`;
    const cachedValue = await this.cacheService.get(cacheKey);
    const ussPortalUser = new USS_Portal_User__c();

    if (cachedValue) {
      Object.assign(ussPortalUser, cachedValue);
      return ussPortalUser;
    }

    const query = `SELECT Id, Auth0_Id__c,
                    (SELECT Id, FirstName, LastName, AccountId, 
                      (SELECT Id, AccountId, Roles, IsActive, Account.Name, Account.USF_Account_Number__c
                         FROM AccountContactRelations)
                    FROM Contacts__r)
                  FROM USS_Portal_User__c WHERE Auth0_Id__c = '${auth0UserId}'`;
    const resp = await this.sfdcBaseService.getQuery(query);
    const respRecord = resp.records[0];

    ussPortalUser.Id = respRecord.Id;
    ussPortalUser.Auth0_Id__c = respRecord.Auth0_Id__c;
    ussPortalUser.Contacts__r = [];

    respRecord.Contacts__r.records.forEach((contactRecord) => {
      const contact = new Contact();
      contact.Id = contactRecord.Id;
      contact.FirstName = contactRecord.FirstName;
      contact.LastName = contactRecord.LastName;
      contact.AccountId = contactRecord.AccountId;
      contact.AccountContactRelations = [];
      
      contactRecord.AccountContactRelations.records.forEach((acrRecord) => {
        const acr = new AccountContactRelation();
        acr.Id = acrRecord.Id;
        acr.AccountId = acrRecord.AccountId;
        const account = new Account();
        account.Id = acrRecord.Account.Id;
        account.Name = acrRecord.Account.Name;
        account.USF_Account_Number__c = acrRecord.Account.USF_Account_Number__c;
        contact.AccountContactRelations.push(acr);
      });
      ussPortalUser.Contacts__r.push(contact);
    });

    await this.cacheService.set(cacheKey, ussPortalUser, 300);
    return ussPortalUser;
  }

  async getQuoteForUser(auth0UserId: string) {
    const query = `SELECT Id, Auth0_Id__c,
                    (SELECT Id, Name, AccountId, 
                      (SELECT Id FROM AccountContactRelations)
                    FROM Contacts__r)
                  FROM USS_Portal_User__c WHERE Auth0_Id__c = '${auth0UserId}'`;
    const resp = await this.sfdcBaseService.getQuery(query);
    return resp;
  }

  async fetchProfile(auth0UserId: string) {
    const query = `SELECT Id, Auth0_Id__c,
    (SELECT Id, FirstName, LastName, AccountId, Phone, Email,
      (SELECT Id, AccountId, ContactId, Roles, IsActive, Account.Auto_Pay_Requirement__c, Account.Name, Account.Customer_Segment__c, Account.Business_Type__c, Account.USF_Account_Number__c, 
        Account.MyUSS_Enabled__c, Account.MyUSS_Quotes_Enabled__c,Account.MyUSS_Home_Enabled__c,
        Account.MyUSS_Easy_Pay_Enabled__c,Account.MyUSS_Billing_Enabled__c,
        Account.MyUSS_Orders_Enabled__c,Account.MyUSS_Cases_Enabled__c,
        Account.MyUSS_Projects_Enabled__c,Account.MyUSS_Asset_Scanning_Enabled__c,Account.PO_Required__c,
        Account.Account_Payment_Status__c,Account.MyUSS_Bypass_Terms_and_Conditions__c, MyUSS_User_Role__c, MyUSS_Modules__c
        FROM AccountContactRelations)
    FROM Contacts__r)
    FROM USS_Portal_User__c WHERE Auth0_Id__c = '${auth0UserId}'`;
    const profileResp = await this.sfdcBaseService.getQuery(query);
    const profile = profileResp.records[0];

    if (profile?.Contacts__r) {
      profile.Contacts__r = profile.Contacts__r.records.map((contactRecord) => {
        const contact = contactRecord;
        contact.AccountContactRelations = contactRecord.AccountContactRelations.records;
        return contact;
      });
    }

    const mappedData: UserDetails = SFDC_USSPortalUserMapper.getMyUSSUserPortalUserFromSFDCUSSPortalUser(profile);
    return mappedData;
  }

  async createUser(ussPortalNewUser: SignupReqDTO): Promise<SfdcRespModel> {
    try {
      const existingUser = await this.sfdcBaseService.conn
        .sobject('USS_Portal_User__c')
        .select('Id')
        .where({ Auth0_Id__c: ussPortalNewUser.auth0Id })
        .limit(500)
        .execute();

      let ussPortalUserObj = new USSPortalUserDto();
      ussPortalUserObj.Email_Address__c = ussPortalNewUser.email;
      ussPortalUserObj.Auth0_Id__c = ussPortalNewUser.auth0Id;
      ussPortalUserObj.Name = ussPortalNewUser.name;
      let respOfUssPortalUser;

      respOfUssPortalUser = existingUser.length == 0
        ? await this.sfdcBaseService.createSObject('USS_Portal_User__c', ussPortalUserObj)
        : { success: true, id: existingUser[0].Id };

      if (respOfUssPortalUser.success) {
        let account = new Account();
        if (!this.sfdcAccountService.accountRecordTypeIdProspect) {
          await this.sfdcAccountService.getProspectAccountRecordTypeId();
        }
        account.RecordTypeId = this.sfdcAccountService.accountRecordTypeIdProspect;
        account.Name = ussPortalNewUser.accountName;
        account.Phone = ussPortalNewUser.phone;
        account.Customer_Segment__c = ussPortalNewUser.customerSegment;
        account.Business_Type__c = ussPortalNewUser.businessType;
        account.Auto_Pay_Requirement__c = 'Yes - USS Required';
        account = this.sfdcAccountService.getEnabledFeatures(account, this.MYUSS_DEFAULT_MODULES);
        const respOfAccount = await this.sfdcBaseService.createSObject('Account', account);

        if (respOfAccount.success) {
          let contactObj = new ContactDto();
          contactObj.AccountId = respOfAccount.id;
          contactObj.LastName = ussPortalNewUser.lastName;
          contactObj.FirstName = ussPortalNewUser.firstName;
          contactObj.Phone = this.formatPhoneNumber(ussPortalNewUser.phone);
          contactObj.Email = ussPortalNewUser.email;
          contactObj.USS_Portal_User__c = respOfUssPortalUser.id;

          const respOfContact = await this.sfdcBaseService.createSObject('Contact', contactObj);
          
          if (respOfContact.success) {
            const acrResp = await this.sfdcBaseService.getQuery(
              `SELECT Id, Roles FROM AccountContactRelation WHERE AccountId = '${respOfAccount.id}' AND ContactId = '${respOfContact.id}'`
            );

            if (acrResp.records.length == 0) {
              await this.sfdcBaseService.createSObject('AccountContactRelation', {
                AccountId: respOfAccount.id,
                ContactId: respOfContact.id,
                Roles: 'Payer',
                MyUSS_User_Role__c: this.ST_DEFAULT_ROLE,
                MyUSS_Modules__c: this.sfdcAccountService.getUserModulesEnableFeatures(this.MYUSS_DEFAULT_MODULES)
              });
            } else {
              const acr = new AccountContactRelationUpdateDto();
              acr.Id = acrResp.records[0].Id;
              acr.Roles = 'Payer; Primary Decision Maker';
              acr.MyUSS_User_Role__c = this.ST_DEFAULT_ROLE;
              acr.MyUSS_Modules__c = this.sfdcAccountService.getUserModulesEnableFeatures(this.MYUSS_DEFAULT_MODULES);
              await this.sfdcBaseService.updateSObject('AccountContactRelation', acr);
            }

            await this.sfdcAccountService.updatePrimaryPayer(respOfAccount.id, respOfContact.id);
            await this.sfdcBaseService.updateSObject('Account', {
              Id: respOfAccount.id,
              Auto_Pay_Requirement__c: 'Yes - USS Required',
            });
            return { message: 'Success', success: true, errors: [], id: '' };
          } else {
            this.logger.error('err in Contact');
            return { message: 'err in Contact', success: false, errors: [], id: '' };
          }
        } else {
          this.logger.error('err in Account');
          return { message: 'err in Account', success: false, errors: [], id: '' };
        }
      } else {
        this.logger.error('err in USS_Portal_User__c');
        return { message: 'err in USS_Portal_User__c', success: false, errors: [], id: '' };
      }
    } catch (err) {
      return { message: 'err while creating new user', success: false, errors: [err], id: '' };
    }
  }

  async updateUser(updateProfileReq: UpdateProfileReqDTO): Promise<SfdcRespModel> {
    let userObj = new UpdateUser();
    userObj.Id = updateProfileReq.contactId;
    userObj.FirstName = updateProfileReq.firstName;
    userObj.LastName = updateProfileReq.lastName;
    const updateUserResp = await this.sfdcBaseService.updateSObject('Contact', userObj);

    const updateUserRespModel = new SfdcRespModel();
    Object.assign(updateUserRespModel, updateUserResp);
    return updateUserRespModel;
  }

  formatPhoneNumber(phone: string): string {
    return phone.replace('+1', '');
  }

  public async upsertPortalUsers(users: USS_Portal_User__c[]): Promise<USS_Portal_User__c[]> {
    let batchNum = 0;
    const batchSize = 10;
    const ids: string[] = [];

    while (users.length > batchNum * batchSize) {
      const start = batchNum * batchSize;
      const end = start + batchSize;
      const usersBatch = users.slice(start, end);
      const resp = await this.sfdcBaseService.updateSObjectsByExternalId(
        'USS_Portal_User__c',
        'Auth0_Id__c',
        usersBatch,
      );
      ids.push(...resp.map((r) => r.id));
      batchNum++;
    }

    const updatedUsers = await this.sfdcBaseService.conn
      .sobject('USS_Portal_User__c')
      .select('Id, Auth0_Id__c, Email_Address__c')
      .where({ Id: { $in: ids } })
      .execute();
    
    return updatedUsers;
  }

  public async fetchContactAndUssPortalUser(auth0Id: string, accountId: string): Promise<any> {
    const soql = `select ContactId, AccountId, Contact.USS_Portal_User__c from AccountContactRelation  where 
    AccountId = '${accountId}'  and Contact.USS_Portal_User__r.Auth0_Id__c = '${auth0Id}'`;
    const userData = await this.sfdcBaseService.getQuery(soql);
    return {
      contactId: userData.records[0].ContactId,
      ussPortalUserId: userData.records[0].Contact.USS_Portal_User__c,
      accountId: userData.records[0].AccountId,
    };
  }

  public async updateLastLoginTime(emailId: string) {
    try {
      const ussPortalUser = new USS_Portal_User__c();
      const userResult = await this.sfdcBaseService.getSObjectRecordsByField(
        'USS_Portal_User__c',
        'Email_Address__c',
        emailId
      );
      ussPortalUser.Id = userResult[0].Id;
      ussPortalUser.Last_Login__c = SfDate.toDateTimeLiteral(new Date());
      return await this.sfdcBaseService.updateSObject('USS_Portal_User__c', ussPortalUser);
    } catch (err) {
      console.log('Error while updating last login time', err);
    }
  }

  async fetchUserContactListForAccount(fetchUsersFromAccountReqDto: FetchUserContactsForAccountReqDto) {
    let query = fetchUsersFromAccountReqDto.isAllContacts
      ? `select id, ContactId, Contact.Phone,Contact.Name, Account.Name, AccountId, MyUSS_User_Role__c, MyUSS_Modules__c, CreatedBy.Name, IsActive, Roles,Contact.USS_Portal_User__r.Id,Contact.USS_Portal_User__r.Email_Address__c, Contact.USS_Portal_User__r.Auth0_Id__c from AccountContactRelation limit 50`
      : `select id, ContactId,Contact.Phone, Contact.Name, Account.Name, AccountId, MyUSS_User_Role__c, MyUSS_Modules__c, CreatedBy.Name, IsActive, Roles,Contact.USS_Portal_User__r.Id,Contact.USS_Portal_User__r.Email_Address__c, Contact.USS_Portal_User__r.Auth0_Id__c from AccountContactRelation where Contact.USS_Portal_User__c != '' AND AccountId = '${fetchUsersFromAccountReqDto.accountId}'`;

    const addAddressDetailsResp = await this.sfdcBaseService.getQuery(query);
    return addAddressDetailsResp.records as AccountContactRelation[];
  }

  async editUserContactForAccount(editUserContactReqDto: AddUpdateUserContactForAccountReqDto) {
    let contactObj = new ContactDto();
    contactObj.Id = editUserContactReqDto.contactId;
    contactObj.AccountId = editUserContactReqDto.accountId;
    contactObj.LastName = editUserContactReqDto.lastName;
    contactObj.FirstName = editUserContactReqDto.firstName;
    contactObj.Phone = editUserContactReqDto.phoneNumber;
    contactObj.Email = editUserContactReqDto.email;

    const createContactResult = await this.sfdcBaseService.updateSObject('Contact', contactObj);
    const createContactResultRespModel = new SfdcRespModel();
    Object.assign(createContactResultRespModel, createContactResult);
    
    if (createContactResultRespModel.success) {
      let accountContactRelation = new AccountContactRelation();
      accountContactRelation.Id = editUserContactReqDto.id;

      if (editUserContactReqDto.isActive) {
        accountContactRelation.MyUSS_User_Role__c = editUserContactReqDto.myUssUserRole;
        accountContactRelation.MyUSS_Modules__c = editUserContactReqDto.myUssModules;
      } else {
        accountContactRelation.MyUSS_User_Role__c = '';
        accountContactRelation.MyUSS_Modules__c = editUserContactReqDto.myUssModules;
      }
      const accountContactRelationResult = await this.sfdcBaseService.updateSObject('AccountContactRelation', accountContactRelation);
      const accountContactRelationRespModel = new SfdcRespModel();
      Object.assign(accountContactRelationRespModel, accountContactRelationResult);
      return accountContactRelationRespModel.success;
    } else {
      return false;
    }
  }

  async addUserContactForAccount(addUpdateContactForAccountReqDto: AddUpdateUserContactForAccountReqDto, auth0Id: string): Promise<SfdcRespModel> {
    try {
      const existingUser = await this.sfdcBaseService.conn
        .sobject('USS_Portal_User__c')
        .select('Id')
        .where({ Auth0_Id__c: auth0Id })
        .limit(500)
        .execute();
      
      let ussPortalUserObj = new USSPortalUserDto();
      ussPortalUserObj.Email_Address__c = addUpdateContactForAccountReqDto.email;
      ussPortalUserObj.Auth0_Id__c = auth0Id;
      ussPortalUserObj.Name = `${addUpdateContactForAccountReqDto.firstName} ${addUpdateContactForAccountReqDto.lastName}`;
      let respOfUssPortalUser;

      respOfUssPortalUser = existingUser.length === 0
        ? await this.sfdcBaseService.createSObject('USS_Portal_User__c', ussPortalUserObj)
        : { success: true, id: existingUser[0].Id };

      if (respOfUssPortalUser.success) {
        let contactObj = new ContactDto();
        contactObj.AccountId = addUpdateContactForAccountReqDto.accountId;
        contactObj.LastName = addUpdateContactForAccountReqDto.lastName;
        contactObj.FirstName = addUpdateContactForAccountReqDto.firstName;
        contactObj.Phone = this.formatPhoneNumber(addUpdateContactForAccountReqDto.phoneNumber);
        contactObj.Email = addUpdateContactForAccountReqDto.email;
        contactObj.USS_Portal_User__c = respOfUssPortalUser.id;

        let respOfContact;
        const contactResp = await this.sfdcBaseService.getQuery(
          `SELECT Id from Contact  where AccountId = '${addUpdateContactForAccountReqDto.accountId}' AND Email = '${addUpdateContactForAccountReqDto.email}'`,
        );

        if (contactResp.records.length === 0) {
          respOfContact = await this.sfdcBaseService.createSObject('Contact', contactObj);
        } else {
          contactObj.Id = contactResp.records[0].Id;
          respOfContact = await this.sfdcBaseService.updateSObject('Contact', contactObj);
        }

        if (respOfContact.success) {
          const acrResp = await this.sfdcBaseService.getQuery(
            `SELECT Id, Roles FROM AccountContactRelation WHERE AccountId = '${addUpdateContactForAccountReqDto.accountId}' AND ContactId = '${respOfContact.id}'`
          );

          if (acrResp.records.length === 0) {
            await this.sfdcBaseService.createSObject('AccountContactRelation', {
              AccountId: addUpdateContactForAccountReqDto.accountId,
              ContactId: respOfContact.id,
              Roles: 'None',
              MyUSS_User_Role__c: addUpdateContactForAccountReqDto.myUssUserRole,
              MyUSS_Modules__c: addUpdateContactForAccountReqDto.myUssModules
            });
          } else {
            const acr = new AccountContactRelation();
            acr.Id = acrResp.records[0].Id;
            acr.MyUSS_User_Role__c = addUpdateContactForAccountReqDto.myUssUserRole;
            acr.MyUSS_Modules__c = addUpdateContactForAccountReqDto.myUssModules;
            await this.sfdcBaseService.updateSObject('AccountContactRelation', acr);
          }

          return { message: 'Success', success: true, errors: [], id: '' };
        } else {
          this.logger.error('err in Contact');
          return { message: 'err in Contact', success: false, errors: [], id: '' };
        }
      } else {
        this.logger.error('err in USS_Portal_User__c');
        return { message: 'err in USS_Portal_User__c', success: false, errors: [], id: '' };
      }
    } catch (err) {
      return { message: 'err while creating new user', success: false, errors: [err], id: '' };
    }
  }
}
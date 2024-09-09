import { Injectable } from '@nestjs/common';
import { SidetradeCreateUserDto } from '../../../sidetrade/models/sidetrade-create-user.dto';
import { SidetradeCreateUserResponse } from '../../models/sidetrade-create-user-response.dto';
import { Auth0UserService } from '../../../backend/auth0/services/auth0-user/auth0-user.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { AppMetadata, BulkUserImport, Auth0User } from '../../../backend/auth0/model/auth0.model';
import { ErrorMessage } from '../../../backend/auth0/model/auth0.model';
import { FirestoreService } from '../../../backend/google/firestore/firestore.service';
import { SfdcUssPortalUserService } from '../../../backend/sfdc/services/sfdc-uss-portal-user/sfdc-uss-portal-user.service';
import { USS_Portal_User__c } from '../../../backend/sfdc/model/USS_Portal_User__c';
import { Account } from '../../../backend/sfdc/model/Account';
import { SfdcAccountService } from '../../../backend/sfdc/services/sfdc-account/sfdc-account.service';
import { Contact } from '../../../backend/sfdc/model/Contact';
import { SfdcContactService } from '../../../backend/sfdc/services/sfdc-contact/sfdc-contact.service';
import { SFMC_SidetradeUserMigrationService } from '../../../backend/marketing-cloud/services/sfmc-sidetrade-user-migration/sfmc-sidetrade-user-migration.service';
import { SFMC_SidetradeMigratedUser } from '../../../backend/marketing-cloud/models/sfmc-sidetrade-user-migration';
import { ConfigService } from '@nestjs/config';
import { SfdcAccountContactRelationService } from '../../../backend/sfdc/services/sfdc-account-contact-relation/sfdc-account-contact-relation/sfdc-account-contact-relation.service';
import { AccountContactRelation } from '../../../backend/sfdc/model/AccountContactRelation';

@Injectable()
export class UserService {
  private readonly firestoreCollectionName = 'sidetrade-user-creation-requests';
  private readonly firestoreCollectionNameErrors = 'sidetrade-user-creation-errors';
  private readonly ST_DEFAULT_MODULES: ['core', 'billing', 'cases', 'easy_pay', 'home', 'orders', 'projects', 'quotes'];
  private readonly ST_DEFAULT_ROLE: string = 'Standard User'; // Account Owner, Account Admin, Standard User, Read Only
  private static readonly ST_MAP_DEFAULT_MODULES_TO_FIELDS = {
    core: 'MyUSS_Enabled__c',
    billing: 'MyUSS_Billing_Enabled__c',
    cases: 'MyUSS_Cases_Enabled__c',
    easy_pay: 'MyUSS_Easy_Pay_Enabled__c',
    home: 'MyUSS_Home_Enabled__c',
    orders: 'MyUSS_Orders_Enabled__c',
    projects: 'MyUSS_Projects_Enabled__c',
    quotes: 'MyUSS_Quotes_Enabled__c',
  };
  private static readonly MAP_ACCOUNT_FLAG_TO_RBAC = {
    MyUSS_Enabled__c: 'MyUSS Enabled',
    MyUSS_Billing_Enabled__c: 'MyUSS Billing Enabled', 
    MyUSS_Cases_Enabled__c: 'MyUSS Cases Enabled',
    MyUSS_Easy_Pay_Enabled__c: 'MyUSS Easy Pay Enabled', 
    MyUSS_Home_Enabled__c: 'MyUSS Home Enabled', 
    MyUSS_Orders_Enabled__c: 'MyUSS Orders Enabled',
    MyUSS_Projects_Enabled__c: 'MyUSS Projects Enabled', 
    MyUSS_Quotes_Enabled__c: 'MyUSS Quotes Enabled'
  }

  constructor(
    private auth0UserService: Auth0UserService,
    private firestoreService: FirestoreService,
    private logger: LoggerService,
    private sfdcUSSPortalUserService: SfdcUssPortalUserService,
    private sfdcAccountService: SfdcAccountService,
    private sfdcContactService: SfdcContactService,
    private sfdcAccountContactRelationService: SfdcAccountContactRelationService,
    private sfmcSidetradeUserMigrationService: SFMC_SidetradeUserMigrationService,
    private configService: ConfigService,
  ) {
    this.ST_DEFAULT_MODULES = this.configService.get('ST_DEFAULT_MODULES').split(',');
    if (this.configService.get('ST_DEFAULT_ROLE')) {
      this.ST_DEFAULT_ROLE = this.configService.get('ST_DEFAULT_ROLE');
    }
  }

  public async sendToSFMC(users: SidetradeCreateUserDto[], response: SidetradeCreateUserResponse[]) {
    const migrationUsers: SFMC_SidetradeMigratedUser[] = [];
    const newUsers: SFMC_SidetradeMigratedUser[] = [];
    // send migrated users to the migrated users
    users.forEach((user) => {
      const sfmcUser = new SFMC_SidetradeMigratedUser();
      sfmcUser.email = user.email;
      sfmcUser.active_in_sidetrade = user.activated;
      const respUser = response.find((createdUser) => createdUser.email === user.email);
      sfmcUser.myuss_existing_user = respUser.isExistingUser;
      if (user.origin === 'migration') {
        migrationUsers.push(sfmcUser);
      } else {
        newUsers.push(sfmcUser);
      }
    });
    if (migrationUsers.length > 0) {
      await this.sfmcSidetradeUserMigrationService.postMigratedUsers(migrationUsers);
    }
    if (newUsers.length > 0) {
      await this.sfmcSidetradeUserMigrationService.triggerNewUserEmails(newUsers);
    }
  }

  async updateAccountsForMyUSSAndBilling(accounts: Account[]) {
    const accountsToUpdate: Account[] = [];
    accounts.forEach((account) => {
      let accountToUpdate = new Account();
      accountToUpdate.Id = account.Id;
      // get the key for the map
      const modules = Object.keys(UserService.ST_MAP_DEFAULT_MODULES_TO_FIELDS) as (keyof typeof UserService.ST_MAP_DEFAULT_MODULES_TO_FIELDS)[];
      // filter to just the modules that are enabled
      const modulesToEnable = modules.filter((module) => this.ST_DEFAULT_MODULES.includes(module));
      // set the fields to true for the modules
      modulesToEnable.forEach((module) => {
        accountToUpdate[UserService.ST_MAP_DEFAULT_MODULES_TO_FIELDS[module]] = true;
      });
      accountsToUpdate.push(accountToUpdate);
    });
    return this.sfdcAccountService.updateAccounts(accountsToUpdate);
  }


  async updateRolesAndModuleAccess 
    (requestId: string, users: SidetradeCreateUserDto[], ussPortalUsers: USS_Portal_User__c[], accounts: Account[]): Promise<void> {
      const accounContactRelationsToUpdate: AccountContactRelation[] = [];
      // get the Contacts with ACRs for all the ussPortalUsers
      const accountContactRelations = await this.sfdcAccountContactRelationService.getACRsForUSSPortalUsers(ussPortalUsers);
      // for each user, get the ACRs
      users.forEach((user) => {
        let portalUserACRs = accountContactRelations.filter((acr) => acr.Contact.USS_Portal_User__r.Email_Address__c === user.email);
        let updatePortalUserACR = false;
        // filter down to just ACRs where the Account is in the list of accounts for the user
        portalUserACRs = portalUserACRs.filter((acr) => user.accounts.includes(acr.Account.USF_Account_Number__c));
        // if there is no MyUSS User Role, set it to the default role
        portalUserACRs.forEach((acr) => {
          updatePortalUserACR = false;
          if (!acr.MyUSS_User_Role__c) {
            acr.MyUSS_User_Role__c = this.ST_DEFAULT_ROLE;
            updatePortalUserACR = true;
          }
          // if MyUSS Modules is null, set it to the active modules on the Account as a semicolon-delimited list
          if (!acr.MyUSS_Modules__c) {
            acr.MyUSS_Modules__c = '';
            Object.keys(UserService.MAP_ACCOUNT_FLAG_TO_RBAC).forEach((key) => {
              if (acr.Account[key] === true) {
                acr.MyUSS_Modules__c += `${UserService.MAP_ACCOUNT_FLAG_TO_RBAC[key]};`;
              }
            });
            updatePortalUserACR = true;
          } else {
            // make sure the modules include billing
            if (!acr.MyUSS_Modules__c.includes('MyUSS Billing Enabled')) {
              acr.MyUSS_Modules__c += 'MyUSS Billing Enabled;';
              updatePortalUserACR = true;
            }
          }
          // if there's an update, add it to the list
          if (updatePortalUserACR) {
            accounContactRelationsToUpdate.push(acr);
          }
        });
    });
    // update the ACRs
    const resp = await this.sfdcAccountContactRelationService.updateAccountContactRelations(accounContactRelationsToUpdate);
    // if there are errors, log them
    const errors = resp.filter((resp) => !resp.success);
    if (errors.length > 0) {
      // log errors to firestore
      this.storeErrors(requestId, 'updateRolesAndModuleAccess', errors);
    }
  }

  async createUsersBulk(users: SidetradeCreateUserDto[], requestId: string): Promise<any[]> {
    const response: SidetradeCreateUserResponse[] = [];
    // call the bulk import
    this.logger.info('createUsersBulk', users);
    const bulkUserImport = this.createBulkUserImport(users, requestId);
    this.logger.info('bulkUserImport' + JSON.stringify(bulkUserImport));
    // create the import job
    const importResponse = await this.auth0UserService.createUserImportJob(bulkUserImport);
    // check the status of the import job
    const jobId = importResponse.id;
    this.logger.info('jobId', jobId);
    let jobStatus = await this.auth0UserService.getJobStatus(jobId);
    this.logger.info('jobStatus', jobStatus, new Date());
    while (jobStatus.status === 'pending') {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      jobStatus = await this.auth0UserService.getJobStatus(jobId);
      this.logger.info('jobStatus', jobStatus, new Date());
    }
    // if the job is complete, check for errors
    let jobErrors = [];
    if (jobStatus.status === 'completed') {
      jobErrors = await this.auth0UserService.getJobErrors(jobId);
      this.logger.info('jobErrors: ' + JSON.stringify(jobErrors));
    } else {
      // job is not complete, return an error
      throw new Error('Job did not complete successfully' + JSON.stringify(jobStatus));
    }
    // TODO: create a type for these errors
    return jobErrors;
  }

  public createResponseFromUsersAndErrors(
    requestId: string,
    users: SidetradeCreateUserDto[],
    jobErrors: any[],
    createdUsers: Auth0User[],
  ): SidetradeCreateUserResponse[] {
    const response: SidetradeCreateUserResponse[] = [];
    // starting from the original list, if there is no error then it was a success
    users.forEach((user) => {
      const error = jobErrors.find((error) => error.user.email === user.email);
      const auth0User = createdUsers.find((createdUser) => createdUser.email === user.email);
      if (!error) {
        // if the user was created and has completed onboarding then it's an existing MyUSS User
        if (auth0User && auth0User.app_metadata.has_completed_onboarding === true) {
          response.push(this.createSuccessResponse(user.email, true));
        } else {
          response.push(this.createSuccessResponse(user.email));
        }
      } else {
        // if the only error is a duplicate then it's a success
        if (error.errors.length === 1 && error.errors[0].code === 'DUPLICATED_USER') {
          response.push(this.createSuccessResponse(user.email, true));
        } else {
          // otherwise it's an error
          const errorResp = new SidetradeCreateUserResponse();
          errorResp.email = user.email;
          errorResp.success = false;
          errorResp.error = JSON.stringify(error.errors.filter((error) => error.code !== 'DUPLICATED_USER'));
          response.push(errorResp);
        }
      }
    });
    return response;
  }

  public async getAccountsForUsers(users: SidetradeCreateUserDto[]): Promise<Account[]> {
    // create a list of Account Numbers to pull in
    const accountNumbers = new Set<string>();
    users.forEach((user) => {
      if (user.accounts && user.accounts.length > 0) {
        user.accounts.forEach((account) => {
          accountNumbers.add(account);
        });
      }
    });

    let accounts: Account[] = [];
    while (accountNumbers.size > 0) {
      let accountNumbersBatch = Array.from(accountNumbers).slice(0, 49);
      this.logger.info(`accountNumbersBatch: ${JSON.stringify(accountNumbersBatch)}`);
      // get the Accounts from Salesforce by Account Number in batches of 50
      const accountsBatch = await this.sfdcAccountService.getAccountsByAccountNumbers(Array.from(accountNumbersBatch));
      // get the Contacts by the Account Numbers
      const contacts = await this.sfdcContactService.getContactsByAccountNumbers(Array.from(accountNumbersBatch));
      // add the contacts to the accounts
      accountsBatch.forEach((account) => {
        account.Contacts = contacts.filter((contact) => contact.AccountId === account.Id);
      });
      this.logger.info(
        `accountsBatch: ${JSON.stringify(accountsBatch.map((account) => account.USF_Account_Number__c))}`,
      );
      accounts = accounts.concat(accountsBatch);
      accountNumbersBatch.forEach((accountNumber) => {
        accountNumbers.delete(accountNumber);
      });
    }
    this.logger.info(`accounts: ${JSON.stringify(accounts.map((account) => account.USF_Account_Number__c))}`);
    return accounts;
  }

  public async linkUSSPortalUsersToContacts(
    requestId: string,
    usersRequests: SidetradeCreateUserDto[],
    portalUsers: USS_Portal_User__c[],
    accounts: Account[],
  ) {
    const contactsToUpdate: Contact[] = [];
    const contactsToInsert: Contact[] = [];
    const errors = [];
    // for each user request, find the account and link the user to the account
    usersRequests.forEach((user) => {
      let portalUser = portalUsers.find((portalUser) => portalUser.Email_Address__c === user.email);
      if (!portalUser) {
        this.logger.error('No portal user found for email: ' + user.email);
        errors.push({
          email: user.email,
          error: 'No portal user found for email',
        });
        return;
      }
      // for each account, find the contact for the user by email address
      user.accounts.forEach((accountNumber) => {
        let account = accounts.find((account) => account.USF_Account_Number__c === accountNumber);
        if (!account) {
          this.logger.error('No account found for accountNumber: ' + accountNumber);
          errors.push({
            email: user.email,
            error: 'No account found for accountNumber: ' + accountNumber,
          });
          return;
        }
        // find the contact by email
        let contact = account.Contacts.find((contact) => contact.Email === user.email);
        // if there is no contact, create a new contact to link
        if (!contact) {
          // create a new contact
          let contactToInsert = new Contact();
          contactToInsert.Email = user.email;
          contactToInsert.AccountId = account.Id;
          contactToInsert.FirstName = user.given_name || 'Valued';
          contactToInsert.LastName = user.family_name || 'Customer';
          contactToInsert.USS_Portal_User__c = portalUser.Id;
          contactsToInsert.push(contactToInsert);
          return;
        }
        // link the user to the contact
        let contactToUpdate = new Contact();
        contactToUpdate.Id = contact.Id;
        contactToUpdate.USS_Portal_User__c = portalUser.Id;
        contactsToUpdate.push(contactToUpdate);
      });
    });

    // update the contacts if there are any
    if (contactsToUpdate.length > 0) {
      const updateResp = await this.sfdcContactService.updateContacts(contactsToUpdate);
      this.logger.info('updateResp', updateResp);
      updateResp.forEach((resp) => {
        if (!resp.success) {
          errors.push({
            email: 'unknown',
            error: resp,
          });
        }
      });
    }
    if (contactsToInsert.length > 0) {
      const insertResp = await this.sfdcContactService.insertContacts(contactsToInsert);
      this.logger.info('insertResp', insertResp);
      insertResp.forEach((resp) => {
        if (!resp.success) {
          errors.push({
            email: 'unknown',
            error: resp,
          });
        }
      });
    }
    // if there are errors, log them
    if (errors.length > 0) {
      // log errors to firestore
      this.storeErrors(requestId, 'linkUSSPortalUsersToContacts', errors);
    }
  }

  public async getAuth0UsersByRequestId(requestId: string): Promise<any> {
    return this.auth0UserService.getAuth0UsersByRequestId(requestId);
  }

  createBulkUserImport(users: SidetradeCreateUserDto[], requestId: string): BulkUserImport {
    const auth0Users: Auth0User[] = [];
    users.forEach((user) => {
      const auth0User = this.createAuth0User(user, requestId);
      auth0Users.push(auth0User);
    });
    const bulkUserImport = new BulkUserImport(auth0Users);
    return bulkUserImport;
  }

  async createAuth0Users(
    users: SidetradeCreateUserDto[],
    requestId: string,
  ): Promise<{ users: Auth0User[]; response: SidetradeCreateUserResponse[] }> {
    let createdUsers: Auth0User[] = [];
    // get rid of this
    const response: SidetradeCreateUserResponse[] = [];
    for (const user of users) {
      try {
        // check for existing user
        // create the user
        let auth0User = this.createAuth0User(user, requestId);
        const existingAuth0Users: Auth0User[] = await this.auth0UserService.getUserByEmail(user.email);
        if (existingAuth0Users && existingAuth0Users.length > 0) {
          // user exists, don't need to do anything, return success
          response.push(this.createSuccessResponse(user.email, true));
          // update app_metadata
          const existingAuth0User = existingAuth0Users[0];
          await this.updateAppMetadata(existingAuth0User, auth0User, requestId);
          existingAuth0User.app_metadata = {
            ...existingAuth0User.app_metadata,
            ...auth0User.app_metadata,
          };
          // send comm about billing
          // await this.sfmcSidetradeUserMigrationService.triggerNewUserEmail(user, true);
          createdUsers.push(existingAuth0User);
        } else {
          let userResp = await this.auth0UserService.createUser(auth0User);
          this.logger.info('userResp', userResp);
          // check for error
          if (userResp && userResp['error']) {
            userResp = userResp as ErrorMessage;
            this.logger.error('userResp', userResp.errorMessage);
            response.push({
              email: user.email,
              success: false,
              error: userResp.error || 'Unknown error creating user',
            });
          } else if (userResp && userResp['email']) {
            userResp = userResp as Auth0User;
            createdUsers.push(userResp);
            response.push(this.createSuccessResponse(userResp.email));
          } else {
            // unknown condition
            this.logger.error('error creating Auth0User: ', userResp);
          }
        }
      } catch (error) {
        this.logger.error('error creating Auth0User: ', error);
        response.push({
          email: user.email,
          success: false,
          error: error.message,
        });
      }
    }
    return { users: createdUsers, response: response };
  }

  private async updateAppMetadata(existingAuth0User: Auth0User, auth0User: Auth0User, requestId: string) {
    const newAppMetadata = auth0User.app_metadata;
    return await this.auth0UserService.updateUserAppMetadata(existingAuth0User.user_id, newAppMetadata);
  }

  public createAuth0User(user: SidetradeCreateUserDto, requestId: string): Auth0User {
    const auth0User = new Auth0User();
    auth0User.email = user.email;
    auth0User.given_name = user.given_name;
    auth0User.family_name = user.family_name;
    auth0User.email_verified = true;
    let appMetadata = new AppMetadata();
    appMetadata.sidetrade_origin = user.origin;
    appMetadata.sidetrade_activated = user.activated;
    appMetadata.sidetrade_user_batch = requestId;
    appMetadata.sidetrade_migrated_user = true;
    auth0User.app_metadata = appMetadata;
    return auth0User;
  }

  public async upsertUSSPortalUsers(users: Auth0User[]): Promise<USS_Portal_User__c[]> {
    if (!users || users.length === 0) {
      return;
    }
    const ussPortalUsers: USS_Portal_User__c[] = [];
    users.forEach((user) => {
      const ussPortalUser = new USS_Portal_User__c();
      ussPortalUser.Email_Address__c = user.email;
      ussPortalUser.Auth0_Id__c = user.user_id;
      ussPortalUser.Name = user.email;
      ussPortalUsers.push(ussPortalUser);
    });
    return await this.sfdcUSSPortalUserService.upsertPortalUsers(ussPortalUsers);
  }

  storeRawRequest(requestId: string, users: SidetradeCreateUserDto[]) {
    this.firestoreService
      .createDocument(this.firestoreCollectionName, requestId, {
        createUsersRequest: users,
        createdDate: new Date(),
      })
      .then((result) => {
        this.logger.info('successfully stored createUsers request to Firestore', result);
      })
      .catch((error) => {
        this.logger.error('error storing createUsers request to Firestore', error);
      });
  }

  storeErrors(requestId: string, errorType: string, errors: any[]) {
    if (!errors || errors.length === 0) {
      return;
    }
    this.firestoreService
      .createDocument(this.firestoreCollectionNameErrors, `${requestId}-${errorType}`, {
        errors: errors,
        createdDate: new Date(),
      })
      .then((result) => {
        this.logger.info(`successfully stored ${errorType} errors to Firestore`, result);
      })
      .catch((error) => {
        this.logger.error(`error storing ${errorType} errors to Firestore`, error);
      });
  }

  createSuccessResponseFromCreatedUsers(createdUsers: Auth0User[]): SidetradeCreateUserResponse[] {
    const response: SidetradeCreateUserResponse[] = [];
    createdUsers.forEach((user) => {
      response.push(this.createSuccessResponse(user.email));
    });
    return response;
  }

  private createSuccessResponse(email: string, isExistingUser?: boolean): SidetradeCreateUserResponse {
    const resp = new SidetradeCreateUserResponse();
    resp.email = email;
    resp.success = true;
    resp.isExistingUser = isExistingUser;
    resp.error = '';
    return resp;
  }
}

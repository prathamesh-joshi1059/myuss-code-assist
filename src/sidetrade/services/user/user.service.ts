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
import { SfdcAccountContactRelationService } from '../../../backend/sfdc/services/sfdc-account-contact-relation/sfdc-account-contact-relation.service';
import { AccountContactRelation } from '../../../backend/sfdc/model/AccountContactRelation';

@Injectable()
export class UserService {
  private readonly firestoreCollectionName = 'sidetrade-user-creation-requests';
  private readonly firestoreCollectionNameErrors = 'sidetrade-user-creation-errors';
  private readonly ST_DEFAULT_MODULES: string[] = ['core', 'billing', 'cases', 'easy_pay', 'home', 'orders', 'projects', 'quotes'];
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
    const defaultRole = this.configService.get('ST_DEFAULT_ROLE');
    if (defaultRole) {
      this.ST_DEFAULT_ROLE = defaultRole;
    }
  }

  public async sendToSFMC(users: SidetradeCreateUserDto[], response: SidetradeCreateUserResponse[]) {
    const migrationUsers: SFMC_SidetradeMigratedUser[] = [];
    const newUsers: SFMC_SidetradeMigratedUser[] = [];
    
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
      const accountToUpdate = new Account();
      accountToUpdate.Id = account.Id;

      const modules = Object.keys(UserService.ST_MAP_DEFAULT_MODULES_TO_FIELDS) as (keyof typeof UserService.ST_MAP_DEFAULT_MODULES_TO_FIELDS)[];
      const modulesToEnable = modules.filter((module) => this.ST_DEFAULT_MODULES.includes(module));

      modulesToEnable.forEach((module) => {
        accountToUpdate[UserService.ST_MAP_DEFAULT_MODULES_TO_FIELDS[module]] = true;
      });

      accountsToUpdate.push(accountToUpdate);
    });

    return this.sfdcAccountService.updateAccounts(accountsToUpdate);
  }

  async updateRolesAndModuleAccess(
    requestId: string,
    users: SidetradeCreateUserDto[],
    ussPortalUsers: USS_Portal_User__c[],
    accounts: Account[]
  ): Promise<void> {
    const accounContactRelationsToUpdate: AccountContactRelation[] = [];
    const accountContactRelations = await this.sfdcAccountContactRelationService.getACRsForUSSPortalUsers(ussPortalUsers);

    users.forEach((user) => {
      let portalUserACRs = accountContactRelations.filter((acr) => acr.Contact.USS_Portal_User__r.Email_Address__c === user.email);
      let updatePortalUserACR = false;

      portalUserACRs = portalUserACRs.filter((acr) => user.accounts.includes(acr.Account.USF_Account_Number__c));

      portalUserACRs.forEach((acr) => {
        updatePortalUserACR = false;
        if (!acr.MyUSS_User_Role__c) {
          acr.MyUSS_User_Role__c = this.ST_DEFAULT_ROLE;
          updatePortalUserACR = true;
        }
        if (!acr.MyUSS_Modules__c) {
          acr.MyUSS_Modules__c = '';
          Object.keys(UserService.MAP_ACCOUNT_FLAG_TO_RBAC).forEach((key) => {
            if (acr.Account[key] === true) {
              acr.MyUSS_Modules__c += `${UserService.MAP_ACCOUNT_FLAG_TO_RBAC[key]};`;
            }
          });
          updatePortalUserACR = true;
        } else if (!acr.MyUSS_Modules__c.includes('MyUSS Billing Enabled')) {
          acr.MyUSS_Modules__c += 'MyUSS Billing Enabled;';
          updatePortalUserACR = true;
        }
        if (updatePortalUserACR) {
          accounContactRelationsToUpdate.push(acr);
        }
      });
    });

    const resp = await this.sfdcAccountContactRelationService.updateAccountContactRelations(accounContactRelationsToUpdate);

    const errors = resp.filter((resp) => !resp.success);
    if (errors.length > 0) {
      this.storeErrors(requestId, 'updateRolesAndModuleAccess', errors);
    }
  }

  async createUsersBulk(users: SidetradeCreateUserDto[], requestId: string): Promise<any[]> {
    const response: SidetradeCreateUserResponse[] = [];
    this.logger.info('createUsersBulk', users);
    const bulkUserImport = this.createBulkUserImport(users, requestId);
    this.logger.info('bulkUserImport' + JSON.stringify(bulkUserImport));
    const importResponse = await this.auth0UserService.createUserImportJob(bulkUserImport);
    const jobId = importResponse.id;
    this.logger.info('jobId', jobId);
    let jobStatus = await this.auth0UserService.getJobStatus(jobId);
    this.logger.info('jobStatus', jobStatus, new Date());

    while (jobStatus.status === 'pending') {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      jobStatus = await this.auth0UserService.getJobStatus(jobId);
      this.logger.info('jobStatus', jobStatus, new Date());
    }

    if (jobStatus.status === 'completed') {
      const jobErrors = await this.auth0UserService.getJobErrors(jobId);
      this.logger.info('jobErrors: ' + JSON.stringify(jobErrors));
      return jobErrors;
    }

    throw new Error('Job did not complete successfully' + JSON.stringify(jobStatus));
  }

  public createResponseFromUsersAndErrors(
    requestId: string,
    users: SidetradeCreateUserDto[],
    jobErrors: any[],
    createdUsers: Auth0User[],
  ): SidetradeCreateUserResponse[] {
    const response: SidetradeCreateUserResponse[] = [];
    
    users.forEach((user) => {
      const error = jobErrors.find((error) => error.user.email === user.email);
      const auth0User = createdUsers.find((createdUser) => createdUser.email === user.email);

      if (!error) {
        response.push(this.createSuccessResponse(user.email, auth0User && auth0User.app_metadata.has_completed_onboarding === true));
      } else if (error.errors.length === 1 && error.errors[0].code === 'DUPLICATED_USER') {
        response.push(this.createSuccessResponse(user.email, true));
      } else {
        const errorResp = new SidetradeCreateUserResponse();
        errorResp.email = user.email;
        errorResp.success = false;
        errorResp.error = JSON.stringify(error.errors.filter((error) => error.code !== 'DUPLICATED_USER'));
        response.push(errorResp);
      }
    });

    return response;
  }

  public async getAccountsForUsers(users: SidetradeCreateUserDto[]): Promise<Account[]> {
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
      const accountNumbersBatch = Array.from(accountNumbers).slice(0, 49);
      this.logger.info(`accountNumbersBatch: ${JSON.stringify(accountNumbersBatch)}`);
      const accountsBatch = await this.sfdcAccountService.getAccountsByAccountNumbers(Array.from(accountNumbersBatch));
      const contacts = await this.sfdcContactService.getContactsByAccountNumbers(Array.from(accountNumbersBatch));

      accountsBatch.forEach((account) => {
        account.Contacts = contacts.filter((contact) => contact.AccountId === account.Id);
      });

      this.logger.info(`accountsBatch: ${JSON.stringify(accountsBatch.map((account) => account.USF_Account_Number__c))}`);
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
    const errors: any[] = [];

    usersRequests.forEach((user) => {
      const portalUser = portalUsers.find((portalUser) => portalUser.Email_Address__c === user.email);
      if (!portalUser) {
        this.logger.error('No portal user found for email: ' + user.email);
        errors.push({ email: user.email, error: 'No portal user found for email' });
        return;
      }

      user.accounts.forEach((accountNumber) => {
        const account = accounts.find((account) => account.USF_Account_Number__c === accountNumber);
        if (!account) {
          this.logger.error('No account found for accountNumber: ' + accountNumber);
          errors.push({ email: user.email, error: 'No account found for accountNumber: ' + accountNumber });
          return;
        }

        const contact = account.Contacts.find((contact) => contact.Email === user.email);
        if (!contact) {
          const contactToInsert = new Contact();
          contactToInsert.Email = user.email;
          contactToInsert.AccountId = account.Id;
          contactToInsert.FirstName = user.given_name || 'Valued';
          contactToInsert.LastName = user.family_name || 'Customer';
          contactToInsert.USS_Portal_User__c = portalUser.Id;
          contactsToInsert.push(contactToInsert);
          return;
        }

        const contactToUpdate = new Contact();
        contactToUpdate.Id = contact.Id;
        contactToUpdate.USS_Portal_User__c = portalUser.Id;
        contactsToUpdate.push(contactToUpdate);
      });
    });

    if (contactsToUpdate.length > 0) {
      const updateResp = await this.sfdcContactService.updateContacts(contactsToUpdate);
      this.logger.info('updateResp', updateResp);
      updateResp.forEach((resp) => {
        if (!resp.success) {
          errors.push({ email: 'unknown', error: resp });
        }
      });
    }

    if (contactsToInsert.length > 0) {
      const insertResp = await this.sfdcContactService.insertContacts(contactsToInsert);
      this.logger.info('insertResp', insertResp);
      insertResp.forEach((resp) => {
        if (!resp.success) {
          errors.push({ email: 'unknown', error: resp });
        }
      });
    }

    if (errors.length > 0) {
      this.storeErrors(requestId, 'linkUSSPortalUsersToContacts', errors);
    }
  }

  public async getAuth0UsersByRequestId(requestId: string): Promise<any> {
    return this.auth0UserService.getAuth0UsersByRequestId(requestId);
  }

  createBulkUserImport(users: SidetradeCreateUserDto[], requestId: string): BulkUserImport {
    const auth0Users: Auth0User[] = users.map((user) => this.createAuth0User(user, requestId));
    return new BulkUserImport(auth0Users);
  }

  async createAuth0Users(
    users: SidetradeCreateUserDto[],
    requestId: string,
  ): Promise<{ users: Auth0User[]; response: SidetradeCreateUserResponse[] }> {
    const createdUsers: Auth0User[] = [];
    const response: SidetradeCreateUserResponse[] = [];

    for (const user of users) {
      try {
        const auth0User = this.createAuth0User(user, requestId);
        const existingAuth0Users: Auth0User[] = await this.auth0UserService.getUserByEmail(user.email);

        if (existingAuth0Users && existingAuth0Users.length > 0) {
          response.push(this.createSuccessResponse(user.email, true));
          const existingAuth0User = existingAuth0Users[0];
          await this.updateAppMetadata(existingAuth0User, auth0User, requestId);
          existingAuth0User.app_metadata = {
            ...existingAuth0User.app_metadata,
            ...auth0User.app_metadata,
          };
          createdUsers.push(existingAuth0User);
        } else {
          let userResp = await this.auth0UserService.createUser(auth0User);
          this.logger.info('userResp', userResp);

          if (userResp?.error) {
            userResp = userResp as ErrorMessage;
            this.logger.error('userResp', userResp.errorMessage);
            response.push({
              email: user.email,
              success: false,
              error: userResp.error || 'Unknown error creating user',
            });
          } else if (userResp?.email) {
            userResp = userResp as Auth0User;
            createdUsers.push(userResp);
            response.push(this.createSuccessResponse(userResp.email));
          } else {
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

    const appMetadata = new AppMetadata();
    appMetadata.sidetrade_origin = user.origin;
    appMetadata.sidetrade_activated = user.activated;
    appMetadata.sidetrade_user_batch = requestId;
    appMetadata.sidetrade_migrated_user = true;

    auth0User.app_metadata = appMetadata;
    return auth0User;
  }

  public async upsertUSSPortalUsers(users: Auth0User[]): Promise<USS_Portal_User__c[]> {
    if (!users || users.length === 0) {
      return [];
    }

    const ussPortalUsers: USS_Portal_User__c[] = users.map((user) => {
      const ussPortalUser = new USS_Portal_User__c();
      ussPortalUser.Email_Address__c = user.email;
      ussPortalUser.Auth0_Id__c = user.user_id;
      ussPortalUser.Name = user.email;
      return ussPortalUser;
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
    return createdUsers.map((user) => this.createSuccessResponse(user.email));
  }

  private createSuccessResponse(email: string, isExistingUser?: boolean): SidetradeCreateUserResponse {
    return {
      email,
      success: true,
      isExistingUser,
      error: '',
    };
  }
}
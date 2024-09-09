import { Injectable } from '@nestjs/common';
import { SfdcUssPortalUserService } from '../../../backend/sfdc/services/sfdc-uss-portal-user/sfdc-uss-portal-user.service';
import { SfdcQuoteService } from '../../../backend/sfdc/services/sfdc-quote/sfdc-quote.service';
import { SfdcContractService } from '../../../backend/sfdc/services/sfdc-contract/sfdc-contract.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { TIMEMS_CACHE_USER } from '../../../core/utils/constants';
import { SignupReqDTO } from '../../controllers/user/dto/signup-req.dto';
import { UpdateProfileReqDTO } from '../../controllers/user/dto/update-profile-req.dto';
import { ApiRespDTO } from '../../../common/dto/api-resp.dto';
import { Auth0UserService } from '../../../backend/auth0/services/auth0-user/auth0-user.service';
import { CacheService } from '../../../core/cache/cache.service';
import { AccountDetailsForRedis, CreateUserResponseModel, UserDetails } from '../../../myuss/models';
import { EDIT_PROFILE_SCREEN, UPDATED_PROFILE } from '../../../core/utils/user-event-messages';
import { TrackUserActionService } from '../../../core/track-user-action/track-user-action-service';
import { FirestoreService } from '../../../backend/google/firestore/firestore.service';
import { AddUpdateUserContactForAccountReqDto } from '../../../myuss/controllers/user/dto/add-user-from-account-req.dto';
import { AppMetadata, Auth0User, ErrorMessage } from '../../../backend/auth0/model/auth0.model';
import { GeneralUtils } from '../../../core/utils/general.utils';
import { FetchUserContactsForAccountReqDto } from '../../../myuss/controllers/user/dto/fetch-user-contacts-for-account-req-dto';
import { AccountContactRelation } from '../../../backend/sfdc/model/AccountContactRelation';
import { SFDC_USSPortalUserMapper } from '../../../myuss/mappers/salesforce/uss-portal-user.mapper';

@Injectable()
export class UserService {
  constructor(
    private sfdcQuoteService: SfdcQuoteService,
    private sfdcUssPortalUserService: SfdcUssPortalUserService,
    private sfdcContractService: SfdcContractService,
    private logger: LoggerService,
    private auth0UserService: Auth0UserService,
    private cacheService: CacheService,
    private trackUserActionService: TrackUserActionService,
    private firestoreService: FirestoreService
  ) {}

  async requestEmailVerification(userId: string): Promise<ApiRespDTO<object>> {
    let requestEmailVerificationResp = new ApiRespDTO<object>();
    try {
      const resp = await this.auth0UserService.requestEmailVerification(userId);
      requestEmailVerificationResp = resp.status === 201
        ? { success: true, message: 'Success', status: 1000, data: {} }
        : { success: false, message: 'Fail', status: 1012, data: {} };
    } catch (err) {
      this.logger.error(err);
      requestEmailVerificationResp = { success: false, message: 'Fail', status: 1012, data: {} };
    }
    return requestEmailVerificationResp;
  }

  async fetchUsersDetails(auth0UserId: string): Promise<ApiRespDTO<UserDetails | object>> {
    let fetchUserDetailsResp = new ApiRespDTO<object>();
    try {
      const fetchProfileResult = await this.fetchProfile(auth0UserId);
      const enforceRBAC = process.env.ENFORCE_RBAC === "true" ? true : false;
      
      if (fetchProfileResult.message === 'Success') {
        fetchUserDetailsResp = { success: true, message: 'Success', status: 1000, data: fetchProfileResult.data };
      } else if (fetchProfileResult.message === 'User not found') {
        fetchUserDetailsResp = { success: true, message: 'User not found', status: 1031, data: { enforceRBAC } };
      } else if (fetchProfileResult.message === 'User registered in auth0') {
        fetchUserDetailsResp = { success: true, message: 'User registered in auth0', status: 1017, data: { enforceRBAC } };
      } else {
        fetchUserDetailsResp = { success: false, message: 'There was an error fetching the data. Please try again.', status: 1015, data: { enforceRBAC } };
      }
    } catch (err) {
      this.logger.error(err);
      fetchUserDetailsResp = { success: false, message: 'There was an error fetching the data. Please try again.', status: 1015, data: { enforceRBAC } };
    }
    return fetchUserDetailsResp;
  }

  async fetchProfile(auth0UserId: string): Promise<ApiRespDTO<UserDetails | object>> {
    const userResp = await this.sfdcUssPortalUserService.fetchProfile(auth0UserId);
    const enforceRBAC = process.env.ENFORCE_RBAC === "true" ? true : false;

    if (!userResp.id) {
      return { status: 1031, message: 'User not found', data: { enforceRBAC } };
    } else if (!userResp.accounts) {
      return { status: 1017, message: 'User registered in auth0', data: { enforceRBAC } };
    }

    const isEmailVerified = await this.auth0UserService.isEmailVerified(auth0UserId);
    let userObj: UserDetails = { ...userResp, emailVerified: isEmailVerified };

    this.fetchAccountDetails(auth0UserId, userObj);

    return { status: 1000, message: 'Success', data: userObj };
  }

  async fetchAccountDetails(auth0UserId: string, userObj: UserDetails) {
    const accountCollectionData = (await this.firestoreService.getCollectionDocsByFieldName('accounts', 'auth0Id', auth0UserId))
      .map(doc => doc.data());

    if (accountCollectionData) {
      const accountDetailsForRedis: AccountDetailsForRedis[] = accountCollectionData.map(doc => ({
        accountId: doc.accountId,
        contracts: doc.contracts,
        quotes: doc.quotes,
        auth0Id: doc.auth0Id
      }));

      userObj.accountDetails = accountDetailsForRedis;
      await this.cacheService.set('user-' + auth0UserId, JSON.stringify(userObj), TIMEMS_CACHE_USER);
    }
  }

  async createUser(signupReq: SignupReqDTO): Promise<ApiRespDTO<Object>> {
    let createUserResultResp = new ApiRespDTO<Object>();
    try {
      const createUserResult = await this.sfdcUssPortalUserService.createUser(signupReq);
      createUserResultResp = createUserResult.success
        ? { success: true, message: 'Success', status: 1000, data: {} }
        : { success: false, message: 'Fail to create account. Please try again.', status: 1030, data: { err: createUserResult.message } };
    } catch (err) {
      this.logger.error(err);
      createUserResultResp = { success: false, status: 1030, message: 'Fail to create account. Please try again.', data: { err: err.message } };
    }
    return createUserResultResp;
  }

  async updateUser(auth0UserId: string, updateProfileReq: UpdateProfileReqDTO): Promise<ApiRespDTO<Object>> {
    let updateProfileResp = new ApiRespDTO<Object>();
    this.trackUserActionService.setPortalActions(updateProfileReq.accountId, auth0UserId, EDIT_PROFILE_SCREEN, UPDATED_PROFILE, "", "");
    try {
      const updateProfileResult = await this.sfdcUssPortalUserService.updateUser(updateProfileReq);
      updateProfileResp = updateProfileResult.success
        ? { success: true, message: 'Success', status: 1000, data: {} }
        : { success: false, message: 'Could not update profile. Please try again.', status: 1016, data: {} };
    } catch (err) {
      updateProfileResp = { success: false, message: 'Could not update profile. Please try again.', status: 1016, data: { err: err.message } };
    }
    return updateProfileResp;
  }

  async updateCache(type: string, authId: string, data: Object, accountId: string) {
    const userObj = JSON.parse(await this.cacheService.get<string>('user-' + authId));
    this.logger.info(userObj);
    
    if (!userObj) {
      await this.fetchProfile(authId);
    } else {
      if (type === 'quote') {
        const accountDetails = userObj.accountDetails.find(account => account.accountId === accountId);
        if (accountDetails) {
          accountDetails.quotes ? accountDetails.quotes.push(data["id"]) : accountDetails.quotes = [data["id"]];
        }
      }
      if (type === 'contract') {
        const accountDetails = userObj.accountDetails.find(account => account.accountId === accountId);
        if (accountDetails) {
          accountDetails.contracts ? accountDetails.contracts.push(data["id"]) : accountDetails.contracts = [data["id"]];
        }
      }
    }
    await this.cacheService.set('user-' + authId, JSON.stringify(userObj), TIMEMS_CACHE_USER);
  }

  async hasAccessToAccount(auth0UserId: string, data: object, type: string): Promise<boolean> {
    const userContext: any = await this.fetchProfile(auth0UserId);
    if (type === 'account') {
      return userContext.data.accountId === data.accountId;
    }
    if (type === 'email') {
      return userContext.data.email === data.email;
    }
    if (type === 'quote') {
      return userContext.data.quotes.includes(data.quoteId);
    }
    return false;
  }

  async clearCache(): Promise<ApiRespDTO<Object>> {
    const clearCacheResp = await this.cacheService.reset();
    return clearCacheResp
      ? { success: true, status: 1000, data: {}, message: 'Success' }
      : { success: false, status: 1011, data: {}, message: 'Error in clear redis cache' };
  }

  async getCacheKeys(): Promise<ApiRespDTO<Object>> {
    const clearCacheResp = await this.cacheService.allKeys();
    return clearCacheResp
      ? { success: true, status: 1000, data: { keys: clearCacheResp }, message: 'Success' }
      : { success: false, status: 1011, data: {}, message: 'Error in clear redis cache' };
  }

  async fetchQuoteIds(accountIds: string[]): Promise<any> {
    return await this.sfdcQuoteService.fetchQuoteIds(accountIds);
  }

  async fetchContractIds(accountIds: string[]): Promise<any> {
    return await this.sfdcContractService.fetchContractIds(accountIds);
  }

  async fetchContactAndUssPortalUser(auth0UserId: string, accountId: string): Promise<any> {
    return await this.sfdcUssPortalUserService.fetchContactAndUssPortalUser(auth0UserId, accountId);
  }

  async updateLastLogin(emailId: string): Promise<ApiRespDTO<Object>> {
    return this.sfdcUssPortalUserService.updateLastLoginTime(emailId)
      .then((res) => {
        this.logger.info('lastLoginTime:', JSON.stringify(res));
        return res;
      })
      .catch((err) => {
        this.logger.error('Promise rejected in updateLastLogin', JSON.stringify(err));
        return err;
      });
  }

  async addUserContactForAccount(addUpdateContactForAccountReqDto: AddUpdateUserContactForAccountReqDto): Promise<ApiRespDTO<Object>> {
    const createUsersResp = await this.createAuth0Users(addUpdateContactForAccountReqDto);
    this.logger.info('Completed creating users in Auth0', createUsersResp);
    
    if (createUsersResp.createAuthResponse.success) {
      return this.sfdcUssPortalUserService.addUserContactForAccount(addUpdateContactForAccountReqDto, createUsersResp.users.user_id)
        .then(() => ({
          success: true,
          status: 1000,
          message: 'Success',
          data: {}
        }))
        .catch((err) => ({
          success: false,
          status: 1051,
          message: 'Error while adding the contact for account',
          data: { "err": err },
        }));
    } else {
      return {
        success: false,
        status: 1051,
        message: 'Error while adding the contact for account',
        data: {},
      };
    }
  }

  async fetchUserContactListForAccount(fetchUsersFromAccountReqDto: FetchUserContactsForAccountReqDto): Promise<any[]> {
    const usersFromAccountList = await this.sfdcUssPortalUserService.fetchUserContactListForAccount(fetchUsersFromAccountReqDto);
    return usersFromAccountList.map((usersFromAccount: AccountContactRelation) => 
      SFDC_USSPortalUserMapper.getUsersContactListForAccountMapper(usersFromAccount)
    );
  }

  async editUserContactForAccount(addUpdateContactForAccountReqDto: AddUpdateUserContactForAccountReqDto): Promise<ApiRespDTO<Object>> {
    const editUserContactForAccountResp = await this.sfdcUssPortalUserService.editUserContactForAccount(addUpdateContactForAccountReqDto);
    return editUserContactForAccountResp
      ? { success: true, status: 1000, message: 'Success', data: {} }
      : { success: false, status: 1052, message: 'Error while editing the contact for account', data: {} };
  }

  async createAuth0Users(user: AddUpdateUserContactForAccountReqDto): Promise<{ users: Auth0User, createAuthResponse: CreateUserResponseModel }> {
    let createdUser: Auth0User;
    let response: CreateUserResponseModel;

    try {
      const requestId = GeneralUtils.getUUID();
      const existingAuth0Users: Auth0User[] = await this.auth0UserService.getUserByEmail(user.email);

      if (existingAuth0Users && existingAuth0Users.length > 0) {
        const existingAuth0User = existingAuth0Users[0];
        await this.updateAppMetadata(existingAuth0User, this.createAuth0User(user, requestId), requestId);
        createdUser = existingAuth0User;
        response = this.createSuccessResponse(user.email, true);
      } else {
        let auth0User = this.createAuth0User(user, requestId);
        let userResp = await this.auth0UserService.createUser(auth0User);

        if (userResp?.error) {
          this.logger.error('userResp', userResp.errorMessage);
          response = { email: user.email, success: false, error: userResp.error || 'Unknown error creating user' };
        } else if (userResp?.email) {
          createdUser = userResp;
          response = this.createSuccessResponse(userResp.email);
          await this.auth0UserService.changePasswordInteractive(user.email);
        } else {
          this.logger.error('error creating Auth0User: ', userResp);
        }
      }
    } catch (error) {
      this.logger.error('error creating Auth0User: ', error);
      response = { email: user.email, success: false, error: error.message };
    }

    return { users: createdUser, createAuthResponse: response };
  }

  public createAuth0User(user: AddUpdateUserContactForAccountReqDto, requestId: string): Auth0User {
    const auth0User = new Auth0User();
    auth0User.email = user.email;
    auth0User.given_name = user.firstName;
    auth0User.family_name = user.lastName;
    auth0User.email_verified = true;

    const appMetadata = new AppMetadata();
    appMetadata.sidetrade_user_batch = requestId;
    appMetadata.sidetrade_migrated_user = false;
    auth0User.app_metadata = appMetadata;

    return auth0User;
  }

  private async updateAppMetadata(existingAuth0User: Auth0User, auth0User: Auth0User, requestId: string) {
    const newAppMetadata = auth0User.app_metadata;
    return await this.auth0UserService.updateUserAppMetadata(existingAuth0User.user_id, newAppMetadata);
  }

  private createSuccessResponse(email: string, isExistingUser?: boolean): CreateUserResponseModel {
    const resp = new CreateUserResponseModel();
    resp.email = email;
    resp.success = true;
    resp.isExistingUser = isExistingUser;
    resp.error = '';
    return resp;
  }

  async deleteUser(userId: string): Promise<ApiRespDTO<Object>> {
    const deleteUserResponse = await this.auth0UserService.deleteUser(userId);
    return deleteUserResponse === 204
      ? { status: 1000, data: {}, message: 'User successfully deleted', success: true }
      : { status: 1038, data: {}, message: 'Error while deleting user', success: false };
  }
}
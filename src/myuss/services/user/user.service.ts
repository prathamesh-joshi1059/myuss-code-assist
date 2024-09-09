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
import { json } from 'stream/consumers';
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
    private trackUserActionService : TrackUserActionService,
    private firestoreService: FirestoreService
  ) {}

  async requestEmailVerification(userId: string): Promise<ApiRespDTO<object>> {
    let requestEmailVerificationResp = new ApiRespDTO<object>();
    try {
      const resp = await this.auth0UserService.requestEmailVerification(userId);
      if (resp.status === 201) {
        requestEmailVerificationResp = {
          success: true,
          message: 'Success',
          status: 1000,
          data: {},
        };
      } else {
        requestEmailVerificationResp = {
          success: false,
          message: 'Fail',
          status: 1012,
          data: {},
        };
      }
    } catch (err) {
      this.logger.error(err);
      requestEmailVerificationResp = {
        success: false,
        message: 'Fail',
        status: 1012,
        data: {},
      };
    }
    return requestEmailVerificationResp;
  }
  async fetchUsersDetails(auth0UserId: string): Promise<ApiRespDTO<UserDetails | object>> {
    let fetchUserDetailsResp = new ApiRespDTO<object>();
    try {
      const fetchProfileResult = await this.fetchProfile(auth0UserId);
      if (fetchProfileResult['message'] == 'Success') {
        fetchUserDetailsResp = {
          success: true,
          message: 'Success',
          status: 1000,
          data: fetchProfileResult['data'],
        };
        return fetchUserDetailsResp;
      } else if (fetchProfileResult['message'] == 'User not found') {
        fetchUserDetailsResp = {
          success: true,
          message: 'User not found',
          status: 1031,
          data: { enforceRBAC: process.env.ENFORCE_RBAC === "true" ? true : false },
        };
      } else if (fetchProfileResult['message'] == 'User registered in auth0') {
        fetchUserDetailsResp = {
          success: true,
          message: 'User registered in auth0',
          status: 1017,
          data: { enforceRBAC: process.env.ENFORCE_RBAC === "true" ? true : false },
        };
      } else {
        fetchUserDetailsResp = {
          success: false,
          message: 'There was an error fetching the data. Please try again.',
          status: 1015,
          data: { enforceRBAC: process.env.ENFORCE_RBAC === "true" ? true : false },
        };
      }
    } catch (err) {
      this.logger.error(err);
      fetchUserDetailsResp = {
        success: false,
        message: 'There was an error fetching the data. Please try again.',
        status: 1015,
        data: { enforceRBAC: process.env.ENFORCE_RBAC === "true" ? true : false},
      };
      
    }
    return fetchUserDetailsResp;
  }
  async fetchProfile(auth0UserId: string): Promise<ApiRespDTO<UserDetails | object>> {
    const userResp = await this.sfdcUssPortalUserService.fetchProfile(auth0UserId);
    if (!userResp.id) {
      return { status: 1031, message: 'User not found',data: { enforceRBAC: process.env.ENFORCE_RBAC === "true" ? true : false}};
    } else if (!userResp.accounts) {
      return { status: 1017, message: 'User registered in auth0',data: { enforceRBAC: process.env.ENFORCE_RBAC === "true" ? true : false}};
    }
    // check Auth0 to see if user has verified their email address
    const isEmailVerified = await this.auth0UserService.isEmailVerified(auth0UserId);
    let userObj: UserDetails = Object.assign({}, userResp);
    userObj['emailVerified'] = isEmailVerified;
    //call async function to store data in redis
    this.fetchAccountDetails(auth0UserId,userObj)
  
    const userRespObj = {
      status: 1000,
      message: 'Success',
      data: userObj,
    };
    return userRespObj;
  }
  //execute in async manner to store data in redis
  async fetchAccountDetails(auth0UserId:string, userObj: UserDetails) {
    //update from firestore
    const accountCollectionData = (await this.firestoreService.getCollectionDocsByFieldName('accounts', 'auth0Id',auth0UserId))
                            .map(doc => doc.data());
    if(accountCollectionData != null){
      let accountDetailsForRedis : AccountDetailsForRedis[] = accountCollectionData.map(doc => { 
                                  return {
                                    accountId: doc.accountId,
                                    contracts: doc.contracts,
                                    quotes: doc.quotes,
                                    auth0Id: doc.auth0Id
                                  }})
    userObj.accountDetails = accountDetailsForRedis
    await this.cacheService.set('user-' + auth0UserId, JSON.stringify(userObj), TIMEMS_CACHE_USER);
    }
  }
  async createUser(signupReq: SignupReqDTO): Promise<ApiRespDTO<Object>> {
    let createUserResultResp = new ApiRespDTO<Object>();
    try {
      const createUserResult = await this.sfdcUssPortalUserService.createUser(signupReq);
      if (createUserResult.success) {
        createUserResultResp = {
          success: true,
          message: 'Success',
          status: 1000,
          data: {},
        };
      } else {
        createUserResultResp = {
          success: false,
          message: 'Fail to create account. Please try again.',
          status: 1030,
          data: { err : createUserResult.message},
        };
      }
    } catch (err) {
      this.logger.error(err);
      createUserResultResp = {
        success: false,
        status: 1030,
        message: 'Fail to create account. Please try again.',
        data: { err : err.message},
      };
    }
    return createUserResultResp;
  }
  async updateUser(auth0UserId: string, updateProfileReq: UpdateProfileReqDTO): Promise<ApiRespDTO<Object>> {
    let updateProfileResp = new ApiRespDTO<Object>();
    this.trackUserActionService.setPortalActions(updateProfileReq.accountId,auth0UserId,EDIT_PROFILE_SCREEN,UPDATED_PROFILE,"","");
    try {
      const updateProfileResult = await this.sfdcUssPortalUserService.updateUser(updateProfileReq);
      if (updateProfileResult.success) {
        updateProfileResp = {
          success: true,
          message: 'Success',
          status: 1000,
          data: {},
        };
      } else {
        this.logger.error('error in update profile');
        updateProfileResp = {
          success: false,
          message: 'Could not update profile. Please try again.',
          status: 1016,
          data: {},
        };
      }
    } catch (err) {
      updateProfileResp = {
        success: false,
        message: 'Could not update profile. Please try again.',
        status: 1016,
        data: { err : err.message},
      };
    }
    return updateProfileResp;
  }
  async updateCache(type:string, authId: string, data: Object,accountId) {
 
    let userObj = JSON.parse(await this.cacheService.get<string>('user-' + authId));
    this.logger.info(userObj);
    if (!userObj) {
      await this.fetchProfile(authId).then(async (userDataObj) => {
        //cache will be updated from Firestore 
      });
    } else {
      if (type == 'quote') {
       let accountDetails = userObj.accountDetails.filter(account => account.accountId === accountId)[0]
       if(accountDetails?.length > 0){
        accountDetails.quotes? accountDetails.quotes.push(data["id"]) : accountDetails.quotes = [data["id"]];
       }
      }
      if (type == 'profile') {
        //not using therefore not updated
        userObj = JSON.parse(userObj);
        userObj['firstName'] = data["firstName"];
        userObj['lastName'] = data["lastName"];
      }
      if (type == 'contract') {
        let accountDetails = userObj.accountDetails.filter(account => account.accountId === accountId)[0]
        if(accountDetails?.length > 0){
          accountDetails.contracts? accountDetails.contracts.push(data["id"]) : accountDetails.contracts = [data["id"]]
        }
      }
    }
    await this.cacheService.set('user-' + authId, JSON.stringify(userObj), TIMEMS_CACHE_USER);
  }
  async hasAccessToAccount(auth0UserId: string, data: object, type: string): Promise<boolean> {
    const userContext: object = await this.fetchProfile(auth0UserId);
    if ((type == 'account')) {
      if (userContext['data'].accountId == data['accountId']) {
        return true;
      }
    }
    if ((type == 'email')) {
      if (userContext['data'].email == data['email']) {
        return true;
      }
    }
    if ((type == 'quote')) {
      if (userContext['data'].quotes.includes(data['quoteId'])) {
        return true;
      }
    }
  }
  async clearCache(): Promise<ApiRespDTO<Object>> {
    const clearCacheResp = await this.cacheService.reset();
    if(clearCacheResp){
      return {
        success: true,
        status: 1000,
        data: {},
        message: 'Success',
      }
    }else{
      return {
        success: false,
        status: 1011,
        data: {},
        message: 'Error in clear redis cache',
      }
    }
  }
  async getCacheKeys(): Promise<ApiRespDTO<Object>> {
    const clearCacheResp = await this.cacheService.allKeys();
    if(clearCacheResp){
      return {
        success: true,
        status: 1000,
        data: { keys: clearCacheResp},
        message: 'Success',
      }
    }else{
      return {
        success: false,
        status: 1011,
        data: {},
        message: 'Error in clear redis cache',
      }
    }
  }
  async fetchQuoteIds(accountIds){
    return await this.sfdcQuoteService.fetchQuoteIds(accountIds);
  }
  async fetchContractIds(accountIds){
    return await this.sfdcContractService.fetchContractIds(accountIds);
  }
  async fetchContactAndUssPortalUser(auth0UserId,accountId){
    return await this.sfdcUssPortalUserService.fetchContactAndUssPortalUser(auth0UserId,accountId);
  }
  async updateLastLogin(emailId:string):Promise<ApiRespDTO<Object>> {
    return await this.sfdcUssPortalUserService
      .updateLastLoginTime(emailId)
      .then((res) => {
        this.logger.info('lastLoginTime:', JSON.stringify(res));
        return res;
      })
      .catch((err) => {
        this.logger.error('Promise rejected in updateLastLogin', JSON.stringify(err));
        return err;
      });
 }

 
 async addUserContactForAccount(addUpdateContactForAccountReqDto: AddUpdateUserContactForAccountReqDto):Promise<ApiRespDTO<Object>>{
  const requestId = GeneralUtils.getUUID();
  let createdUser: Auth0User;
  const createUsersResp = await this.createAuth0Users(addUpdateContactForAccountReqDto);
      this.logger.info('Completed creating users in Auth0', createUsersResp);
      createdUser = createUsersResp.users;
    //  response = createUsersResp.response;
      // if this is a small batch, run the post create user steps async to speed up the response
     if(createUsersResp.createAuthResponse.success == true){
      return this.sfdcUssPortalUserService.addUserContactForAccount(addUpdateContactForAccountReqDto,createdUser.user_id)
      .then((resp) => {
        this.logger.info('Completed post create user steps', new Date());
         return {
          success: true,
          status: 1000,
          message: 'Success',
          data:{},
        };
      })
      .catch((err) => {
        return {
          success: false,
          status: 1051,
          message: 'Error while adding the contact for account',
          data: {"err":err},
        };
      });
     }else{
      return {
        success: false,
        status: 1051,
        message: 'Error while adding the contact for account',
        data: {},
      };
     }
  
}

async fetchUserContactListForAccount(fetchUsersFromAccountReqDto: FetchUserContactsForAccountReqDto){
 const usersFromAccountList =  await this.sfdcUssPortalUserService.fetchUserContactListForAccount(fetchUsersFromAccountReqDto);
 let usersList = [];
 return usersList = usersFromAccountList.map((usersFromAccount: AccountContactRelation)=>{
  return SFDC_USSPortalUserMapper.getUsersContactListForAccountMapper(usersFromAccount);
 })

 
}

async editUserContactForAccount(addUpdateContactForAccountReqDto: AddUpdateUserContactForAccountReqDto):Promise<ApiRespDTO<Object>>{
  const editUserContactForAccountResp =  await this.sfdcUssPortalUserService.editUserContactForAccount(addUpdateContactForAccountReqDto);
  if(editUserContactForAccountResp){
    return {
      success: true,
      status: 1000,
      message: 'Success',
      data: {},
    };
  }else{
    return {
      success: false,
      status: 1052,
      message: 'Error while editing the contact for account',
      data: {},
    };
  }
}

 async createAuth0Users(
  user: AddUpdateUserContactForAccountReqDto,
): Promise<{ users: Auth0User, createAuthResponse: CreateUserResponseModel }> {
  let createdUser: Auth0User;
  let response: CreateUserResponseModel;

    try {
      const requestId = GeneralUtils.getUUID();
      // check for existing user
      // create the user
      let auth0User = this.createAuth0User(user, requestId);
      const existingAuth0Users: Auth0User[] = await this.auth0UserService.getUserByEmail(user.email);
      if (existingAuth0Users && existingAuth0Users.length > 0) {
        // user exists, don't need to do anything, return success
        response = this.createSuccessResponse(user.email, true);
        // update app_metadata
        const existingAuth0User = existingAuth0Users[0];
        await this.updateAppMetadata(existingAuth0User, auth0User, requestId);
        existingAuth0User.app_metadata = {
          ...existingAuth0User.app_metadata,
          ...auth0User.app_metadata,
        };
        createdUser = existingAuth0User;
      } else {
        let userResp = await this.auth0UserService.createUser(auth0User);
        // check for error
        if (userResp && userResp['error']) {
          userResp = userResp as ErrorMessage;
          this.logger.error('userResp', userResp.errorMessage);
          response = {
            email: user.email,
            success: false,
            error: userResp.error || 'Unknown error creating user',
          };
        } else if (userResp && userResp['email']) {
          userResp = userResp as Auth0User;
          createdUser = userResp;
          response = this.createSuccessResponse(userResp.email);
          await this.auth0UserService.changePasswordInteractive(user.email);
        } else {
          // unknown condition
          this.logger.error('error creating Auth0User: ', userResp);
        }
      }
    } catch (error) {
      this.logger.error('error creating Auth0User: ', error);
      response = {
        email: user.email,
        success: false,
        error: error.message,
      };
    }
  
  return { users:createdUser , createAuthResponse: response };
}

public createAuth0User(user: AddUpdateUserContactForAccountReqDto, requestId: string): Auth0User {
  const auth0User = new Auth0User();
  auth0User.email = user.email;
  auth0User.given_name = user.firstName;
  auth0User.family_name = user.lastName;
  auth0User.email_verified = true;
  let appMetadata = new AppMetadata();
  //  appMetadata.sidetrade_origin = user.origin;
 //   appMetadata.sidetrade_activated = user.activated;
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
  const deleteUserResponse =  await this.auth0UserService.deleteUser(userId);
  if(deleteUserResponse == 204){
    return {
      status: 1000,
      data: {},
      message: 'User successfully deleted',
      success: true
    }
  }else{
    return {
      status: 1038,
      data: {},
      message: 'Error while deleting user',
      success: false
    }
  }
}
}
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../../../core/logger/logger.service';
import { ConfigService } from '@nestjs/config';
import { Auth0ManagementAPIService } from '../auth0-management-api/auth0-management-api.service';
import { Readable } from 'stream';
import FormData = require('form-data');
import fs = require('fs');
import { Auth0MyUSSAPIService } from '../auth0-myuss-api/auth0-myuss-api.service';
import { BulkUserImport, Auth0User, AppMetadata, CreateAuth0UserDTO } from '../../model/auth0.model';
import { ErrorMessage } from '../../model/auth0.model';
const axios = require('axios');

@Injectable()
export class Auth0UserService {
  private databaseConnectionId: string;
  private databaseConnection: string;

  constructor(
    private http: HttpService,
    private logger: LoggerService,
    private configService: ConfigService,
    private managementService: Auth0ManagementAPIService,
    private myUSSAPIService: Auth0MyUSSAPIService,
  ) {
    this.databaseConnectionId = this.configService.get('AUTH0_DATABASE_CONNECTION_ID');
    this.databaseConnection = this.configService.get('AUTH0_DATABASE_CONNECTION');
  }

  public async getAuth0UsersByRequestId(requestId: string): Promise<Auth0User[]> {
    let users: Auth0User[] = [];
    const pageSize = 100;
    let page = 0;
    let total;
    while (page === 0 || total > page * pageSize) {
      const endpoint = `/api/v2/users?page=${page}&per_page=${pageSize}&include_totals=true&q=app_metadata.sidetrade_user_batch:"${requestId}"`;
      const resp = await this.managementService.get(endpoint);
      total = resp.total;
      users.push(...resp.users);
      page++;
    }
    // this.logger.info('getAuth0UsersByRequestId: ' + JSON.stringify(users));
    return users;
  }

  public async updateUserAppMetadata(user_id: string, newAppMetadata: AppMetadata) {
    const endpoint = `/api/v2/users/${user_id}`;
    const body = {
      app_metadata: newAppMetadata,
    };
    return this.managementService.patch(endpoint, body);
  }

  // https://auth0.com/docs/api/management/v2/jobs/post-verification-email
  async requestEmailVerification(userId: string) {
    const endpoint = `/api/v2/jobs/verification-email`;
    const body = {
      user_id: userId,
      client_id: this.managementService.clientId,
    };
    return this.managementService.post(endpoint, body);
  }

  public async isEmailVerified(auth0UserId: string): Promise<boolean> {
    const user = await this.getUserById(auth0UserId);
    return user.email_verified;
  }

  private async getUserById(auth0UserId: string): Promise<any> {
    const endpoint = `/api/v2/users/${auth0UserId}`;
    return this.managementService.get(endpoint);
  }

  // https://auth0.com/docs/api/management/v2/jobs/post-users-imports
  public async createUserImportJob(userList: BulkUserImport): Promise<any> {
    const endpoint = '/api/v2/jobs/users-imports';
    const data = this.getFormDataFromUserList(userList);
    return this.managementService.postFormData(endpoint, data);
  }

  // https://auth0.com/docs/api/management/v2/jobs/get-jobs-by-id
  public async getJobStatus(jobId: string): Promise<any> {
    const endpoint = `/api/v2/jobs/${jobId}`;
    return this.managementService.get(endpoint);
  }

  // https://auth0.com/docs/api/management/v2/jobs/get-errors
  public async getJobErrors(jobId: string): Promise<any> {
    const endpoint = `/api/v2/jobs/${jobId}/errors`;
    return this.managementService.get(endpoint);
  }

  private getFormDataFromUserList(userList: BulkUserImport): FormData {
    const formData = new FormData();
    formData.append('send_completion_email', 'false');
    formData.append('users', this.getReadableStreamFromUserList(userList));
    formData.append('connection_id', this.databaseConnectionId);
    formData.append('upsert', 'true');
    return formData;
  }

  async changePasswordInteractive(email: string): Promise<object> {
    const endpoint = `/dbconnections/change_password`;
    const body = {
      client_id: this.managementService.clientId,
      email: email,
      connection: this.managementService.databaseConnection,
    };
    return this.managementService.post(endpoint, body);
  }

  private getReadableStreamFromUserList(userList: BulkUserImport): Readable {
    const users = userList.users;
    const userStream = new Readable({
      read() {
        this.push('[');
        for (let i = 0; i < users.length; i++) {
          if (i > 0 && i < users.length) {
            this.push(',');
          }
          this.push(JSON.stringify(users[i]));
        }
        this.push(']');
        this.push(null);
      },
    });
    return userStream;
  }

  public async getUserByEmail(email: string): Promise<Auth0User[]> {
    // https://auth0.com/docs/api/management/v2/users-by-email/get-users-by-email
    const endpoint = '/api/v2/users-by-email';
    let resp = await this.managementService.get(endpoint, new URLSearchParams({ email: email }));
    this.logger.info('getUserByEmail resp: ' + JSON.stringify(resp));
    const users: Auth0User[] = [];
    if (resp && resp.length > 0) {
      resp.forEach((existingUser) => {
        const user = new Auth0User();
        user.user_id = existingUser.user_id;
        user.email = existingUser.email;
        users.push(user);
      });
    }
    return users;
  }

  // create new user in auth0
  async createUser(user: Auth0User, user_metadata?: object, app_metadata?: object): Promise<Auth0User | ErrorMessage> {
    let password = await this.myUSSAPIService.generatePassword(10);
    const url = `/api/v2/users`;
    // set remaining user properties
    const userDTO = new CreateAuth0UserDTO(user, this.databaseConnection, password);
    try {
      const response = await this.managementService.post(url, userDTO);
      return response.data as Auth0User;
    } catch (error) {
      this.logger.error('err: ' + error);
      return { message: 'Fail', errorMessage: error.message, error: error };
    }
  }

  // https://login.auth0.com/api/v2/users/:id
  public async deleteUser(id: string): Promise<number> {
    const endpoint = `/api/v2/users/${id}`;
    const response = await this.managementService.delete(endpoint);
    return response.status;
  }
}

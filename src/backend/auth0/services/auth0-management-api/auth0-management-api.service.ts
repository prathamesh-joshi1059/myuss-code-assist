import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../../../core/logger/logger.service';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, map } from 'rxjs';
import { AccessTokenResponse } from '../../model/accessTokenResponse.model';
import FormData from 'form-data';

@Injectable()
export class Auth0ManagementAPIService {
  public accessToken: string | undefined;
  public accessTokenExpiresAt: Date | undefined;
  public managementURL: string;
  public readonly clientId: string;
  public readonly databaseConnection: string;
  private databaseConnectionId: string;
  private domain: string;

  constructor(private http: HttpService, private logger: LoggerService, private configService: ConfigService) {
    this.managementURL = this.configService.get<string>('AUTH0_MANAGEMENT_URL');
    this.clientId = this.configService.get<string>('AUTH0_CLIENT_ID');
    this.databaseConnection = this.configService.get<string>('AUTH0_DATABASE_CONNECTION');
    this.databaseConnectionId = this.configService.get<string>('AUTH0_DATABASE_CONNECTION_ID');
    this.domain = this.configService.get<string>('AUTH0_DOMAIN');
  }

  async checkAndRefreshAccessToken(): Promise<void> {
    if (!this.accessToken || !this.accessTokenExpiresAt || this.accessTokenExpiresAt < new Date()) {
      const tokenResp = await this.getAccessToken();
      this.accessToken = tokenResp.access_token;
      const expiresAt = new Date();
      // remove 60 seconds from the expiry time to account for latency
      expiresAt.setSeconds(expiresAt.getSeconds() + tokenResp.expires_in - 60);
      this.accessTokenExpiresAt = expiresAt;
    }
  }

  async getAccessToken(): Promise<AccessTokenResponse> {
    const url = `${this.managementURL}/oauth/token`;
    const managementAudience = `${this.managementURL}/api/v2/`;
    const config = { headers: { 'content-type': 'application/json' } };
    const body = {
      client_id: this.configService.get<string>('AUTH0_MGMT_CLIENT_ID'),
      client_secret: this.configService.get<string>('AUTH0_MGMT_CLIENT_SECRET'),
      audience: managementAudience,
      grant_type: 'client_credentials',
      scope: 'read:users update:users create:users create:user_tickets read:stats read:roles',
    };

    const resp = await firstValueFrom(this.http.post(url, body, config).pipe(map((response) => response.data)));
    const authTokenResp = new AccessTokenResponse();
    Object.assign(authTokenResp, resp);
    // this.logger.info('authTokenResp: ' + JSON.stringify(authTokenResp));
    return authTokenResp;
  }

  async get(endpoint: string, params?: URLSearchParams) {
    await this.checkAndRefreshAccessToken();
    const url = `${this.managementURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.accessToken}`,
    };
    const response = await firstValueFrom(
      this.http.get(url, { headers, params }).pipe(map((response) => response.data)),
    );
    return response;
  }

  async post(endpoint: string, body: any) {
    await this.checkAndRefreshAccessToken();
    const url = `${this.managementURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${this.accessToken}`,
    };
    const response = await firstValueFrom(this.http.post(url, body, { headers }));
    return response;
  }

  async patch(endpoint: string, body: any) {
    await this.checkAndRefreshAccessToken();
    const url = `${this.managementURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${this.accessToken}`,
    };
    const response = await firstValueFrom(this.http.patch(url, body, { headers }));
    return response;
  }

  public async postFormData(endpoint: string, data: FormData): Promise<any> {
    await this.checkAndRefreshAccessToken();
    const url = `${this.managementURL}${endpoint}`;
    const request = {
      method: 'post',
      maxBodyLength: Infinity,
      url,
      headers: {
        'Content-Type': 'multipart/form-data',
        Accept: 'application/json',
        Authorization: `Bearer ${this.accessToken}`,
        ...data.getHeaders(),
      },
      data,
    };
    const response = await firstValueFrom(this.http.request(request).pipe(map((response) => response.data)));
    return response;
  }

  async delete(endpoint: string) {
    await this.checkAndRefreshAccessToken();
    const url = `${this.managementURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.accessToken}`,
    };

    const response = await firstValueFrom(this.http.delete(url, { headers }));
    return response;
  }
}
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { LoggerService } from '../../../../core/logger/logger.service';
import { firstValueFrom, map } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { Auth0ManagementAPIService } from '../auth0-management-api/auth0-management-api.service';

@Injectable()
export class Auth0MyUSSAPIService {
  private clientId: string;
  private databaseConnectionId: string;
  public readonly domain: string;

  constructor(
    private http: HttpService,
    private logger: LoggerService,
    private configService: ConfigService,
    private auth0ManagementService: Auth0ManagementAPIService,
  ) {
    this.clientId = this.configService.get('AUTH0_CLIENT_ID');
    this.databaseConnectionId = this.configService.get('AUTH0_DATABASE_CONNECTION_ID');
    this.domain = this.configService.get('AUTH0_DOMAIN');
  }

  async get(endpoint: string, params?: URLSearchParams) {
    await this.auth0ManagementService.checkAndRefreshAccessToken();
    const url = `https://${this.domain}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.auth0ManagementService.accessToken}`,
    };
    const response = await firstValueFrom(
      this.http
        .get(url, { headers, params })
        .pipe(map((response) => response.data)),
    );
    return response;
  }

  async post(endpoint: string, body: unknown) {
    await this.auth0ManagementService.checkAndRefreshAccessToken();
    const url = `https://${this.domain}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${this.auth0ManagementService.accessToken}`,
    };
    const response = await firstValueFrom(
      this.http
        .post(url, body, { headers })
        .pipe(map((response) => response.data)),
    );
    return response;
  }

  async changePassword(email: string): Promise<object> {
    await this.auth0ManagementService.checkAndRefreshAccessToken();
    const url = `https://${this.domain}/api/v2/tickets/password-change`;
    const headers = {
      'content-type': 'application/json',
      authorization: `Bearer ${this.auth0ManagementService.accessToken}`,
    };
    const body = {
      connection_id: this.databaseConnectionId,
      client_id: this.clientId,
      email,
      ttl_sec: 3600,
    };
    const resp = await firstValueFrom(
      this.http.post(url, body, { headers }).pipe(map((response) => response.data)),
    );
    return resp;
  }

  generatePassword(passwordLength: number): string {
    const numberChars = '0123456789';
    const upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowerChars = 'abcdefghijklmnopqrstuvwxyz';
    const allChars = numberChars + upperChars + lowerChars;
    const randPasswordArray = Array(passwordLength);
    randPasswordArray[0] = numberChars;
    randPasswordArray[1] = upperChars;
    randPasswordArray[2] = lowerChars;
    randPasswordArray.fill(allChars, 3);
    
    return this.shuffleArray(
      randPasswordArray.map((x) => x[Math.floor(Math.random() * x.length)]),
    ).join('');
  }
  
  private shuffleArray(array: any[]): any[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}
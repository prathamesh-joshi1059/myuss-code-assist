import { Injectable } from '@nestjs/common';
import { Connection } from 'jsforce';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../../../core/logger/logger.service';
import { CPQ_QuoteModel } from '../../model/cpq/QuoteModel';
import { BehaviorSubject } from 'rxjs';
import { Maximum_Number_Of_Tries } from '../../../../myuss/services/quote/constants';
import { RecordResult } from '../../model/RecordResult';
import { SFDC_Object } from '../../model/SFDC_Base';

@Injectable()
export class SfdcBaseService {
  // AWS: changing to public for demo. this should be private
  public conn: Connection;
  private readonly sfdcRestURI: string;
  private readonly username: string;
  private readonly password: string;
  private readonly securityToken: string;
  public readonly apiVersion: string;
  private MAX_RECORDS = 200;
  public loggedIn$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor(
    private configService: ConfigService,
    private logger: LoggerService
  ) {
    this.sfdcRestURI = this.configService.get('SFDC_REST_URI');
    this.username = this.configService.get('SFDC_USERNAME');
    this.password = this.configService.get('SFDC_PASSWORD');
    this.securityToken = this.configService.get('SFDC_SECURITY_TOKEN');
    this.apiVersion = '58.0';

    this.conn = new Connection({
      version: this.apiVersion,
      oauth2: {
        loginUrl: this.sfdcRestURI,
        clientId: this.configService.get('SFDC_CLIENT_ID'),
        clientSecret: this.configService.get('SFDC_CLIENT_SECRET'),
        redirectUri: this.configService.get('SFDC_REDIRECT_URI'),
      },
    });
    
    this.login()
      .then(() => {
        this.logger.log(`logged in to SFDC`);
        this.loggedIn$.next(true);
        this.logger.log(this.conn.instanceUrl);
      })
      .catch((err) => {
        console.error(`error logging in to SFDC`);
        console.error(err);
      });
  }

  private async login() {
    const session = await this.conn.login(
      this.username,
      `${this.password + this.securityToken}`,
      (err) => {
        if (err) {
          return console.error(err);
        }
      }
    );
  }

  public async getQuery(query: string): Promise<any> {
    return this.conn.query(query, null, (err, res) => {
      if (err) {
        console.error(err);
        throw err;
      }
      return res;
    });
  }

  async updateSObjects(sObject: string, data: SFDC_Object[], batchSize?: number): Promise<SFDC_Object[]> {
    let updatedRecords: SFDC_Object[] = [];
    const batchSizeToUse = batchSize && batchSize < this.MAX_RECORDS ? batchSize : this.MAX_RECORDS;

    while (data.length > 0) {
      const chunk = data.splice(0, batchSizeToUse);
      const resp = await this.conn.sobject(sObject).update(chunk);
      updatedRecords.push(...resp);
    }
    
    return updatedRecords;
  }

  async updateSObject(sObject: string, data: object): Promise<RecordResult> {
    let maxTries = Maximum_Number_Of_Tries;
    let count = 0;    
    let success = false;
    let responseMsg = new RecordResult();

    while (count < maxTries && !success) {
      await this.conn.sobject(sObject).update(data, (err, ret) => {
        if (err || !ret.success) {
          if (err.message.includes("UNABLE_TO_LOCK_ROW")) {
            count++;
            if (count === maxTries) {
              responseMsg.success = false;
              responseMsg.errors.push(err.message);
              return;
            }
          } else {
            responseMsg.success = false;
            responseMsg.errors.push(err.message);
            return;
          }
        } else {
          success = true;
          responseMsg = ret;
          return;
        }
      });
      await this.timeout(1000);
    }
    
    return responseMsg;
  }

  private timeout(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public async getMetadata(sObjects: string[]): Promise<any> {
    return await this.conn.metadata.read('CustomObject', sObjects, (err, metadata) => {
      if (err) {
        return this.logger.error(err);
      }
      return metadata;
    });
  }

  public async createSObject(sObject: string, data: object): Promise<any> {
    return await this.conn.sobject(sObject).create(data);
  }

  public async createSObjects(sObject: string, data: SFDC_Object[], batchSize?: number): Promise<SFDC_Object[]> {
    let createdRecords: SFDC_Object[] = [];
    const batchSizeToUse = batchSize && batchSize < this.MAX_RECORDS ? batchSize : this.MAX_RECORDS;

    while (data.length > 0) {
      const chunk = data.splice(0, batchSizeToUse);
      const resp = await this.conn.sobject(sObject).create(chunk);
      createdRecords.push(...resp);
    }
    
    return createdRecords;
  }

  public async updateSObjectByExternalId(sObject: string, externalIdFieldName: string, data: object): Promise<any> {
    return await this.conn.sobject(sObject).upsert(data, externalIdFieldName);
  }

  public async updateSObjectByIds(sObject: string, ids: any[]): Promise<any> {
    return await this.conn.sobject(sObject).update(ids, (err, records) => {
      if (err) {
        return console.error(err);
      }
      return records;
    });
  }

  public async updateSObjectsByExternalId(sObject: string, externalIdFieldName: string, data: SFDC_Object[]): Promise<any> {
    return await this.conn.sobject(sObject).upsert(data, externalIdFieldName);
  }

  public async deleteSObject(sObject: string, id: string): Promise<any> {
    return await this.conn.sobject(sObject).destroy(id);
  }

  public async getSObjectById(sObject: string, id: string, fields?: string[]): Promise<any> {
    return await this.conn.sobject(sObject).retrieve(id, { fields }, (err, record) => {
      if (err) {
        return console.error(err);
      }
      return record;
    });
  }

  public async getSObjectRecordsByField(sObject: string, field: string, value: string): Promise<any> {
    return await this.conn.sobject(sObject).find(`${field} = '${value}'`).execute((err, records) => {
      if (err) { return console.error(err); }
      return records;
    });
  }

  public async getSObjectByIds(sObject: string, ids: string[], fields?: string[]): Promise<any> {
    return await this.conn.sobject(sObject).retrieve(ids, { fields }, (err, records) => {
      if (err) {
        return this.logger.error(err);
      }
      return records;
    });
  }

  public async getApex(endpoint: string): Promise<any> {
    return await this.conn.apex.get(endpoint, (err, result) => {
      if (err) {
        return this.logger.error(err);
      }
      return result;
    });
  }

  public async patchApex(endpoint: string, body: object): Promise<any> {
    return await this.conn.apex.patch(endpoint, body, (err, result) => {
      if (err) {
        return this.logger.error(err);
      }
      return result;
    });
  }

  public async getDocumentBodyJSF(id: string): Promise<any> {
    const url = `/services/data/v${this.apiVersion}/sobjects/Document/${id}/Body`;
    return await this.conn.request(url);
  }

  public async postApex(endpoint: string, body: object): Promise<any> {
    const token = this.conn.accessToken;
    const instanceUrl = this.conn.instanceUrl;
    const url = `${instanceUrl}/services/apexrest/${endpoint}`;
    const myHeaders = new Headers();
    
    myHeaders.append('Authorization', `Bearer ${token}`);
    myHeaders.append('Content-Type', 'application/json');
    myHeaders.append('Accept', 'application/json');

    const requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(body)
    };

    const resp = await fetch(url, requestOptions);
    const json = await resp.json();
    
    this.logger.info('postApex json: ', json);
    if (resp.status !== 200) {
      this.logger.error('saveQuote error: ', json);
      throw new Error(resp.statusText);
    }
    
    const respObj = JSON.parse(json.quoteModel);
    if (!respObj.record) {
      this.logger.error('saveQuote error: ', respObj);
      throw new Error('No quote returned');
    }
    
    const newQuoteModel = new CPQ_QuoteModel();
    Object.assign(newQuoteModel, respObj);
    
    return newQuoteModel;
  }

  public async saveQuoteCPQ(quoteModel: CPQ_QuoteModel): Promise<CPQ_QuoteModel> {
    const endpoint = `/services/apexrest/SBQQ/ServiceRouter`;
    const token = this.conn.accessToken;
    const instanceUrl = this.conn.instanceUrl;
    const url = `${instanceUrl}${endpoint}`;
    const myHeaders = new Headers();
    
    myHeaders.append('Authorization', `Bearer ${token}`);
    myHeaders.append('Content-Type', 'application/json');
    myHeaders.append('Accept', 'application/json');

    const body = {
      saver: 'SBQQ.QuoteAPI.QuoteSaver',
      model: JSON.stringify(quoteModel)
    };

    const requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(body)
    };

    const resp = await fetch(url, requestOptions);
    const json = await resp.json();
    
    if (resp.status !== 200) {
      this.logger.error('saveQuote error: ', json);
      throw new Error(resp.statusText);
    }
    
    const respObj = JSON.parse(json);
    if (!respObj.record) {
      this.logger.error('saveQuote error: ', respObj);
      throw new Error('No quote returned');
    }

    const newQuoteModel = new CPQ_QuoteModel();
    Object.assign(newQuoteModel, respObj);
    
    return newQuoteModel;
  }

  public escapeSOQLString(str: string): string {
    return str.replace(/'/g, "\\'");
  }

  public async deleteQuoteLines(sObject: string, quoteId: string): Promise<any> {
    return await this.conn.sobject(sObject)
      .find({ SBQQ__Quote__c: quoteId })
      .limit(100)
      .destroy();
  }

  public async makeCpqAPICall(method: string, endpoint: string, request: object): Promise<object> {
    const token = this.conn.accessToken;
    const instanceUrl = this.conn.instanceUrl;
    const url = `${instanceUrl}${endpoint}`;
    const myHeaders = new Headers();
    
    myHeaders.append('Authorization', `Bearer ${token}`);
    myHeaders.append('Content-Type', 'application/json');
    myHeaders.append('Accept', 'application/json');

    const body = JSON.stringify(request);

    const requestOptions = {
      method: method,
      headers: myHeaders,
      body: body
    };

    const result = await fetch(url, requestOptions);
    const response = await result.json();
    return response;
  }
}
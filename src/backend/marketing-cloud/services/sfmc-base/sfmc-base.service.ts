import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../../../core/logger/logger.service';
import { SFMC_DataExtensionRow, SFMC_DataExtensionRowsInsertDTO, SFMC_DataExtensionRowsUpsertDTO, SFMC_TransactionalMessage, SFMC_TransactionalMessageRecipient, SFMC_TransactionalMessageResponse, SFMC_TransactionalMessages } from '../../models/sfmc.model';
import { GeneralUtils } from '../../../../core/utils/general.utils';
/******
 * The SFMCBaseService is a wrapper around the SFMC SDK. It is used to post events to SFMC.
 * Each method should check to see if the client has been initialized and initialize it if not.
 */

@Injectable()
export class SfmcBaseService {
  private clientInitialized = false;
  private client: any;
  private client_id: string;
  private client_secret: string;
  private auth_url: string;
  private account_id: number;

  constructor(private configService: ConfigService, private logger: LoggerService) {
    this.client_id = this.configService.get<string>('SFMC_CLIENT_ID');
    this.client_secret = this.configService.get<string>('SFMC_CLIENT_SECRET');
    this.auth_url = this.configService.get<string>('SFMC_AUTH_URL');
    this.account_id = this.configService.get<number>('SFMC_ACCOUNT_ID');
  }

  public async postEntryEvent(contactKey: string, eventDefinitionKey: string, data: any) {
    await this.initializeClient();
    const jsonPayload = {
      ContactKey: contactKey,
      EventDefinitionKey: eventDefinitionKey,
      Data: data,
    };
    this.logger.info('SFMC jsonPayload', jsonPayload);
    const response = await this.client.rest.post('/interaction/v1/events', jsonPayload);
    return response;
  }

  // https://developer.salesforce.com/docs/marketing/marketing-cloud/references/mc_rest_transactional_messaging_email/sendMessageSingleRecipient.html
  public async sendTransactionalMessage(definitionKey: string, email: string, contactKey?: string, attributes?: object): Promise<SFMC_TransactionalMessageResponse> {
    await this.initializeClient();
    const messageKey = GeneralUtils.getUUID();
    const request = new SFMC_TransactionalMessage();
    request.definitionKey = definitionKey;
    const recipient = new SFMC_TransactionalMessageRecipient();
    recipient.contactKey = contactKey || email;
    recipient.to = email;
    if (attributes) {
      recipient.attributes = attributes;
    }
    request.recipient = recipient;
    this.logger.info('SFMC sendTransactionalMessage', request);
    const response = await this.client.rest.post(`/messaging/v1/email/messages/${messageKey}`, request);
    return response as SFMC_TransactionalMessageResponse;
  }

    // https://developer.salesforce.com/docs/marketing/marketing-cloud/references/mc_rest_transactional_messaging_email/sendMessageSingleRecipient.html
    public async sendTransactionalMessages(definitionKey: string, recipients: SFMC_TransactionalMessageRecipient[]): Promise<SFMC_TransactionalMessageResponse> {
      await this.initializeClient();
      const request = new SFMC_TransactionalMessages();
      request.definitionKey = definitionKey;
      recipients.forEach((recipient) => {
        request.recipients.push(recipient);
      });
      this.logger.info('SFMC sendTransactionalMessages', request);
      const response = await this.client.rest.post(`/messaging/v1/email/messages`, request);
      return response as SFMC_TransactionalMessageResponse;
    }

  // https://developer.salesforce.com/docs/marketing/marketing-cloud/guide/insertDataExtensionIDAsync.html
  public async insertDataExtenstionRowsAsync(dataExtensionKey: string, data: SFMC_DataExtensionRow[]) {
    const url = `/data/v1/async/dataextensions/key:${dataExtensionKey}/rows`;
    const dto = new SFMC_DataExtensionRowsInsertDTO(data);
    await this.initializeClient();
    const response = await this.client.rest.post(url, dto);
    return response;
  }

  // https://developer.salesforce.com/docs/marketing/marketing-cloud/guide/postDataExtensionRowsetByKey.html
  public async upsertDataExtenstionRowsSync(dataExtensionKey: string, rows: SFMC_DataExtensionRow[], keyFields: string[]) {
    const url = `/hub/v1/dataevents/key:${dataExtensionKey}/rowset`;
    const rowsToInsert = [];
    rows.forEach((row) => {
      const dto = new SFMC_DataExtensionRowsUpsertDTO(row, keyFields);
      rowsToInsert.push(dto);
    });
    await this.initializeClient();
    const response = await this.client.rest.post(url, rowsToInsert);
    return response;
  }

  // https://www.npmjs.com/package/sfmc-sdk
  private async initializeClient() {
    if (this.clientInitialized) {
      return;
    }
    // hack to get around the fact that the sfmc-sdk is not an esm module
    // https://stackoverflow.com/questions/70545129/compile-a-package-that-depends-on-esm-only-library-into-a-commonjs-package
    const sfmc = await (eval(`import('sfmc-sdk')`) as Promise<typeof import('sfmc-sdk')>);
    // this.logger.log('sfmc', sfmc);
    this.client = new sfmc.default(
        {
            client_id: this.client_id,
            client_secret: this.client_secret,
            auth_url: this.auth_url,
            account_id: this.account_id,
        },
        {
            eventHandlers: {
                onLoop: (type, accumulator) => this.logger.info('SFMC Looping', type, accumulator.length),
                onRefresh: (options) => this.logger.info('SFMC RefreshingToken.', options),
                logRequest: (req) => this.logger.doNotLog(req),
                logResponse: (res) => this.logger.doNotLog(res),
                onConnectionError: (ex, remainingAttempts) => this.logger.error(ex.code, remainingAttempts)
      
            },
            requestAttempts : 1,
            retryOnConnectionError: true
        }
      );
      this.clientInitialized = true;
  }
}

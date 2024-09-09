import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../../../core/logger/logger.service';
import { HttpService } from '@nestjs/axios';
import Avatax from 'avatax';
import { ConfigService } from '@nestjs/config';
import { TaxCalculationRequest } from '../../model/uss-tax-calculation-request.model';
import { TaxCalculationResponse, TaxCalculationResponseLine } from '../../model/tax-calculation-response.mode';

@Injectable()
export class AvalaraCalculateTaxService {
  private client: any;
  private environment: string;

  constructor(private logger: LoggerService, private http: HttpService, private configService: ConfigService) {
    this.environment = this.configService.get('AVALARA_ENVIRONMENT');
    this.client = new Avatax(this.getAvalaraConfig()).withSecurity(this.getAvalaraCredentials());
  }

  // https://developer.avalara.com/api-reference/avatax/rest/v2/methods/Transactions/CreateTransaction/
  async calculateTax(request: TaxCalculationRequest): Promise<TaxCalculationResponse> {
    // this.logger.info('calculateTax request', request);
    const rawResp = await this.client.createTransaction({ model: request });
    const response = new TaxCalculationResponse();
    response.id = rawResp.id;
    response.referenceCode = rawResp.referenceCode;
    response.totalTax = rawResp.totalTax;
    response.lines = rawResp.lines.map((rawLine) => {
      const line = new TaxCalculationResponseLine();
      line.id = rawLine.id;
      line.lineNumber = rawLine.lineNumber;
      line.ref1 = rawLine.ref1;
      line.tax = rawLine.tax;
      line.taxable = rawLine.isItemTaxable;
      return line;
    });
    return response;
  }

  getAvalaraConfig() {
    const config = {
      appName: 'myuss',
      appVersion: '1.0',
      environment: this.getAvalaraEnvironment(),
      machineName: 'google-cloud-run',
      timeout: 5000, // optional, default 20 min
      logOptions: {
        logEnabled: this.getAvalaraLoggingEnabled(), // toggle logging on or off, by default its off.
        logLevel: this.getLogLevel(), // logLevel that will be used, Options are LogLevel.Error (0), LogLevel.Warn (1), LogLevel.Info (2), LogLevel.Debug (3)
        logRequestAndResponseInfo: false, // Toggle logging of the request and response bodies on and off.
        logger: this.logger, // (OPTIONAL) Custom logger can be passed in that implements the BaseLogger interface (e.g. debug, info, warn, error, and log functions) Otherwise console.log/error etc will be used by default.
      },
      // customHttpAgent: this.http, // (OPTIONAL) Define a custom https agent, import https from node to use this constructor. See https://node.readthedocs.io/en/latest/api/https/#https_class_https_agent for more information.
      enableStrictTypeConversion: true, // Ensures that all responses returned by the API methods will be type-safe and match the Models explicitly, For Example, the enums will be returned as integer values instead of as Strings as previously were.
    };
    return config;
  }

  getAvalaraLoggingEnabled(): boolean {
    const loggingEnabled = this.configService.get('AVALARA_LOGGING_ENABLED');
    if (!loggingEnabled) {
      return false;
    }
    return loggingEnabled;
  }

  getLogLevel(): number {
    let appLogLevel: string;
    const configLogLevel = this.logger.logLevel;
    const isProduction = this.logger.isProduction();
    // if the log level is explicitly set, use that
    if (configLogLevel) {
      appLogLevel = configLogLevel;
    } else if (isProduction) {
      // if we are in production, use ERROR
      appLogLevel = 'ERROR';
    } else {
      // otherwise use INFO
      appLogLevel = 'INFO';
    }
    // return the log level as a number
    switch (appLogLevel) {
      case 'DEBUG':
        return 3;
      case 'INFO':
        return 2;
      case 'WARN':
        return 1;
      case 'ERROR':
        return 0;
      default:
        return 0;
    }
  }

  getAvalaraEnvironment(): string {
    // the environment for the app
    const environment = this.configService.get('ENVIRONMENT');
    if (!environment) {
      throw new Error('ENVIRONMENT is undefined');
    }
    // the environment for Avalara
    return environment === 'production' ? 'production' : 'sandbox';
  }

  getAvalaraCredentials(): { username: string; password: string } {
    const credentials = {
      username: this.configService.get('AVALARA_USERNAME'),
      password: this.configService.get('AVALARA_PASSWORD'),
    };
    if (!credentials.username || !credentials.password) {
      throw new Error('AVALARA_USERNAME or AVALARA_PASSWORD is undefined');
    }
    return credentials;
  }
}

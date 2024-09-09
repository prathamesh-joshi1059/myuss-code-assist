import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../../../core/logger/logger.service';
import { HttpService } from '@nestjs/axios';
import Avatax from 'avatax';
import { ConfigService } from '@nestjs/config';
import { TaxCalculationRequest } from '../../model/uss-tax-calculation-request.model';
import { TaxCalculationResponse, TaxCalculationResponseLine } from '../../model/tax-calculation-response.mode';

@Injectable()
export class AvalaraCalculateTaxService {
  private client: Avatax;
  private environment: string;

  constructor(private logger: LoggerService, private http: HttpService, private configService: ConfigService) {
    this.environment = this.configService.get('AVALARA_ENVIRONMENT');
    this.client = new Avatax(this.getAvalaraConfig()).withSecurity(this.getAvalaraCredentials());
  }

  // https://developer.avalara.com/api-reference/avatax/rest/v2/methods/Transactions/CreateTransaction/
  async calculateTax(request: TaxCalculationRequest): Promise<TaxCalculationResponse> {
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

  private getAvalaraConfig() {
    return {
      appName: 'myuss',
      appVersion: '1.0',
      environment: this.getAvalaraEnvironment(),
      machineName: 'google-cloud-run',
      timeout: 5000, // optional, default 20 min
      logOptions: {
        logEnabled: this.getAvalaraLoggingEnabled(),
        logLevel: this.getLogLevel(),
        logRequestAndResponseInfo: false,
        logger: this.logger,
      },
      enableStrictTypeConversion: true,
    };
  }

  private getAvalaraLoggingEnabled(): boolean {
    return !!this.configService.get('AVALARA_LOGGING_ENABLED');
  }

  private getLogLevel(): number {
    const configLogLevel = this.logger.logLevel;
    const isProduction = this.logger.isProduction();
    const appLogLevel = configLogLevel || (isProduction ? 'ERROR' : 'INFO');

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

  private getAvalaraEnvironment(): string {
    const environment = this.configService.get('ENVIRONMENT');
    if (!environment) {
      throw new Error('ENVIRONMENT is undefined');
    }
    return environment === 'production' ? 'production' : 'sandbox';
  }

  private getAvalaraCredentials(): { username: string; password: string } {
    const username = this.configService.get('AVALARA_USERNAME');
    const password = this.configService.get('AVALARA_PASSWORD');

    if (!username || !password) {
      throw new Error('AVALARA_USERNAME or AVALARA_PASSWORD is undefined');
    }
    return { username, password };
  }
}
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ILoggerService {
  info(value: any, ...rest: any[]): void;
  log(value: any, ...rest: any[]): void;
  warn(value: any, ...rest: any[]): void;
  error(value: any, ...rest: any[]): void;
  debug(value: any, ...rest: any[]): void;
}

@Injectable()
export class LoggerService implements ILoggerService {
  private readonly environment: string;
  private readonly logLevel: string;

  constructor(private configService: ConfigService) {
    this.environment = this.configService.get('ENVIRONMENT');
    this.logLevel = this.configService.get('LOG_LEVEL');
  }

  debug(value: any, ...rest: any[]): void {
    if (this.logLevel === 'DEBUG') {
      console.info(value, ...rest);
    }
  }

  info(value: any, ...rest: any[]): void {
    if (!this.isProduction() || ['INFO', 'DEBUG'].includes(this.logLevel)) {
      console.info(value, ...rest);
    }
  }

  log(value: any, ...rest: any[]): void {
    console.log(value, ...rest);
  }

  warn(value: any, ...rest: any[]): void {
    if (!this.isProduction() || ['WARN', 'INFO', 'DEBUG'].includes(this.logLevel)) {
      console.warn(value, ...rest);
    }
  }

  error(value: any, ...rest: any[]): void {
    console.error(value, ...rest);
  }

  private isProduction(): boolean {
    return this.environment === 'production';
  }
}
import { Injectable } from '@nestjs/common';
import {ConfigService} from "@nestjs/config";

export interface ILoggerService {
  info(value: any, ...rest: any[]): void;
  log(value: any, ...rest: any[]): void;
  warn(value: any, ...rest: any[]): void;
  error(value: any, ...rest: any[]): void;
  debug(value: any, ...rest: any[]): void;
}

// TODO [MUS-269]: add logging to database.  maybe change to NestJS Logger
// https://docs.nestjs.com/techniques/logger
@Injectable()
export class LoggerService implements ILoggerService {
  environment = '';
  logLevel = 'ERROR';

  constructor(private configService: ConfigService) {
    this.environment = this.configService.get('ENVIRONMENT');
    this.logLevel = this.configService.get('LOG_LEVEL');
  }

  debug(value: any, ...rest: any[]): void {
    if (this.logLevel === 'DEBUG')
      console.info(value, rest);
  }

  info(value: any, ...rest: any[]): void {
    if (!this.isProduction() || ['INFO', 'DEBUG'].includes(this.logLevel))
      console.info(value, rest);
  }

  log(value: any, ...rest: any[]): void {  
      console.log(value, rest);
  }

  warn(value: any, ...rest: any[]): void {
    if (!this.isProduction() || ['WARN', 'INFO', 'DEBUG'].includes(this.logLevel)) {
      console.warn(value, rest);
    } 
  }

  error(value: any, ...rest: any[]): void {
    console.error(value, rest);
  }

  // dummy method to satisfy interface
  doNotLog(value: any) {
    return;
  }

  public isProduction() {
    return this.environment === 'production';
  }

  private trimMessage(message: string): string {
    let length = 4000;
    return message.substring(0,length);
  }
}

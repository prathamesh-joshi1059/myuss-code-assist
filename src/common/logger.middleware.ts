import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('LoggerMiddleware');
  // tslint:disable-next-line:ban-types
  use(req: Request, res: Response, next: Function) {
    // tslint:disable-next-line:no-console
    this.logger.log(`Request headers: ${JSON.stringify(req.rawHeaders)}`);
    this.logger.log(`Authorization: ${req.headers.authorization}`);
    this.logger.log(`User (middleware): ${JSON.stringify(req['user'])}`);
    // tslint:disable-next-line:no-console
    next();
  }
}

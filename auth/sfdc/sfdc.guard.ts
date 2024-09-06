import { ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class SfdcGuard extends AuthGuard('auth0-management-api') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    return super.canActivate(context) as Promise<boolean>;
  }

  handleRequest(err, user) {
    if (err || !user) {
      Logger.error(err || 'Unauthorized access');
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
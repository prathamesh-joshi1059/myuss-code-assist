import { ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class SfdcGuard extends AuthGuard('auth0-management-api') {
  
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const parentCanActivate = (await super.canActivate(context)) as boolean; 
    return parentCanActivate 
  }
  handleRequest(err, user, info) {
    try {
      if (err || !user ) {
        throw err || new UnauthorizedException();
      }
      return user;
    } catch (e) {
      Logger.error(e);
      throw new UnauthorizedException();
    }
  }
}

import { ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class SidetradeGuard extends AuthGuard('auth0-management-api') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    try {
      if (err || !user || !user.scope) {
        throw err || new UnauthorizedException();
      }
      const scopes = user.scope.split(' ');
      // must include create:sidetrade:user
      if (!scopes.includes('create:sidetrade:user')) {
        throw new UnauthorizedException();
      }
      return user;
    } catch (e) {
      Logger.error(e);
      throw new UnauthorizedException();
    }
  }
}

import { ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class SysadminGuard extends AuthGuard('jwt') {
  
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const parentCanActivate = (await super.canActivate(context)) as boolean; 
    return parentCanActivate 
  }
  handleRequest(err, user, info) {
    try {
      if (err || !user || !user.scope) {
        throw err || new UnauthorizedException();
      }
      const scopes = user.permissions;
      // must include all:redis:sysadmin
      if (!scopes.includes('all:redis:sysadmin')) {
        throw new UnauthorizedException();
      }
      return user;
    } catch (e) {
      Logger.error(e);
      throw new UnauthorizedException();
    }
  }
}

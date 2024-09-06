import { ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class SysadminGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    return (await super.canActivate(context)) as boolean;
  }

  handleRequest(err: any, user: any): any {
    if (err || !user || !user.scope) {
      throw err || new UnauthorizedException();
    }
    if (!user.permissions.includes('all:redis:sysadmin')) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
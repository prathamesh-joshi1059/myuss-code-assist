import { ExecutionContext, Injectable, CanActivate } from '@nestjs/common';
import { LoggerService } from '../../core/logger/logger.service';
import { UserService } from '../services/user/user.service';
import { CacheService } from '../../core/cache/cache.service';
import { ApiRespDTO } from '../../common/dto/api-resp.dto';
@Injectable()
export class AccountIdGuard implements CanActivate {
  constructor(private cacheService: CacheService, private userService: UserService, private logger: LoggerService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    let accountId = '';
    if(request.query.accountId) {
      accountId = request.query.accountId;
    }
    if (request.params.accountId) {
      accountId = request.params.accountId;
    }
    const userObj = await this.cacheService.get<string>('user-' + request.user.sub);
    if (userObj) {
      this.logger.info('In cache');
      let userDataObj = JSON.parse(userObj);
      const checkAccountId = (obj) => obj.accountId === accountId;
      return userDataObj.accounts?.some(checkAccountId);
    } else {
      const userRespObj: ApiRespDTO<any> = await this.userService.fetchProfile(request.user.sub);
      const checkAccountId = (obj) => obj.accountId === accountId;
      return userRespObj.data.accounts?.some(checkAccountId);
    }
  }
}
import { ExecutionContext, Injectable, CanActivate } from '@nestjs/common';
import { LoggerService } from '../../core/logger/logger.service';
import { UserService } from '../services/user/user.service';
import { CacheService } from '../../core/cache/cache.service';
import { TIMEMS_CACHE_USER } from '../../core/utils/constants';
import { QuoteService } from '../services/quote/quote.service';
import { AccountsService } from '../services/accounts/accounts.service';
import { TimeOutForFetchDataInCache } from '../services/quote/constants';
@Injectable()
export class QuoteIdGuard implements CanActivate {
  constructor(
    private cacheService: CacheService,
    private userService: UserService,
    private quoteService: QuoteService,
    private logger: LoggerService,
    private accountService: AccountsService
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    let accountId = request.query.accountId;
    let quoteId = '';
    if (request.params) {
      quoteId = request.params.id;
    }
    if (request.body.quoteId) {
      quoteId = request.body.quoteId;
    }
    if (request.body.id) {
      quoteId = request.body.id;
    }
    let userCacheData = await this.cacheService.get<string>('user-' + request.user.sub);
    //check if userdata is in cache
    if(userCacheData){
      let userObj = JSON.parse(userCacheData);
      const quote = userObj.accountDetails.filter((account: any) => {
        if (account.accountId == accountId) {
          return account.quotes?.includes(quoteId);
        }
      });
      if (quote.length > 0) {
        return true;
      } else {
        let currentAccount;
        // Check in saleforce for quoteId
        const quoteIdsResp = await this.accountService.checkQuoteIdInAccount(accountId, quoteId);
        let quoteIdsForAccount = [];
        if (quoteIdsResp) {
          userObj.accountDetails.filter((account) => {
            if (account.accountId == accountId) {
              account.quotes = account?.quotes ? account.quotes.concat(quoteId): [quoteId];
              currentAccount = account;
              quoteIdsForAccount = account.quotes;
            }
          });
          this.cacheService.set('user-' + request.user.sub, JSON.stringify(userObj), TIMEMS_CACHE_USER);
          this.quoteService.updateAccoutwiseIdsToFirestore({
            accountId: accountId,
            quotes: quoteIdsForAccount,
            auth0Id: request.user.sub,
          });
          return true;
        } else return false;
      }
    }else{
      // Check in saleforce for quoteId
      const quoteIdsResp = await this.accountService.checkQuoteIdInAccount(accountId, quoteId);
      if (quoteIdsResp) {
        this.userService.fetchProfile(request.user.sub);
        return true;
      } else{
        return false;
      }   
    }
  }
}

import { ExecutionContext, Injectable, CanActivate } from '@nestjs/common';
import { LoggerService } from '../../core/logger/logger.service';
import { UserService } from '../services/user/user.service';
import { CacheService } from '../../core/cache/cache.service';
import { TIMEMS_CACHE_USER } from '../../core/utils/constants';
import { QuoteService } from '../services/quote/quote.service';
import { AccountsService } from '../services/accounts/accounts.service';
@Injectable()
export class ContractIdGuard implements CanActivate {
  constructor(
    private cacheService: CacheService,
    private userService: UserService,
    private quoteService: QuoteService,
    private accountService: AccountsService,
    private logger: LoggerService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    let accountId = request.params.accountId;
    let contractId = '';
    if (request.params) {
      contractId = request.params.id || request.params.contractId;
    }
    if (request.body.contractId) {
      contractId = request.body.contractId;
    }
    if (request.query.contractId) {
      contractId = request.query.contractId;
    }
    let userCacheData = await this.cacheService.get<string>('user-' + request.user.sub);
    if(userCacheData){
      let userObj = JSON.parse(userCacheData);
      const contract = userObj.accountDetails.filter((account) => {
        if (account.accountId == accountId) {
          return account.contracts?.includes(contractId);
        }
      });
      if (contract.length > 0) {
        return true;
      } else {
        let currentAccount;
        // load from salesforece
        const contractIdResp = await this.accountService.checkContractIdInAccount(accountId,contractId);
        let contractIdsForAccount = [];
        if (contractIdResp) {
          userObj.accountDetails.filter((account) => {
            if (account.accountId == accountId) {
              account.contracts = account?.contracts ? account.contracts.concat(contractId): [contractId];
              currentAccount = account;
              contractIdsForAccount = account.contracts;
            }
          });
          this.cacheService.set('user-' + request.user.sub, JSON.stringify(userObj), TIMEMS_CACHE_USER);
          this.quoteService.updateAccoutwiseIdsToFirestore({
            accountId: accountId,
            contracts : contractIdsForAccount,
            auth0Id: request.user.sub,
          });
          return true;
        } else return false;
      }
    } else {
      // Check in saleforce for quoteId
      const contractIdsResp = await this.accountService.checkContractIdInAccount(accountId, contractId);
      if (contractIdsResp) {
        this.userService.fetchProfile(request.user.sub);
        return true;
      } else{
        return false;
      }
    }
  }
}
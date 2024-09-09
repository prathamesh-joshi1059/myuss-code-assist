import { Body, Controller, ParseArrayPipe, Post, UseGuards, UseFilters } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LoggerService } from '../../../core/logger/logger.service';
import { SidetradeCreateUserResponse } from '../../../sidetrade/models/sidetrade-create-user-response.dto';
import { SidetradeCreateUserDto } from '../../../sidetrade/models/sidetrade-create-user.dto';
import { UserService } from '../../../sidetrade/services/user/user.service';
import { SidetradeGuard } from '../../../auth/sidetrade/sidetrade/sidetrade.guard';
import { ThrottlerExceptionFilter } from '../../../core/utils/rate-limiting-exception/throttler-exception-filter';
import { GeneralUtils } from '../../../core/utils/general.utils';
import { Auth0User } from '../../../backend/auth0/model/auth0.model';

@UseFilters(ThrottlerExceptionFilter)
@Controller('sidetrade/user')
@ApiTags('sidetrade')
@UseGuards(SidetradeGuard)
export class UserController {
  constructor(private logger: LoggerService, private userService: UserService) {}

  @Post()
  async createUsers(
    @Body(new ParseArrayPipe({ items: SidetradeCreateUserDto })) users: SidetradeCreateUserDto[],
  ): Promise<SidetradeCreateUserResponse[]> {
    if (!users || users.length === 0) {
      return [];
    }
    
    const requestId = GeneralUtils.getUUID();
    this.userService.storeRawRequest(requestId, users);

    users.forEach((user) => {
      user.origin = user.origin || 'new';
      user.accounts = user.accounts.map((account) => account.trim());
    });

    this.logger.info('Starting to create users in Auth0', new Date().toISOString());
    
    let createdUsers: Auth0User[] = [];
    let response: SidetradeCreateUserResponse[] = [];

    if (users.length < 5) {
      const createUsersResp = await this.userService.createAuth0Users(users, requestId);
      this.logger.info('Completed creating users in Auth0', new Date().toISOString());
      createdUsers = createUsersResp.users;
      response = createUsersResp.response;

      this.handlePostCreateUserSteps(requestId, users, createdUsers, response)
        .then(() => {
          this.logger.info('Completed post create user steps', new Date());
        })
        .catch((err) => {
          this.logger.error('Error running post create user steps', users, err);
        });
    } else {
      const bulkCreationErrors = await this.userService.createUsersBulk(users, requestId);
      createdUsers = await this.userService.getAuth0UsersByRequestId(requestId);
      this.logger.info('Completed creating users in Auth0', new Date().toISOString());
      response = this.userService.createResponseFromUsersAndErrors(requestId, users, bulkCreationErrors, createdUsers);
      this.userService.storeErrors(requestId, 'bulkCreationErrors', bulkCreationErrors);
      await this.handlePostCreateUserSteps(requestId, users, createdUsers, response);
    }

    const finalResp = response.map(({ email, success, error }) => ({ email, success, error }));

    this.logger.info('sending response', new Date());
    return finalResp;
  }

  private async handlePostCreateUserSteps(
    requestId: string,
    users: SidetradeCreateUserDto[],
    createdUsers: Auth0User[],
    response: SidetradeCreateUserResponse[]
  ): Promise<void> {
    this.logger.info('Starting to upsert USS Portal users in Salesforce', new Date());
    const ussPortalUsers = await this.userService.upsertUSSPortalUsers(createdUsers);
    this.logger.info('Completed upsert USS Portal users in Salesforce', new Date());

    this.logger.info('Starting getAccountsForUsers', new Date());
    const accounts = await this.userService.getAccountsForUsers(users);
    this.logger.info('Completed getAccountsForUsers', new Date());

    this.logger.info('Starting linkUSSPortalUsersToContacts', new Date());
    await this.userService.linkUSSPortalUsersToContacts(requestId, users, ussPortalUsers, accounts);
    this.logger.info('Completed linkUSSPortalUsersToContacts', new Date());

    this.logger.info('Starting updateAccountsForMyUSSAndBilling', new Date());
    await this.userService.updateAccountsForMyUSSAndBilling(accounts);
    this.logger.info('Completed updateAccountsForMyUSSAndBilling', new Date());

    this.logger.info('Starting updateRolesAndModuleAccess', new Date());
    await this.userService.updateRolesAndModuleAccess(requestId, users, ussPortalUsers, accounts);
    this.logger.info('Completed updateRolesAndModuleAccess', new Date());

    this.logger.info('Starting sendToSFMC', new Date());
    await this.userService.sendToSFMC(users, response);
    this.logger.info('Completed sendToSFMC', new Date());
  }
}
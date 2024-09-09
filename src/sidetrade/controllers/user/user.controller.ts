import { Body, Controller, ParseArrayPipe, Post, UseGuards , UseFilters} from '@nestjs/common';
import { ApiProperty, ApiTags } from '@nestjs/swagger';
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
    if (!users || !users.length || users.length === 0) {
      return [];
    }
    // create a request id
    const requestId = GeneralUtils.getUUID();
    // store the raw request in firestore async
    this.userService.storeRawRequest(requestId, users)
    // set default origin
    users.forEach((user) => {
      user.origin = user.origin || 'new';
      // trim account number
      user.accounts = user.accounts.map((account) => {
        return account.trim();
      });
    });

    // create or find the users in Auth0
    this.logger.info('Starting to create users in Auth0', new Date().toISOString());
    let createdUsers: Auth0User[] = [];
    let response: SidetradeCreateUserResponse[] = [];
    if (users.length < 5) {
      const createUsersResp = await this.userService.createAuth0Users(users, requestId);
      this.logger.info('Completed creating users in Auth0', new Date().toISOString());
      createdUsers = createUsersResp.users;
      response = createUsersResp.response;
      // if this is a small batch, run the post create user steps async to speed up the response
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
      // log errors to firestore
      this.userService.storeErrors(requestId, 'bulkCreationErrors', bulkCreationErrors);
      // for large batches, run the post create user steps synchronously so we don't get backed up
      await this.handlePostCreateUserSteps(requestId, users, createdUsers, response);
    }
    // strip out the isExistingUser property, ST isn't expecting that so shallow copy the array without the property
    const finalResp = [];
    response.forEach((user) => {
      finalResp.push({ 
        email: user.email,
        success: user.success,
        error: user.error,    
      });
    });
    this.logger.info('sending response', new Date());
    return finalResp;
  }

  private async handlePostCreateUserSteps(requestId: string, users: SidetradeCreateUserDto[], createdUsers: Auth0User[], response: SidetradeCreateUserResponse[]) {
    // upsert USS Portal users in Salesforce
    this.logger.info('Starting to upsert USS Portal users in Salesforce', new Date());
    const ussPortalUsers = await this.userService.upsertUSSPortalUsers(createdUsers);
    this.logger.info('Completed upsert USS Portal users in Salesforce', new Date());
    // Get all accounts for the users
    this.logger.info('Starting getAccountsForUsers', new Date());
    const accounts = await this.userService.getAccountsForUsers(users);
    this.logger.info('Completed getAccountsForUsers', new Date());
    // Link USS Portal users to Contacts in Salesforce
    this.logger.info('Starting linkUSSPortalUsersToContacts', new Date());
    await this.userService.linkUSSPortalUsersToContacts(requestId, users, ussPortalUsers, accounts);
    this.logger.info('Completed linkUSSPortalUsersToContacts', new Date());
    // Update Accounts for MyUSS and Billing
    this.logger.info('Starting updateAccountsForMyUSSAndBilling', new Date());
    const accountUpdateResult = await this.userService.updateAccountsForMyUSSAndBilling(accounts);
    this.logger.info('Completed updateAccountsForMyUSSAndBilling', new Date());
    // Update AccountContactRelations with default role and all Account Modules
    this.logger.info('Starting updateRolesAndModuleAccess', new Date());
    await this.userService.updateRolesAndModuleAccess(requestId, users, ussPortalUsers, accounts);
    this.logger.info('Completed updateRolesAndModuleAccess', new Date());
    // Send migrated and new users to SFMC 
    this.logger.info('Starting sendToSFMC', new Date());
    await this.userService.sendToSFMC(users, response);
    this.logger.info('Completed sendToSFMC', new Date());
  }


  


}

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SFMC_SidetradeMigratedUser } from '../../models/sfmc-sidetrade-user-migration';
import { SfmcBaseService } from '../sfmc-base/sfmc-base.service';
import { LoggerService } from '../../../../core/logger/logger.service';
import { SFMC_TransactionalMessageRecipient, SFMC_TransactionalMessageResponse } from '../../models/sfmc.model';

@Injectable()
export class SFMC_SidetradeUserMigrationService {
  private sidetradeMigratedUsersDEKey: string;
  private sidetradeNewUserEventKey: string;

  constructor(
    private logger: LoggerService,
    private configService: ConfigService,
    private sfmcBaseService: SfmcBaseService,
  ) {
    this.sidetradeMigratedUsersDEKey = this.configService.get<string>('SFMC_ST_MIGRATION_DE_KEY');
    this.sidetradeNewUserEventKey = this.configService.get<string>('SFMC_ST_NEW_USER_EVENT_KEY');
  }

  async postMigratedUsers(users: SFMC_SidetradeMigratedUser[]): Promise<void> {
    if (!this.sidetradeMigratedUsersDEKey) {
      this.logger.error('SFMC_ST_MIGRATION_DE_KEY is not set');
      return;
    }
    if (!users || users.length === 0) {
      this.logger.info('No users to post to SFMC');
      return;
    }
    await this.sfmcBaseService.upsertDataExtenstionRowsSync(this.sidetradeMigratedUsersDEKey, users, ['email']);
  }

  async triggerNewUserEmails(users: SFMC_SidetradeMigratedUser[]): Promise<SFMC_TransactionalMessageResponse | void> {
    if (!this.sidetradeNewUserEventKey) {
      this.logger.error('SFMC_ST_NEW_USER_EVENT_KEY is not set');
      return;
    }
    if (!users || users.length === 0) {
      this.logger.info('No users to trigger new user email');
      return;
    }

    const requests: SFMC_TransactionalMessageRecipient[] = users.map((user) => {
      const attributes = {
        EmailAddress: user.email,
        active_in_sidetrade: false,
        myuss_existing_user: user.myuss_existing_user,
      };
      const recipient = new SFMC_TransactionalMessageRecipient();
      recipient.contactKey = user.email;
      recipient.to = user.email;
      recipient.attributes = attributes;
      return recipient;
    });

    return await this.sfmcBaseService.sendTransactionalMessages(this.sidetradeNewUserEventKey, requests);
  }
}
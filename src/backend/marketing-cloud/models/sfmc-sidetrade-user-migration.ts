// 2024-01-31: This model supports the migration of users from Sidetrade to Auth0.
import { SFMC_DataExtensionRow } from "./sfmc.model";

// It can be deprecated after the migration is complete, March 2024.
export class SFMC_SidetradeMigratedUser extends SFMC_DataExtensionRow {
  email: string;
  active_in_sidetrade: boolean;
  myuss_existing_user: boolean;
}


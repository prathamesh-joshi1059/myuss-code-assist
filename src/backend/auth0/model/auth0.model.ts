export class Auth0User {
  user_id?: string;
  given_name: string;
  family_name: string;
  email: string;
  email_verified: boolean;
  verify_email: boolean;
  app_metadata?: AppMetadata;
  user_metadata?: UserMetadata;
  custom_password_hash?: CustomPasswordHash;
}

export class CreateAuth0UserDTO extends Auth0User {
  connection: string;
  password: string;

  constructor(user?: Auth0User, connection?: string, password?: string) {
    super();
    this.user_id = user.user_id;
    this.given_name = user.given_name;
    this.family_name = user.family_name;
    this.email = user.email;
    this.email_verified = user.email_verified;
    this.verify_email = user.verify_email;
    this.password = password;
    this.app_metadata = user.app_metadata;
    this.user_metadata = user.user_metadata;
    this.custom_password_hash = user.custom_password_hash;
    this.connection = connection;
  }
}

export class BulkUserImport {
  users: Auth0User[];

  constructor(users?: Auth0User[]) {
    this.users = users || [];
  }
}

export class AppMetadata {
  has_completed_onboarding: boolean;
  sidetrade_migrated_user: boolean;
  sidetrade_origin: string;
  sidetrade_activated: boolean;
  sidetrade_user_batch: string;
}

export class UserMetadata {
}

export class CustomPasswordHash {
  algorithm: string;
  hash: Hash;
}

export class Hash {
  value: string;
}

export class ErrorMessage {
  message: string;
  errorMessage: string;
  error: any;
}
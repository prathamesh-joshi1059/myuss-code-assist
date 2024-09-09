import { SFDC_Object } from './SFDC_Base';

export class User extends SFDC_Object {
  Id: string;
  FirstName: string;
  LastName: string;
  Name?: string;
  Phone?: string;
  Email: string;
  Title?: string;
  UserName?: string;

  public setTypeAttribute(): void {
    super._setTypeAttribute('User');
  }
}

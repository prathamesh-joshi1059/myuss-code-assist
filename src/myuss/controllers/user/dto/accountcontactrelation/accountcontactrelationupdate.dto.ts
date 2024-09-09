import { IsString } from 'class-validator';

export class AccountContactRelationUpdateDto {
  @IsString()
  Id: string;
  @IsString()
  Roles: string;

  @IsString()
  MyUSS_User_Role__c?: string;

  @IsString()
  MyUSS_Modules__c? : string;
}

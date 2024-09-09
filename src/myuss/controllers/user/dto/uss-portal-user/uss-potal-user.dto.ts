import { IsString } from 'class-validator';
export class USSPortalUserDto {
  @IsString()
  Auth0_Id__c: string
  @IsString()
  Email_Address__c: string
  @IsString()
  Name: string
}

import { IsString } from 'class-validator';
export class ContactDto {
  @IsString()
  Id: string;
  @IsString()
  AccountId: string;
  @IsString()
  LastName: string;
  @IsString()
  FirstName: string;
  @IsString()
  Phone: string;
  @IsString()
  Email: string;
  @IsString()
  USS_Portal_User__c: string;
}

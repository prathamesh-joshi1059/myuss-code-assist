import { IsBoolean, IsString } from 'class-validator';
export class AccountDto {
  @IsString()
  Name: string;
  @IsString()
  RecordTypeId: string;
  @IsString()
  Phone: string;
  @IsString()
  Customer_Segment__c: string;
  @IsString()
  Business_Type__c: string;
  @IsString()
  Auto_Pay_Requirement__c: string;
  @IsBoolean()
  MyUSS_Billing_Enabled__c: boolean;
  @IsBoolean()
  MyUSS_Cases_Enabled__c: boolean;
  @IsBoolean()
  MyUSS_Easy_Pay_Enabled__c: boolean;
  @IsBoolean()
  MyUSS_Enabled__c: boolean;
  @IsBoolean()
  MyUSS_Home_Enabled__c: boolean;
  @IsBoolean()
  MyUSS_Orders_Enabled__c: boolean;
  @IsBoolean()
  MyUSS_Projects_Enabled__c: boolean;
  @IsBoolean()
  MyUSS_Quotes_Enabled__c: boolean;
}

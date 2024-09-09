import {IsString } from 'class-validator';
export class GetContactsRespDTO {
    @IsString()
    recordId: string;
    @IsString()
    accountId: string;
    @IsString()
    contactId: string;
    @IsString()
    firstName: string;
    @IsString()
    lastName: string;
    @IsString()
    email: string;
    @IsString()
    phone: string;
  }
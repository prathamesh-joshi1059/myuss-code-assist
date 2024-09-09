import {  IsString, IsNotEmpty } from "class-validator";


export class UpdateProfileReqDTO {
    @IsNotEmpty()
    @IsString()
    accountId: string;
    
    @IsNotEmpty()
    @IsString()
    firstName: string;

    @IsNotEmpty()
    @IsString()
    lastName: string;
    emailIds?: string[];
    contactId?: string;
  }
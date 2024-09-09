
import { IsArray, IsBoolean, IsString, IsNotEmpty, isNotEmpty, isString } from "class-validator";


export class SignupReqDTO {
   
    @IsString()
    email: string;
    
    @IsString()
    auth0Id: string;

    @IsString()
    name: string;

    @IsString()
    phone: string;

    @IsString()
    accountName: string;
 
    @IsString()
    customerSegment: string;
 
    @IsString()
    businessType: string;

    @IsString()
    lastName: string;
 
    @IsString()
    firstName: string;
  }
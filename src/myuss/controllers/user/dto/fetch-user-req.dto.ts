import {  IsString, IsNotEmpty } from "class-validator";


export class FetchUserReqDTO {
    @IsNotEmpty()
    @IsString()
    Id: string;
    
    // @IsString()
    // token: string;
  }
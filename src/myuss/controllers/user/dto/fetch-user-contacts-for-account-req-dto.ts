import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsString } from "class-validator";

export class FetchUserContactsForAccountReqDto {

    @ApiProperty({description: 'isActive', example: false})
    @IsBoolean()
    isAllContacts: boolean;


    @ApiProperty({description: 'accountId', example: '0018I00000jKsQUQA0'})
    @IsString()
    accountId: string;


  }
  
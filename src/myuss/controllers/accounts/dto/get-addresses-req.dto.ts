import { ApiProperty } from "@nestjs/swagger";
import { IsString , IsNotEmpty } from "class-validator";
export class GetAddressesReqDto {
    @ApiProperty({description: 'Account Id', example: "0018I00000jKsQUQA0"})
    @IsString()
    @IsNotEmpty()
    id: string;
}
import { ApiProperty } from "@nestjs/swagger";
import { IsString , IsNotEmpty } from "class-validator";
export class NotificationReqDTO {
    @ApiProperty({description: 'Account Id', example: "0018I00000jJnLkQAK"})
    @IsString()
    @IsNotEmpty()
    accountId: string;
}
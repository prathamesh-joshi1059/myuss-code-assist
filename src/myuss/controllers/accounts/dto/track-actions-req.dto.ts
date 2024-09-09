import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString , IsNotEmpty } from "class-validator";
export class TrackActionsReqDTO {

    @ApiProperty({description: 'Contact Id', example: "0038I00000fpSY1QAM"})
    @IsString()
    @IsNotEmpty()
    contactId: string;

    @ApiPropertyOptional({description: 'Quote Id', example: "a6O8I000000HHRmUAO"})
    @IsString()
    @IsNotEmpty()
    quoteId: string;

    @ApiProperty({description: 'User Action', example: "Changed Order End Date"})
    @IsString()
    @IsNotEmpty()
    userAction: string;

    @ApiPropertyOptional({description: 'Contract Id', example: "0038I00000fp29FQAQ"})
    @IsString()
    @IsNotEmpty()
    contractId: string;

    @ApiProperty({description: 'Screen Name', example: "Order Details Screen"})
    @IsString()
    @IsNotEmpty()
    screenName: string;
}
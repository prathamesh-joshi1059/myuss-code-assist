import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, MaxLength } from "class-validator";

export class AddCommentReqDto {
    @ApiProperty({description: 'comment', example: "Test comment"})
    @IsString()
    @IsNotEmpty()
    @MaxLength(4000)
    comment: string;
    @ApiProperty({description: 'caseId', example: "5008I00000RQYy3QAH"})
    @IsString()
    @IsNotEmpty()
    caseId: string;
    @ApiProperty({description: 'userId', example: "0058I000002qRuGQAU"})
    @IsString()
    @IsNotEmpty()
    contactId: string;
    @ApiProperty({description: 'pickList:- Status, request, general question, pricing', example: "Status"})
    @IsString()
    @IsNotEmpty()
    type: string;
}
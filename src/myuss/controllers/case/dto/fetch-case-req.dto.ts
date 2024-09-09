import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class FetchCaseReqDto {
    @ApiProperty({description: 'startTime', example: "2022-10-03"})
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    startTime: string;
    @ApiProperty({description: 'endTime', example: "2024-04-03"})
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    endTime: string;
    @ApiProperty({description: 'status', example: "open/closed"})
    @IsString()
    @IsNotEmpty()
    status: string;
    @ApiProperty({description: 'contactId', example: "0038I00000fp29FQAQ"})
    @IsString()
    @IsOptional()
    contactId: string;
    @ApiProperty({description: 'projectId', example: "a0I8I00000Q5j9lUAB"})
    @IsString()
    @IsOptional()
    projectId: string;
    
}
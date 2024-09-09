import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";


export class GetProjectsReqDto {
    @ApiPropertyOptional({description: 'Status - pass as an query to get projects', example: "Active"})
    @IsString()
    @IsOptional()
    status: string;

    @ApiProperty({description: 'accountId', example: "0018I00000jKsQUQA0"})
    @IsString()
    @IsNotEmpty()
    accountId: string;

    @ApiPropertyOptional({description: 'Fetch top 3 projects', example: "true"})
    @IsString()
    @IsOptional()
    isRecent: string;


}
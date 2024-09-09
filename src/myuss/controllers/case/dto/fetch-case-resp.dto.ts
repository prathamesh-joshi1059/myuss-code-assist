import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { Case } from "../../../models/case.model";

export class FetchCaseRespDto {
    @ApiProperty({description: 'startTime', example: "2024-04-03T06:24:29.000+0000"})
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    cases : Case [] | [];
}
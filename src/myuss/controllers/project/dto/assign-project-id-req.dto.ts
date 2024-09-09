import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ArrayMinSize, IsArray, IsBoolean, IsNotEmpty, IsObject, IsOptional, IsString } from "class-validator";
import { AddressDTO, ContactDTO } from "src/common/dto/address.req_res_dto";


export class AssignProjectIdReqDto {
    @ApiProperty({description: 'Quote Ids', example: ["8008I000000JM0IQAW"]})
    @IsArray()
    @ArrayMinSize(1)
    @IsNotEmpty()
    quoteIds: [];

    @ApiProperty({description: 'Project Id', example: "8008I000000JM0IQAW"})
    @IsString()
    @IsNotEmpty()
    projectId: string;

}
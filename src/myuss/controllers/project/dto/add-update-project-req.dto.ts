import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsObject, IsOptional, IsString } from "class-validator";
import { AddressDTO, ContactDTO } from "src/common/dto/address.req_res_dto";


export class AddUpdateProjectReqDto {

    @ApiPropertyOptional({description: 'id', example: "23982347239472"})
    @IsString()
    @IsOptional()
    id: string;

    @ApiPropertyOptional({description: 'name', example: "Test project"})
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({description: 'description', example: "Test project details"})
    @IsString()
    @IsOptional()
    description: string;

    @ApiPropertyOptional({description: 'Project Type', example: "Event"})
    @IsString()
    @IsNotEmpty()
    projectType: string;

    @ApiProperty({description: 'Start Date', example: "Test project details"})
    @IsString()
    @IsNotEmpty()
    startDate: string;

    @ApiPropertyOptional({description: 'End Date', example: "Test project"})
    @IsString()
    @IsOptional()
    endDate: string;

    @ApiProperty({description: 'isContactExists', example: true})
    @IsBoolean()
    @IsNotEmpty()
    isContactExists: string;

    @IsObject()
    @ApiProperty()
    @IsNotEmpty()
    contact: ContactDTO;

    @IsObject()
    @ApiProperty()
    @IsNotEmpty()
    address: AddressDTO;

    @ApiProperty({description: 'accountId', example: "0018I00000jIg0sQAC"})
    @IsString()
    @IsNotEmpty()
    accountId: string;


    @ApiProperty({description: 'Status', example: "Inactive"})
    @IsString()
    @IsNotEmpty()
    status: string;





}


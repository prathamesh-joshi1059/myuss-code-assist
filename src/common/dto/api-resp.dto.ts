import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString } from "class-validator";

export class ApiRespDTO<T> {
    @ApiProperty({description:'Success of API response - which is boolean',example:"true", format: "boolean"})
    @IsOptional()
    success?:boolean;
    @ApiProperty({description:'Status of API response - custom status',example:"1000", format: "number"})
    @IsNumber()
    status:number;
    @ApiProperty({description:'Message of API response',example:"Success", format: "string"})
    @IsOptional()
    @IsString()
    message?:string;
    @ApiProperty({description:'Data object which is different for every response',example:"{}", format: "object"})
    data?: T;
}

   
    
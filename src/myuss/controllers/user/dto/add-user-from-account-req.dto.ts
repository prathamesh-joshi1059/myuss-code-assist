import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsBoolean, IsOptional, IsString } from "class-validator";


export class AddUpdateUserContactForAccountReqDto {
    @ApiProperty({description: 'firstName', example: "Dummy"})
    @IsString()
    @IsOptional()
    firstName: string;

    @ApiProperty({description: 'lastName', example: "Name"})
    @IsString()
    @IsOptional()
    lastName: string;

    @ApiProperty({description: 'phoneNumber', example: "9348384383"})
    @IsString()
    @IsOptional()
    phoneNumber: string;

    @ApiProperty({description: 'email', example: "abc@gmail.com"})
    @IsString()
    @IsOptional()
    email: string;

    @ApiProperty({description: 'myUssUserRole', example: "Standard User"})
    @IsString()
    @IsOptional()
    myUssUserRole: string;

    @ApiProperty({description: 'myUssModules', example: "MyUSS Enabled;MyUSS Home Enabled;MyUSS Quotes Enabled"})
    @IsString()
    @IsOptional()
    myUssModules: string;

    @ApiProperty({description: 'isActive', example: true})
    @IsBoolean()
    @IsOptional()
    isActive: boolean;

    @ApiProperty({description: 'id', example: "07k8I00000GIOaEQAX"})
    @IsString()
    @IsOptional()
    id: string;

    @ApiProperty({description: 'accountId', example: "0018I00000jKsQUQA0"})
    @IsString()
    @IsOptional()
    accountId: string;

    @ApiProperty({description: 'contactId', example: "07k8I00000GIOaEQAX"})
    @IsString()
    @IsOptional()
    contactId: string;

  }
  
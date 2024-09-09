import {IsNotEmpty, IsString, Length, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ZipcodeReqDTO {
    @ApiProperty({description: 'Postal Code', example: '02446'})
    @IsString()
    @IsNotEmpty()
    @Length(5,5)
    postalCode: string
}
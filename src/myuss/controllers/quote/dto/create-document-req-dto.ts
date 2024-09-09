import {IsString, IsNotEmpty } from 'class-validator';

export class CreateDocumentReqDTO {
    @IsNotEmpty()
    @IsString()
    id: string;
  }
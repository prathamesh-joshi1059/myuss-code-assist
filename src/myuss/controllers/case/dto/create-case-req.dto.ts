import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCaseDto {
  @ApiProperty({ description: 'accessNotes', example: '' })
  @IsString()
  @IsOptional()
  accessNotes: string;
  @ApiProperty({ description: 'accountId', example: '0018I00000jKsQUQA0' })
  @IsString()
  @IsNotEmpty()
  accountId: string;
  @ApiProperty({ description: 'caseRegion', example: 'Eastern' })
  @IsString()
  @IsOptional()
  caseRegion: string;
  @ApiProperty({ description: 'caseSubType', example: 'Quantity/Frequency Change' })
  @IsString()
  @IsOptional()
  caseSubType: string;
  @ApiProperty({ description: 'contactId', example: '0038I00000fp29FQAQ' })
  @IsString()
  @IsOptional()
  contactId: string;
  @ApiProperty({
    description: 'productInfo',
    example:
      '{"Details":[{"label": "Product", "fieldName": "Product" },{"label": "Size", "fieldName": "Size"},{"label": "Quantity", "fieldName":"Quantity", "cellAttributes": {"alignment": "left"}},{ "label": "Service Frequency", "fieldName": "Service Frequency"},{"label": "Price", "fieldName": "Price", "type":"currency", "cellAttributes": {"alignment": "left"}},{"label": "Action", "fieldName": "Action"},{"label": "Notes", "fieldName": "Notes"}],"Data":[{"Product":"Standard Restroom","Size":"","Quantity":"1","Service Frequency":"","Price":"50","Action":"increase quantity","Notes":""}]}',
  })
  @IsString()
  @IsOptional()
  productInfo: string;
  @ApiProperty({ description: 'details', example: 'Details provided for the case by the user' })
  @IsString()
  @IsOptional()
  description: string;
  @ApiProperty({ description: 'selectedDate', example: '2024-06-03' })
  @IsString()
  @IsOptional()
  selectedDate: string;
  @ApiProperty({ description: 'placementNote', example: 'Test placement note' })
  @IsString()
  @IsOptional()
  placementNote: string;
  @ApiProperty({ description: 'siteAddress', example: '13 Pleasant St, Brookline, MA, USA' })
  @IsString()
  @IsOptional()
  siteAddress: string;
  @ApiProperty({ description: 'siteCityName', example: 'Brookline' })
  @IsString()
  @IsOptional()
  siteCityName: string;
  @ApiProperty({ description: 'siteContactName', example: 'Gaurav Narvekar' })
  @IsString()
  @IsOptional()
  siteContactName: string;
  @ApiProperty({ description: 'siteContactPhone', example: '9123810283' })
  @IsString()
  @IsOptional()
  siteContactPhone: string;
  @ApiProperty({ description: 'siteStateName', example: 'MA' })
  @IsString()
  @IsOptional()
  siteStateName: string;
  @ApiProperty({ description: 'orderName', example: 'O-515531' })
  @IsString()
  @IsOptional()
  orderName: string;
  @ApiProperty({ description: 'zipcode', example: '02446' })
  @IsString()
  @IsOptional()
  zipcode: string;
  @ApiProperty({ description: 'Unit Number', example: ['232949240'] })
  @IsArray()
  @IsOptional()
  unitNumbers: string[];
  @ApiProperty({ description: 'Subject for MySiteServices case', example: 'MySiteServices' })
  @IsString()
  @IsOptional()
  subject: string;
  @ApiProperty({
    description: 'Summary of the Case - for Order Support, this will land in the Instructions for Order Support field',
    example: `Change Type: Increase
            Unit Type: (1) Standard Restroom  
            Location: 31390 Southwest 207th Ave - Homestead - FL / 31390 Southwest 207th Avenue (by the door) 
            On: 6/27/2024 
            Notes:  Some notes from the customer about the action needed.`,
  })
  @IsString()
  @IsOptional()
  summary: string;
  @ApiProperty({
    description: 'MyUSS Case Type',
    example:
      ' Move | Add New Unit Type | Change Service Frequency | Change Quantity - Add Units | Change Quantity - Reduce Units',
  })
  @IsString()
  @IsOptional()
  myussCaseType: string;
}

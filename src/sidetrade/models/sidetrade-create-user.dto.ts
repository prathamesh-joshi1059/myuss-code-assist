import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsBoolean, IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, ValidateNested, isNotEmpty } from "class-validator";

// export class SidetradeCreateUsersListDto {
//   @IsArray()
//   @ArrayMinSize(1)
//   @ValidateNested({ each: true })
//   @Type(() => SidetradeCreateUserDto)
//   items: SidetradeCreateUserDto[];
// }

export class SidetradeCreateUserDto {
  @ApiProperty({
    description: 'The email of the user',
    example: 'test@test.com'})
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'The given (first) name of the user',
    example: 'Adam'})
  @IsString()
  @IsOptional()
  given_name: string;

  @ApiProperty({
    description: 'The family (last) name of the user',
    example: 'Smith'})
  @IsString()
  @IsOptional()
  family_name: string;

  @ApiProperty({
    description: 'The origin of the user, either "new" or "migration"',
    example: 'migration',
    enum: ['new', 'migration'],
    default: 'new'
  })
  @IsString()
  @IsIn(['new', 'migration'])
  @IsOptional()
  origin: 'new' | 'migration';

  @ApiProperty({
    description: 'Whether the user is activated in SideTrade or not',
    example: true})
  @IsBoolean()
  @IsNotEmpty({
    message: 'activated is required'
  })
  activated: boolean;

  @ApiProperty({
    description: 'list of account numbers',
    example: ['ACT-1234567890', 'ACT-0987654321']
  })
  @IsArray()
  accounts: string[];

}
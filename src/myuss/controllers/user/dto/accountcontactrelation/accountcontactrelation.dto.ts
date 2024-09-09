
import { IsString } from 'class-validator';
export class AccountContactRelationDto {
    @IsString()
    AccountId:string;
    @IsString()
    ContactId:string;
    @IsString()
    Roles:string;
}

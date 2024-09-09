import { IsString } from 'class-validator';
export class LastLoginUpdateDto {
  @IsString()
  emailId: string
}

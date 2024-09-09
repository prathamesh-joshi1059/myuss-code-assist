import { IsString } from 'class-validator';
export class ChangePasswordReqDto {
  @IsString()
  readonly email: string;
}

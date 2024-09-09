import { ApiProperty } from '@nestjs/swagger';
export class ZipcodeRequest {
  postalCode: string;
}
export class ZipCodeResponse {
  status: number;
  message: string;
  data: ZipCodeResult;
}
export class ZipCodeResult {
  isServiceable: boolean;
  containmentTrayRequiredForRestroom: boolean;
  error?: string;
}

export class ZipcodeSuccessResponse {
  @ApiProperty({ description: 'Postal Code', example: true, default: false })
  isServiceable: true;
  containmentTrayRequiredForRestroom: false;
}

export class ZipcodeFailureResponse {
  @ApiProperty({ description: 'Postal Code', example: false, default: false })
  isServiceable: false;
  containmentTrayRequiredForRestroom: false;
}




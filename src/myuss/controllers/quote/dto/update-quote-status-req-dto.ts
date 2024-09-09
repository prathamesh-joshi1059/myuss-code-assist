import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UpdateQuoteStatusReqDTO {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  quoteId: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  status: string;

  @IsOptional()
  @IsString()
  rejectReason:string;

  @IsOptional()
  @IsString()
  rejectReasonFeedback:string;
}
export class MockReqJSON {
    "quoteId":"a6O8I000000HE1YUAW"
    "status":"Approved"
}
export class MockRespJSON {
    "status": 1000
    "message": "Success"
}
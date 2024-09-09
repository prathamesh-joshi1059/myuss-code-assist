
import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from "class-validator";
import { AddressDTO, ContactDTO } from "../../../../common/dto/address.req_res_dto";

  export class SiteDetailsReqDTO {
    @IsNotEmpty()
    @IsString()
    @ApiProperty({description:'Request Id', example: "$2a$10$H.SkwEj/HuzrXwgsoLDsR.x3TnB8CE7QWeiuJ3T9UdDu0HU.t/Xhrq"})
    requestId: string;
    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    startDate: string;
    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    endDate: string;
    @IsObject()
    @ApiProperty()
    contactData: ContactDTO;
    @IsObject()
    @ApiProperty()
    addressData: AddressDTO;
    @IsString()
    @ApiProperty({description:'Quote Id', example: "a6OVA0000001oNl2AI"})
    quoteId: string;
    @IsString()
    @ApiProperty()
    contactId: string;
    @IsString()
    @ApiProperty()
    addressId: string;
    @IsBoolean()
    @ApiProperty()
    contactExist: boolean;
    subSites: SubSite[];
    
    @IsOptional()    
    @IsString()
    @ApiProperty()
    ussPortalUserId:string
  }
  export class SubSite {
    @IsObject()
    @ApiProperty()
    bundles: Bundle[];
    @IsString()
    @ApiProperty()
    siteName: string;
    @IsString()
    @ApiProperty()
    addressId: string;
  }
  export class Bundle {
    @ApiProperty()
    quantity: number;
    @ApiProperty({description:'Bundle Id', example: "01t3m00000PPH5WAAX"})
    bundleId: string;
    @ApiProperty({description:'Bundle Name', example: "Tank Bundle"})
    bundleName: string;
    @ApiProperty({description:'Asset Id', example: "01t3m00000NTiuRAAT"})
    assetId: string;
    @ApiProperty({description:'Asset Name', example: "Standard Restroom Sink and Crane Hook"})
    assetName: string;
    @ApiProperty({description:'Service Id', example: "01t3m00000POgyIAAT"})
    serviceId: string;
    @ApiProperty({description:'Service Name', example: "1 Service 2 Days per Week"})
    serviceName: string;
    @ApiProperty({description:'Quote Line Id', example: "a6KVA0000003GMo2AM"})
    quoteLineId: string;
  }
  
  //for delete quoted job site
  export class DeleteQuotedJobSiteReqDTO {
    @IsString()
    @ApiProperty()
    requestId: string;
    @IsString()
    @ApiProperty()
    quoteId: string;
    @IsString()
    @ApiProperty()
    addressId: string;
  }

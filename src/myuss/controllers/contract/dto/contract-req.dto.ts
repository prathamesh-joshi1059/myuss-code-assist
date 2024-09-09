import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ArrayMinSize, IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, Length } from "class-validator";

export class ContractQueryReqDto {
    @ApiProperty({description: 'Status - pass as an query to get contracts', example: "Activated,Suspended,Ordered"})
    @IsString()
    @IsNotEmpty()
    status: string;
    @ApiProperty({description: 'Status - pass as an query to get contracts', example: "Activated,Suspended,Ordered"})
    @IsString()
    @IsOptional()
    projectId: string;

}

export class GetContractDetailsDto{
    @ApiProperty({description: 'Contract Id - to get contract details of specific contract', example: "8008I000000J93WQAS"})
    id?: string;
    @IsString()
    @IsNotEmpty()
    contractId: string;
    @IsString()
    @IsNotEmpty()
    accountId: string;
}

export class CancelContractReqDto{
    @ApiProperty({description: 'Contract Id - to cancel the contract', example: "8008I000000JN6NQAW"})
    @IsString()
    @IsNotEmpty()
    id: string;

    @ApiPropertyOptional({description: 'End date of the contract', example: "2024-01-08"})
    @IsString()
    @IsOptional()
    endDate: string;

    @ApiPropertyOptional({description: 'Pickup Reason to end the contract', example: "Job complete"})
    @IsString()
    @IsOptional()
    pickupReasonCode : string;

    @ApiPropertyOptional({description: 'Note to end the contract', example: "Dummy note"})
    @IsString()
    @IsOptional()
    note : string;
}


export class ConfirmEasyPayReqDto{
    @ApiProperty({description: 'Contract Ids', example: ["8008I000000JM0IQAW"]})
    @IsArray()
    @ArrayMinSize(1)
    @IsNotEmpty()
    contractIds: [];

    @ApiProperty({description: 'Payment method Id', example: "pm_1OKEhpKX1Bgoxru0UkR2ZcTb"})
    @IsString()
    @IsNotEmpty()
    paymentMethodId: string;

}


export class EditQuantityReqDto{
    @IsArray()
    @ArrayMinSize(1)
    @IsNotEmpty()
    quantityChange: ChangeQuantityReqDto[];

}

export class ChangeQuantityReqDto {

    @ApiProperty({description: 'type', example: "Delivery"})
    @IsString()
    @IsNotEmpty()
    type: string;

    @ApiProperty({description: 'quantity', example: 5})
    @IsNumber()
    @IsNotEmpty()
    quantity: string;

    @ApiProperty({description: 'jobsiteId', example: "a8x8I000000CoZkQAK"})
    @IsString()
    @IsNotEmpty()
    jobsiteId: string;

    @ApiProperty({description: 'assetId', example: "01t3m00000NTiw6AAD"})
    @IsString()
    @IsNotEmpty()
    assetId: string;

    @ApiProperty({description: 'changedDate', example: "2024-04-25"})
    @IsString()
    @IsNotEmpty()
    changedDate: string;

    @ApiProperty({description: 'startDate', example: "2024-04-25"})
    @IsString()
    @IsNotEmpty()
    startDate: string;

    @ApiProperty({description: 'endDate', example: "2049-12-31"})
    @IsString()
    @IsNotEmpty()
    endDate: string;

    @ApiProperty({description: 'serviceSubscriptionId', example: "a6aVA0000000IoDYAU"})
    @IsString()
    @IsNotEmpty()
    serviceSubscriptionId: string;

    @ApiProperty({description: 'serviceProductId', example: "01t3m00000NTivwAAD"})
    @IsString()
    @IsNotEmpty()
    serviceProductId: string;

    @ApiProperty({description: 'pickupReasonCode', example: "Need to return"})
    @IsString()
    @IsNotEmpty()
    pickupReasonCode: string;

    @ApiProperty({description: 'orderId', example: "800VA000002q5vKYAQ"})
    @IsString()
    @IsNotEmpty()
    orderId: string;

    @ApiProperty({description: 'bundleId', example: "a6aVA0000000xOHYAY"})
    @IsString()
    @IsNotEmpty()
    rootSub: string;

    @ApiProperty({description: 'Note', example: "Job is completed"})
    @IsString()
    @IsNotEmpty()
    note: string;

    @ApiProperty({description: 'Unit Numbers Array os String', example: "[45679, 45680]"})
    @IsArray()
    @IsOptional()
    unitNumbers: string[];
}

export class ChangeQuantityOrderModel {
    Type: string;
    ChangeInQuantity: string;
    Jobsite: string;
    Product2Id: string;
    RequestedDate: string;
    StartDate: string;
    EndDate: string;
    serviceSubscriptionId: string;
    orderId: string;
    serviceProductId: string;
    rootSub: string;
    customerOwned: boolean;
    requestType: string;
    PickupReasonCode: string;
    specialInstructions: string;


    constructor(order: ChangeQuantityReqDto) {
        this.Type = order.type;
        this.ChangeInQuantity = order.quantity;
        this.Jobsite = order.jobsiteId;
        this.Product2Id = order.assetId;
        this.RequestedDate = order.changedDate;
        this.StartDate = order.startDate;
        this.EndDate = order.endDate;
        this.serviceSubscriptionId = order.serviceSubscriptionId;
        this.orderId = order.orderId;
        this.serviceProductId = order.serviceProductId;
        this.rootSub = order.rootSub;
        this.customerOwned = false;
        this.requestType = "None"
        this.PickupReasonCode = order.pickupReasonCode;
        
        let specialInstruction;
            if(order.unitNumbers && order.unitNumbers.length > 0){
              specialInstruction = `Asset Serial Numbers - ${order.unitNumbers.join(", ")} | Notes - ${order.note}`
         }else{
            specialInstruction = `Asset Serial Numbers - Not provided | Notes - ${order.note}`
         }
            this.specialInstructions = specialInstruction;
   
    }
}
   
  

export class SearchByUnitNumberReqDto {
  @ApiProperty({ description: 'Unit Number - pass as an query to get results', example: '73277277' })
  @IsString()
  @IsNotEmpty()
  @Length(8,10)
  unitNumber: string;
  @IsString()
  @IsNotEmpty()
  accountId: string;
}
   